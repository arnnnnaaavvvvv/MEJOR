from typing import List
from packages.check_registry.base import CheckPlugin, CheckContext, register_check
from packages.shared.schemas import Issue, Location, Evidence

@register_check
class LoadingStateCheck(CheckPlugin):
    id = "SIM-LOAD-01"
    name = "Missing Skeleton / Loading State Feedback"
    layer = "States"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "C"
    description = "Evaluates whether UI shows skeleton placeholders or spinner feedback when network requests are delayed by 3000ms."

    def run(self, context: CheckContext) -> List[Issue]:
        if context.simulation_type == "DELAY":
            dom = context.primary_vp.dom_html if context.primary_vp else ""
            has_feedback = any(w in dom.lower() for w in ("skeleton", "loading", "spinner", "animate-pulse", "aria-busy"))
            if not has_feedback:
                return [Issue(
                    check_id=self.id,
                    layer=self.layer,
                    severity=self.default_severity,
                    confidence=self.confidence,
                    tier=self.tier,
                    title="Missing Skeleton or Loading State During Delayed Network",
                    problem="During 3000ms network request delay simulation, page displayed no skeleton screens, progress indicator, or aria-busy state.",
                    evidence=Evidence(measured_values={"loading_indicator_detected": False, "simulation": "DELAY_3000MS"}, expected_values={"loading_feedback": True}),
                    location=Location(selector="main"),
                    fix_goal="Add a skeleton placeholder or pulsing placeholder (animate-pulse) while data is in-flight.",
                    constraints=["Maintain layout height during loading to prevent CLS."],
                    acceptance_check="Page must display a skeleton or spinner state during delayed data fetches."
                )]
        return []

@register_check
class ErrorStateCheck(CheckPlugin):
    id = "SIM-ERR-01"
    name = "Unhandled API Failure (500 Error) State"
    layer = "States"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "C"
    description = "Checks that failing an API route with HTTP 500 renders a clear user-facing error message with retry button rather than a blank or broken layout."

    def run(self, context: CheckContext) -> List[Issue]:
        if context.simulation_type == "ERROR_500":
            dom = context.primary_vp.dom_html if context.primary_vp else ""
            has_error_ui = any(w in dom.lower() for w in ("something went wrong", "error", "failed to load", "try again", "retry"))
            if not has_error_ui:
                return [Issue(
                    check_id=self.id,
                    layer=self.layer,
                    severity=self.default_severity,
                    confidence=self.confidence,
                    tier=self.tier,
                    title="Unhandled API Failure (No User-Facing Error UI)",
                    problem="When dynamic API routes failed with HTTP 500, page rendered a blank container without informing the user or providing a retry action.",
                    evidence=Evidence(measured_values={"error_ui_detected": False, "simulation": "HTTP_500_INJECTION"}, expected_values={"error_fallback_ui": True}),
                    location=Location(selector="main"),
                    fix_goal="Render an explicit error state with helpful message and 'Try Again' button when fetch operations fail.",
                    constraints=["Wrap data components in React ErrorBoundary or catch state."],
                    acceptance_check="UI must display an actionable error message when data fetching returns HTTP 500."
                )]
        return []

@register_check
class OfflineFeedbackCheck(CheckPlugin):
    id = "SIM-OFFL-01"
    name = "Missing Offline Feedback"
    layer = "States"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "C"
    description = "Checks if the page provides feedback when the client loses network connectivity."

    def run(self, context: CheckContext) -> List[Issue]:
        if context.simulation_type == "OFFLINE":
            dom = context.primary_vp.dom_html if context.primary_vp else ""
            has_offline = any(w in dom.lower() for w in ("offline", "disconnected", "no internet", "reconnecting"))
            if not has_offline:
                return [Issue(
                    check_id=self.id,
                    layer=self.layer,
                    severity=self.default_severity,
                    confidence=self.confidence,
                    tier=self.tier,
                    title="No Offline Indicator Upon Disconnection",
                    problem="When page was placed offline, no banner or notification informed the user of lost network connectivity.",
                    evidence=Evidence(measured_values={"offline_indicator_found": False}, expected_values={"offline_indicator": True}),
                    location=Location(selector="body"),
                    fix_goal="Add an offline event listener (window.addEventListener('offline')) that shows a subtle toast or banner.",
                    constraints=["Do not obscure primary navigation."],
                    acceptance_check="A notification banner should alert users when offline."
                )]
        return []

@register_check
class NoJsFallbackCheck(CheckPlugin):
    id = "SIM-NOJS-01"
    name = "Blank Screen When JavaScript is Disabled"
    layer = "States"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "C"
    description = "Verifies that the page provides an SSR baseline or `<noscript>` notice when JS is disabled."

    def run(self, context: CheckContext) -> List[Issue]:
        if context.simulation_type == "NO_JS":
            dom = context.primary_vp.dom_html if context.primary_vp else ""
            has_noscript = "<noscript" in dom.lower()
            text_length = len(dom.replace("<", " ").replace(">", " ").split())
            if not has_noscript and text_length < 20:
                return [Issue(
                    check_id=self.id,
                    layer=self.layer,
                    severity=self.default_severity,
                    confidence=self.confidence,
                    tier=self.tier,
                    title="Blank Screen When JavaScript Disabled",
                    problem="When JavaScript is disabled, the page renders almost completely blank without a <noscript> fallback notification.",
                    evidence=Evidence(measured_values={"noscript_tag_present": False, "rendered_words": text_length}, expected_values={"has_noscript": True}),
                    location=Location(selector="noscript"),
                    fix_goal="Add a <noscript> tag in <head> or <body> advising users that JavaScript is required, or adopt SSR/SSG.",
                    constraints=["Provide minimum helpful text."],
                    acceptance_check="Page must display a helpful notice when JavaScript is disabled."
                )]
        return []

@register_check
class ChaosTextOverflowCheck(CheckPlugin):
    id = "SIM-CHAO-01"
    name = "Chaos Mode: Button/Container Overflow under +40% Text"
    layer = "UI"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "C"
    description = "Tests layout resilience when text labels expand by +40% (simulating translation/localization)."

    def run(self, context: CheckContext) -> List[Issue]:
        if context.simulation_type == "CHAOS_TEXT":
            mobile_vp = context.page_data.viewport_data.get(390)
            if mobile_vp:
                # Check for elements breaking width
                for sel, box in mobile_vp.element_boxes.items():
                    if ("button" in sel or "card" in sel) and box.get("width", 0) > 390:
                        return [Issue(
                            check_id=self.id,
                            layer=self.layer,
                            severity=self.default_severity,
                            confidence=self.confidence,
                            tier=self.tier,
                            title="Container Layout Broken Under +40% Text Expansion",
                            problem=f"Element '{sel}' stretched to {box['width']}px under localized text expansion (+40%), exceeding viewport width.",
                            evidence=Evidence(measured_values={"overflow_width": box["width"]}, expected_values={"max_width": 390}),
                            location=Location(selector=sel),
                            fix_goal="Make container widths flexible (flex-wrap, min-width: 0, or dynamic padding) instead of fixed widths.",
                            constraints=["Allow buttons to wrap or scale."],
                            acceptance_check="Containers must not overflow viewport when text expands by 40%."
                        )]
        return []
