import re
from typing import List
from packages.check_registry.base import CheckPlugin, CheckContext, register_check
from packages.shared.schemas import Issue, Location, Evidence

@register_check
class ConsoleErrorsCheck(CheckPlugin):
    id = "PROD-CNSL-01"
    name = "Uncaught Console Errors in Production"
    layer = "Production"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that no uncaught JavaScript exceptions or 404/500 asset errors were emitted to the browser console."

    def run(self, context: CheckContext) -> List[Issue]:
        errors = [c for c in context.page_data.console_logs if c.get("type") == "error"]
        if errors:
            first_err = errors[0].get("text", "Unknown console error")
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Uncaught JavaScript Error in Production Console",
                problem=f"Encountered {len(errors)} console error(s). First error: '{first_err[:120]}'.",
                evidence=Evidence(measured_values={"error_count": len(errors), "sample_error": first_err[:200]}, expected_values={"console_errors": 0}),
                location=Location(selector="window.onerror"),
                fix_goal="Investigate and catch the runtime exception using Error Boundaries (React) or try/catch blocks.",
                constraints=["Prevent uncaught exceptions from breaking page hydration."],
                acceptance_check="Page must load without emitting console.error messages."
            )]
        return []

@register_check
class LocalhostLeakCheck(CheckPlugin):
    id = "PROD-LEAK-01"
    name = "Localhost or Staging URLs Leaked in DOM"
    layer = "Production"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Detects development or localhost URLs (http://localhost, 127.0.0.1) hardcoded into href or src attributes."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        leaks = re.findall(r"(?:href|src)=[\"'](https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0)[^\"']*)[\"']", dom, re.IGNORECASE)
        if leaks:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Development 'localhost' URL Leaked in Production DOM",
                problem=f"Found hardcoded local development URL in markup: '{leaks[0]}'.",
                evidence=Evidence(measured_values={"leaked_url": leaks[0]}, expected_values={"environment_relative_urls": True}),
                location=Location(selector=f"[href*='{leaks[0]}'], [src*='{leaks[0]}']"),
                fix_goal="Replace hardcoded localhost URLs with environment variables (e.g. process.env.NEXT_PUBLIC_API_URL or relative paths).",
                constraints=["Do not point production builds to local ports."],
                acceptance_check="No 'localhost' or '127.0.0.1' URLs should appear in production markup."
            )]
        return []

@register_check
class UndefinedLeakCheck(CheckPlugin):
    id = "PROD-UNDEF-01"
    name = "Literal 'undefined' Rendered in DOM Text"
    layer = "Production"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Detects literal string 'undefined' visible to users due to unhandled variable interpolation."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        # Search for 'undefined' in tag content (excluding scripts/styles)
        body_text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", dom, flags=re.DOTALL | re.IGNORECASE)
        match = re.search(r">[^<]*\b(undefined)\b[^<]*<", body_text)
        if match:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Literal 'undefined' Rendered to User",
                problem="UI displays unhandled 'undefined' text string resulting from missing state or incomplete prop interpolation.",
                evidence=Evidence(measured_values={"rendered_literal": "undefined"}, expected_values={"handled_fallback": True}),
                location=Location(selector="*:has-text('undefined')"),
                fix_goal="Add nullish coalescing or default fallback: value ?? 'Default' or condition ? value : null.",
                constraints=["Never render raw JavaScript runtime tokens to end users."],
                acceptance_check="Visible text must never evaluate to literal 'undefined'."
            )]
        return []

@register_check
class NanLeakCheck(CheckPlugin):
    id = "PROD-NAN-01"
    name = "Literal 'NaN' Rendered in DOM Text"
    layer = "Production"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Detects literal string 'NaN' in rendered text from failed mathematical calculations."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        body_text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", dom, flags=re.DOTALL | re.IGNORECASE)
        match = re.search(r">[^<]*\b(NaN)\b[^<]*<", body_text)
        if match:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Literal 'NaN' Rendered to User",
                problem="Numerical calculation failed, rendering raw 'NaN' in the user interface.",
                evidence=Evidence(measured_values={"rendered_literal": "NaN"}, expected_values={"valid_number_or_dash": True}),
                location=Location(selector="*:has-text('NaN')"),
                fix_goal="Guard calculation with isNaN() check or provide fallback number (e.g. Number(val) || 0).",
                constraints=["Display '-' or 0 instead of NaN."],
                acceptance_check="Visible text must never display 'NaN'."
            )]
        return []

@register_check
class ObjectObjectLeakCheck(CheckPlugin):
    id = "PROD-OBJ-01"
    name = "Literal '[object Object]' Rendered in DOM Text"
    layer = "Production"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Detects unstringified JavaScript objects rendered directly into DOM text nodes."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        body_text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", dom, flags=re.DOTALL | re.IGNORECASE)
        match = re.search(r">[^<]*(\[object Object\])[^<]*<", body_text)
        if match:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Literal '[object Object]' Rendered in UI",
                problem="JavaScript object was rendered directly as a child node without accessing a specific string property.",
                evidence=Evidence(measured_values={"rendered_literal": "[object Object]"}, expected_values={"property_string": True}),
                location=Location(selector="*:has-text('[object Object]')"),
                fix_goal="Render a specific object field (e.g. user.name instead of user) or JSON.stringify(item).",
                constraints=["Inspect the component props."],
                acceptance_check="No '[object Object]' text nodes in DOM."
            )]
        return []
