import re
from typing import List
from packages.check_registry.base import CheckPlugin, CheckContext, register_check
from packages.shared.schemas import Issue, Location, Evidence

@register_check
class FormLabelAssociationCheck(CheckPlugin):
    id = "A11Y-LBL-01"
    name = "Form Input Missing Associated Label"
    layer = "UX"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that all input fields have an associated label element or explicit aria-label."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        # Search for input tags lacking id, aria-label, aria-labelledby, or title
        unlabeled = re.findall(r"<input(?![^>]*type=[\"']hidden[\"'])(?![^>]*aria-label)[^>]*>", dom, re.IGNORECASE)
        offending = []
        for inp in unlabeled:
            if "id=" not in inp:
                offending.append(inp[:50] + "...>")
                if len(offending) >= 2:
                    break

        if offending:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Input Field Missing Label or aria-label",
                problem=f"Found {len(offending)} input field(s) without an associated <label> or aria-label attribute.",
                evidence=Evidence(measured_values={"unlabeled_inputs": offending}, expected_values={"labeled": True}),
                location=Location(selector="input:not([aria-label])"),
                fix_goal="Add an explicit <label for=\"...\"> element or an aria-label attribute describing the input purpose.",
                constraints=["Ensure label is visible or screen-reader accessible."],
                acceptance_check="Every non-hidden input element must have an accessible label."
            )]
        return []

@register_check
class PlaceholderOnlyCheck(CheckPlugin):
    id = "A11Y-PHL-01"
    name = "Input Relies Exclusively on Placeholder"
    layer = "UX"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Detects inputs using placeholder text as a substitute for a persistent label."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        placeholder_only = re.findall(r"<input[^>]*placeholder=[\"'][^\"']+[\"'](?![^>]*aria-label)[^>]*>", dom, re.IGNORECASE)
        # Check if there is an associated label tag in DOM
        if placeholder_only and "<label" not in dom:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Input Relies Exclusively on Placeholder Text",
                problem="Input field uses placeholder text as its only label. Placeholders vanish upon typing and have poor default contrast.",
                evidence=Evidence(measured_values={"sample_input": placeholder_only[0][:60]}, expected_values={"has_persistent_label": True}),
                location=Location(selector="input[placeholder]"),
                fix_goal="Provide a persistent label above the input (or floating label) instead of relying solely on placeholder copy.",
                constraints=["Retain placeholder as supportive example text only."],
                acceptance_check="Input must be accompanied by persistent label text."
            )]
        return []

@register_check
class FocusVisibilityCheck(CheckPlugin):
    id = "A11Y-FOC-01"
    name = "Stripped Focus Outline"
    layer = "UX"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Flags styles removing focus outlines (outline: none or outline: 0) without a custom replacement ring."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        stripped = bool(re.search(r"outline:\s*(?:none|0)(?![^;]*(?:ring|box-shadow|border))", dom, re.IGNORECASE))
        if stripped:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Focus Ring Stripped Without Replacement",
                problem="CSS rule sets 'outline: none' or 'outline: 0' on interactive elements without an alternative focus indicator, breaking keyboard navigation.",
                evidence=Evidence(measured_values={"outline_none_found": True}, expected_values={"visible_focus_ring": True}),
                location=Location(selector="*:focus"),
                fix_goal="Implement an explicit focus ring: e.g. focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary.",
                constraints=["Use :focus-visible to keep mouse clicks clean while providing keyboard focus."],
                acceptance_check="Tab focus on all interactive elements must display an unmistakable focus indicator."
            )]
        return []

@register_check
class TabIndexCheck(CheckPlugin):
    id = "A11Y-TAB-01"
    name = "Positive TabIndex Anti-Pattern"
    layer = "UX"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that tabindex > 0 is avoided, as it breaks the natural visual DOM reading order."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        positive_tabs = re.findall(r"tabindex=[\"']([1-9][0-9]*)[\"']", dom, re.IGNORECASE)
        if positive_tabs:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Positive TabIndex (>0) Breaks Tab Sequence",
                problem=f"Found tabindex values ({', '.join(positive_tabs[:3])}) greater than zero, disrupting predictable keyboard navigation.",
                evidence=Evidence(measured_values={"positive_tabindex_values": positive_tabs[:3]}, expected_values={"max_tabindex": 0}),
                location=Location(selector="[tabindex]"),
                fix_goal="Remove positive tabindex attributes; re-order HTML source elements to match desired focus order.",
                constraints=["Use tabindex=\"0\" or tabindex=\"-1\" only."],
                acceptance_check="No elements should use tabindex > 0."
            )]
        return []

@register_check
class ContrastCheck(CheckPlugin):
    id = "A11Y-CONT-01"
    name = "Low Text Contrast Ratio (<4.5:1)"
    layer = "UI"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Flags faint text colors (light gray on white or dark gray on dark background) that fail WCAG AA contrast."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        # Detect common vibe-coder low-contrast hex values on light backgrounds
        faint_colors = re.findall(r"color:\s*(#(?:ccc|ddd|eee|999|aaa|bbb|d1d5db|e5e7eb)[0-9a-f]*)", dom, re.IGNORECASE)
        if faint_colors:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Low Text Contrast Ratio (<4.5:1)",
                problem=f"Found faint text color '{faint_colors[0]}' failing WCAG AA 4.5:1 minimum contrast requirement.",
                evidence=Evidence(measured_values={"faint_color": faint_colors[0]}, expected_values={"min_contrast_ratio": "4.5:1"}),
                location=Location(selector=f"[style*='{faint_colors[0]}']"),
                fix_goal="Darken text color to meet at least 4.5:1 contrast against background (e.g. text-gray-700 / #374151).",
                constraints=["Preserve dark/light theme consistency."],
                acceptance_check="Contrast ratio of all readable text must be >= 4.5:1."
            )]
        return []
