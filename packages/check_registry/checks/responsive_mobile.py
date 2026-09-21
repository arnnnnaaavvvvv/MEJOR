import re
from typing import List
from packages.check_registry.base import CheckPlugin, CheckContext, register_check
from packages.shared.schemas import Issue, Location, Evidence, BoundingBox
from packages.check_registry.checks.design_system import parse_px

@register_check
class MobileHorizontalOverflowCheck(CheckPlugin):
    id = "MOBI-OVR-01"
    name = "Mobile Horizontal Viewport Overflow"
    layer = "UI"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Checks whether page contents overflow window width on mobile devices (390px, 360px), inducing horizontal scrolling."

    def run(self, context: CheckContext) -> List[Issue]:
        mobile_vp = context.page_data.viewport_data.get(390) or context.page_data.viewport_data.get(360)
        if not mobile_vp:
            return []

        overflowing = []
        for sel, box in mobile_vp.element_boxes.items():
            right_edge = box.get("x", 0) + box.get("width", 0)
            if right_edge > (mobile_vp.viewport + 2): # allow 2px tolerance
                overflowing.append((sel, right_edge))
                if len(overflowing) >= 2:
                    break

        if overflowing:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Mobile Horizontal Overflow (Induced Scrollbar)",
                problem=f"Element '{overflowing[0][0]}' reaches {overflowing[0][1]}px, exceeding the {mobile_vp.viewport}px mobile screen width.",
                evidence=Evidence(
                    measured_values={"element": overflowing[0][0], "right_edge_px": overflowing[0][1], "viewport_width": mobile_vp.viewport},
                    expected_values={"max_width_px": mobile_vp.viewport},
                    viewport=mobile_vp.viewport
                ),
                location=Location(selector=overflowing[0][0]),
                fix_goal="Add max-w-full, overflow-x-hidden, or replace fixed pixel widths with 100% / w-full.",
                constraints=["Do not hide required content."],
                acceptance_check=f"No element boundary may exceed {mobile_vp.viewport}px on mobile viewports."
            )]
        return []

@register_check
class MobileTapTargetCheck(CheckPlugin):
    id = "MOBI-TAP-01"
    name = "Undersized Mobile Tap Target"
    layer = "UX"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that interactive buttons and navigation links meet the WCAG 2.5.5 minimum 44px x 44px touch hitbox."

    def run(self, context: CheckContext) -> List[Issue]:
        mobile_vp = context.page_data.viewport_data.get(390) or context.page_data.viewport_data.get(360)
        if not mobile_vp:
            return []

        undersized = []
        for sel, box in mobile_vp.element_boxes.items():
            if ("button" in sel or "a" in sel) and not sel.startswith("nav"):
                w = box.get("width", 0)
                h = box.get("height", 0)
                if 0 < w < 44 or 0 < h < 44:
                    undersized.append((sel, w, h, box))
                    if len(undersized) >= 2:
                        break

        if undersized:
            target = undersized[0]
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Undersized Mobile Tap Target (<44x44px)",
                problem=f"Interactive element '{target[0]}' has a touch bounding box of {round(target[1], 1)}x{round(target[2], 1)}px, failing minimum touch ergonomics.",
                evidence=Evidence(
                    measured_values={"width": target[1], "height": target[2]},
                    expected_values={"min_width": 44, "min_height": 44},
                    viewport=mobile_vp.viewport
                ),
                location=Location(
                    selector=target[0],
                    bounding_box=BoundingBox(x=target[3]["x"], y=target[3]["y"], width=target[1], height=target[2])
                ),
                fix_goal="Increase element padding or add an invisible pseudo-element hitbox to achieve at least 44px x 44px clickable area.",
                constraints=["Preserve visual text and icon sizes."],
                acceptance_check="Bounding rect width and height must both be >= 44px on mobile viewports."
            )]
        return []

@register_check
class ClippedTextCheck(CheckPlugin):
    id = "MOBI-CLIP-01"
    name = "Clipped or Truncated Text Container"
    layer = "UI"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Detects text elements where overflow: hidden without ellipsis causes clipped character glyphs."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        clipped = re.findall(r"style=[\"'][^\"']*overflow:\s*hidden(?![^\"']*text-overflow:\s*ellipsis)[^\"']*height:\s*([\d\.]+(?:px|rem))", dom, re.IGNORECASE)
        if clipped:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Clipped Text Container Missing Ellipsis",
                problem="Container enforces fixed height with overflow:hidden but omits text-overflow:ellipsis.",
                evidence=Evidence(measured_values={"fixed_height": clipped[0]}, expected_values={"uses_text_overflow_ellipsis": True}),
                location=Location(selector="div[style*='overflow: hidden']"),
                fix_goal="Add text-overflow: ellipsis and white-space: nowrap, or switch to line-clamp: 2.",
                constraints=["Prevent awkward character clipping."],
                acceptance_check="Truncated text must end in standard ellipsis or expand dynamically."
            )]
        return []

@register_check
class ImageDistortionCheck(CheckPlugin):
    id = "MOBI-DIST-01"
    name = "Image Aspect Ratio Distortion"
    layer = "UI"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that images do not have distorted aspect ratios due to mismatched width and height without object-fit."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        distorted = re.findall(r"<img[^>]*style=[\"'][^\"']*width:\s*[\d\.]+(?:%|px)[^\"']*height:\s*[\d\.]+(?:px|rem)(?![^\"']*object-fit)[^\"']*>", dom, re.IGNORECASE)
        if distorted:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Distorted Image Aspect Ratio (Missing object-fit)",
                problem="Images have explicit width and height set without 'object-fit: cover' or 'height: auto', risking squished images.",
                evidence=Evidence(measured_values={"distorted_instances": len(distorted)}, expected_values={"object_fit_or_auto_height": True}),
                location=Location(selector="img"),
                fix_goal="Add object-fit: cover or height: auto to maintain natural aspect ratio.",
                constraints=["Ensure container bounds image."],
                acceptance_check="Images must render with natural aspect ratio or object-fit: cover/contain."
            )]
        return []

@register_check
class ViewportMetaTagCheck(CheckPlugin):
    id = "MOBI-VIEW-01"
    name = "Missing or Non-Responsive Viewport Meta Tag"
    layer = "Production"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Ensures the essential viewport meta tag is present for mobile scaling."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        has_viewport = bool(re.search(r"<meta[^>]*name=[\"']viewport[\"'][^>]*content=[\"'][^\"']*width=device-width", dom, re.IGNORECASE))
        if not has_viewport:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Missing Mobile Viewport Meta Tag",
                problem="HTML head is missing <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">, breaking mobile zoom and layout.",
                evidence=Evidence(measured_values={"viewport_meta_found": False}, expected_values={"viewport_meta_required": True}),
                location=Location(selector="head"),
                fix_goal="Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"> to <head>.",
                constraints=["Add inside <head>."],
                acceptance_check="Document head must include a valid mobile viewport meta tag."
            )]
        return []
