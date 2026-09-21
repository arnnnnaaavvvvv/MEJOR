import re
from typing import List
from packages.check_registry.base import CheckPlugin, CheckContext, register_check
from packages.shared.schemas import Issue, Location, Evidence
from packages.check_registry.checks.design_system import parse_px

@register_check
class LineLengthCheck(CheckPlugin):
    id = "UI-LINE-01"
    name = "Excessive Line Length"
    layer = "UX"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that body paragraphs do not span more than 75-80 characters per line."

    def run(self, context: CheckContext) -> List[Issue]:
        if not context.primary_vp:
            return []
        dom = context.primary_vp.dom_html
        paragraphs = re.findall(r"<p[^>]*>(.*?)</p>", dom, re.DOTALL | re.IGNORECASE)
        long_p = []
        for p in paragraphs:
            text = re.sub(r"<[^>]+>", "", p).strip()
            if len(text) > 120 and "max-w" not in p and "max-width" not in p:
                long_p.append(text[:60] + "...")
                if len(long_p) >= 2:
                    break

        if long_p:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Excessive Text Line Length (>75 Chars)",
                problem="Body copy paragraphs span unbounded widths without a max-width constraint (e.g. max-w-prose / 65ch).",
                evidence=Evidence(measured_values={"samples": long_p}, expected_values={"max_chars_per_line": 75}),
                location=Location(selector="p"),
                fix_goal="Constrain reading paragraph widths to max-width: 65ch or 640px to improve reading ergonomics.",
                constraints=["Apply max-width to copy container or prose wrapper."],
                acceptance_check="Body paragraph line lengths should comfortably fit within 45 to 75 characters."
            )]
        return []

@register_check
class LineHeightCheck(CheckPlugin):
    id = "UI-LHGT-01"
    name = "Tight Line Height"
    layer = "UI"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Detects body copy with line-height < 1.3 causing visual collision between lines."

    def run(self, context: CheckContext) -> List[Issue]:
        if not context.primary_vp:
            return []
        for sel, style in context.primary_vp.computed_styles.items():
            if sel.startswith("p") or sel.startswith("span"):
                lh = style.get("lineHeight", "")
                fs = style.get("fontSize", "")
                lh_px = parse_px(lh)
                fs_px = parse_px(fs)
                if lh_px > 0 and fs_px > 0 and (lh_px / fs_px) < 1.25:
                    return [Issue(
                        check_id=self.id,
                        layer=self.layer,
                        severity=self.default_severity,
                        confidence=self.confidence,
                        tier=self.tier,
                        title="Tight Line Height on Body Text (<1.3)",
                        problem=f"Text at '{sel}' has computed line-height ratio of {round(lh_px/fs_px, 2)}, causing cramped text.",
                        evidence=Evidence(measured_values={"line_height_ratio": round(lh_px/fs_px, 2), "selector": sel}, expected_values={"min_ratio": 1.4}),
                        location=Location(selector=sel),
                        fix_goal="Increase line-height to at least 1.5 (e.g. leading-relaxed or line-height: 1.5).",
                        constraints=["Preserve font size."],
                        acceptance_check="Computed line-height to font-size ratio must be >= 1.4."
                    )]
        return []

@register_check
class HeadingScaleCheck(CheckPlugin):
    id = "UI-HEAD-01"
    name = "Heading Scale Hierarchy Inversion"
    layer = "UI"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Ensures h1 is visually larger than h2, and h2 is larger than h3."

    def run(self, context: CheckContext) -> List[Issue]:
        if not context.primary_vp:
            return []
        h1_size = 0.0
        h2_size = 0.0
        for sel, style in context.primary_vp.computed_styles.items():
            if sel.startswith("h1"):
                h1_size = max(h1_size, parse_px(style.get("fontSize", "")))
            elif sel.startswith("h2"):
                h2_size = max(h2_size, parse_px(style.get("fontSize", "")))

        if h1_size > 0 and h2_size > 0 and h2_size >= h1_size:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Heading Scale Inversion (H2 >= H1)",
                problem=f"H2 computed font-size ({h2_size}px) is equal to or larger than H1 ({h1_size}px).",
                evidence=Evidence(measured_values={"h1_px": h1_size, "h2_px": h2_size}, expected_values={"h1_greater_than_h2": True}),
                location=Location(selector="h2"),
                fix_goal="Establish clear typographic hierarchy where H1 is noticeably larger than H2 by at least 1.25x.",
                constraints=["Maintain responsive typography on smaller viewports."],
                acceptance_check="H1 font size must exceed H2 font size."
            )]
        return []

@register_check
class ButtonLabelCheck(CheckPlugin):
    id = "UI-BTN-01"
    name = "Empty or Icon-Only Button Missing Label"
    layer = "UX"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Detects interactive buttons without text or aria-label attributes."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        empty_btns = re.findall(r"<button(?![^>]*aria-label)[^>]*>\s*(?:<svg[^>]*>.*?</svg>)?\s*</button>", dom, re.DOTALL | re.IGNORECASE)
        if empty_btns:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Button Missing Accessible Label / Text",
                problem="Button contains only an icon or empty space without an aria-label or accessible text node.",
                evidence=Evidence(measured_values={"empty_button_count": len(empty_btns)}, expected_values={"has_text_or_aria_label": True}),
                location=Location(selector="button:not([aria-label])"),
                fix_goal="Add an explicit aria-label attribute (e.g. aria-label=\"Close modal\" or aria-label=\"Search\").",
                constraints=["Do not alter visual layout."],
                acceptance_check="All buttons must have non-empty text content or a non-empty aria-label."
            )]
        return []

@register_check
class NavClutterCheck(CheckPlugin):
    id = "UI-NAV-01"
    name = "Navigation Item Overcrowding"
    layer = "UX"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Flags top navigation bars with >7 links competing for attention."

    def run(self, context: CheckContext) -> List[Issue]:
        links = context.page_data.nav_links
        if len(links) > 7:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Navigation Bar Clutter (>7 Links)",
                problem=f"Primary navigation contains {len(links)} top-level links, increasing cognitive friction.",
                evidence=Evidence(measured_values={"nav_link_count": len(links)}, expected_values={"max_links": 7}),
                location=Location(selector="nav"),
                fix_goal="Group secondary pages into a dropdown menu or footer navigation.",
                constraints=["Keep high-converting CTA visible."],
                acceptance_check="Top navigation bar should expose 7 or fewer primary items."
            )]
        return []

@register_check
class CardDensityCheck(CheckPlugin):
    id = "UI-CARD-01"
    name = "Card Padding Density Too Tight"
    layer = "UI"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that card containers have sufficient internal whitespace."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        cramped = re.findall(r"class=[\"'][^\"']*(?:card|panel)[^\"']*[\"'][^>]*style=[\"'][^\"']*padding:\s*([0-4]px)", dom, re.IGNORECASE)
        if cramped:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Cramped Card Container Padding (<8px)",
                problem="Card components define padding under 8px, causing text to touch borders.",
                evidence=Evidence(measured_values={"card_paddings": cramped}, expected_values={"min_card_padding": "16px"}),
                location=Location(selector=".card"),
                fix_goal="Increase card internal padding to at least 16px (p-4 or p-6 in Tailwind).",
                constraints=["Ensure card contents wrap gracefully."],
                acceptance_check="Card container internal padding must be >= 12px."
            )]
        return []

@register_check
class AlignmentDriftCheck(CheckPlugin):
    id = "UI-ALGN-01"
    name = "Left-Edge Alignment Inconsistency"
    layer = "UI"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that main content headers and body sections share consistent left alignment."

    def run(self, context: CheckContext) -> List[Issue]:
        if not context.primary_vp:
            return []
        x_coords = set()
        for sel, box in context.primary_vp.element_boxes.items():
            if sel.startswith("h1") or sel.startswith("p:nth-of-type(1)"):
                x_coords.add(round(box.get("x", 0), -1))

        if len(x_coords) > 3:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Left-Edge Content Alignment Drift",
                problem=f"Found {len(x_coords)} disparate left margin origins for core content blocks.",
                evidence=Evidence(measured_values={"x_coordinates": list(x_coords)}, expected_values={"max_alignments": 2}),
                location=Location(selector="main"),
                fix_goal="Align primary text and headings to a common container left guideline.",
                constraints=["Check responsive breakpoints."],
                acceptance_check="Headings and primary copy must share unified left bounding edge within container."
            )]
        return []
