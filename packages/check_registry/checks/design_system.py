import re
from typing import List, Set
from packages.check_registry.base import CheckPlugin, CheckContext, register_check
from packages.shared.schemas import Issue, Location, Evidence

def parse_px(val: str) -> float:
    try:
        match = re.search(r"([\d\.]+)px", val)
        return float(match.group(1)) if match else 0.0
    except Exception:
        return 0.0

@register_check
class FontSizesCheck(CheckPlugin):
    id = "DS-FONT-01"
    name = "Typography Font Scale Explosion"
    layer = "UI"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Flags pages utilizing more than 6 distinct font sizes, violating design system tokenization."

    def run(self, context: CheckContext) -> List[Issue]:
        if not context.primary_vp:
            return []
        font_sizes: Set[str] = set()
        for sel, style in context.primary_vp.computed_styles.items():
            fs = style.get("fontSize")
            if fs:
                font_sizes.add(fs)

        if len(font_sizes) > 6:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Font Scale Explosion (>6 Unique Sizes)",
                problem=f"Page defines {len(font_sizes)} distinct font sizes ({', '.join(sorted(font_sizes))}), causing visual hierarchy drift.",
                evidence=Evidence(
                    measured_values={"distinct_sizes": sorted(list(font_sizes)), "count": len(font_sizes)},
                    expected_values={"max_allowed_sizes": 6}
                ),
                location=Location(selector="body"),
                fix_goal="Consolidate font sizes to match a cohesive modular scale (e.g. 12px, 14px, 16px, 20px, 24px, 32px).",
                constraints=["Do not modify semantic tags, unify typography classes/tokens only."],
                acceptance_check="Total unique computed font-size values across the page must be <= 6."
            )]
        return []

@register_check
class FontFamiliesCheck(CheckPlugin):
    id = "DS-FONT-02"
    name = "Multiple Font Families Clutter"
    layer = "UI"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Flags pages utilizing more than 2 distinct font families."

    def run(self, context: CheckContext) -> List[Issue]:
        if not context.primary_vp:
            return []
        families = {s.get("fontFamily", "").split(",")[0].strip("\"' ") for s in context.primary_vp.computed_styles.values() if s.get("fontFamily")}
        families.discard("")
        if len(families) > 2:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Excessive Font Families (>2 Families)",
                problem=f"Page loads {len(families)} distinct font families ({', '.join(families)}).",
                evidence=Evidence(measured_values={"families": list(families)}, expected_values={"max_families": 2}),
                location=Location(selector="body"),
                fix_goal="Standardize on maximum 2 font families (one for headings, one for body/interface).",
                constraints=["Keep brand font for headings if specified."],
                acceptance_check="Distinct font-family definitions must be <= 2."
            )]
        return []

@register_check
class FontWeightsCheck(CheckPlugin):
    id = "DS-FONT-03"
    name = "Font Weight Sprawl"
    layer = "Polish"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Flags pages with more than 3 distinct font weights."

    def run(self, context: CheckContext) -> List[Issue]:
        if not context.primary_vp:
            return []
        weights = {s.get("fontWeight") for s in context.primary_vp.computed_styles.values() if s.get("fontWeight")}
        if len(weights) > 3:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Font Weight Sprawl (>3 Weights)",
                problem=f"Found {len(weights)} different font weights: {', '.join(sorted(weights))}.",
                evidence=Evidence(measured_values={"weights": sorted(list(weights))}, expected_values={"max_weights": 3}),
                location=Location(selector="body"),
                fix_goal="Limit typography weights to 400 (regular), 500/600 (medium/semibold), and 700 (bold).",
                constraints=["Preserve contrast and readability."],
                acceptance_check="Page must use <= 3 font weights."
            )]
        return []

@register_check
class OffScaleSpacingCheck(CheckPlugin):
    id = "DS-SPAC-01"
    name = "Off-Scale Spacing Grid Violation"
    layer = "Polish"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Flags margins/paddings that break standard 4px/8px modular grid increments."

    def run(self, context: CheckContext) -> List[Issue]:
        if not context.primary_vp:
            return []
        offenders = []
        for sel, style in context.primary_vp.computed_styles.items():
            padding = style.get("padding", "")
            px_val = parse_px(padding)
            if px_val > 0 and px_val % 4 != 0:
                offenders.append((sel, padding))
                if len(offenders) >= 3:
                    break

        if offenders:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Non-Grid Spacing (Breaks 4px Scale)",
                problem=f"Elements like '{offenders[0][0]}' use arbitrary padding ({offenders[0][1]}) not divisible by 4px.",
                evidence=Evidence(measured_values={"offending_elements": offenders}, expected_values={"grid_step": "4px"}),
                location=Location(selector=offenders[0][0]),
                fix_goal="Align element paddings and margins to a 4px modular spacing scale (4, 8, 12, 16, 24, 32px).",
                constraints=["Preserve visual spacing balance."],
                acceptance_check="Computed padding and margin in px must be multiples of 4."
            )]
        return []

@register_check
class BorderRadiusCheck(CheckPlugin):
    id = "DS-RAD-01"
    name = "Border Radius Inconsistency"
    layer = "Polish"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that border-radius values adhere to a clean design system tier."

    def run(self, context: CheckContext) -> List[Issue]:
        # Evaluated from DOM HTML
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        matches = set(re.findall(r"border-radius:\s*([\d\.]+(?:px|rem|%))", dom, re.IGNORECASE))
        if len(matches) > 4:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Border Radius Inconsistency (>4 Variants)",
                problem=f"Found {len(matches)} distinct border-radius values ({', '.join(matches)}).",
                evidence=Evidence(measured_values={"radii": list(matches)}, expected_values={"max_radii": 4}),
                location=Location(selector="body"),
                fix_goal="Standardize on design system radii tokens: sm (4px), md (8px), lg (12px), full (9999px).",
                constraints=["Unify existing CSS radius tokens."],
                acceptance_check="Total unique border-radius values must not exceed 4."
            )]
        return []

@register_check
class BoxShadowCheck(CheckPlugin):
    id = "DS-SHAD-01"
    name = "Box Shadow Token Drift"
    layer = "Polish"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Flags irregular or disparate box-shadow declarations."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        shadows = set(re.findall(r"box-shadow:\s*([^;]+);", dom, re.IGNORECASE))
        if len(shadows) > 4:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Box Shadow Token Drift (>4 Shadow Styles)",
                problem=f"Found {len(shadows)} ad-hoc box shadow styles.",
                evidence=Evidence(measured_values={"shadow_count": len(shadows)}, expected_values={"max_shadows": 4}),
                location=Location(selector="body"),
                fix_goal="Adopt standard elevation tokens: elevation-1, elevation-2, elevation-3.",
                constraints=["Ensure light/dark mode compatibility."],
                acceptance_check="Total unique shadow definitions must be <= 4."
            )]
        return []

@register_check
class ColorPaletteCheck(CheckPlugin):
    id = "DS-COLR-01"
    name = "Color Palette Explosion"
    layer = "UI"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Flags sites with >8 arbitrary text or background colors."

    def run(self, context: CheckContext) -> List[Issue]:
        if not context.primary_vp:
            return []
        colors = set()
        for style in context.primary_vp.computed_styles.values():
            if style.get("color"):
                colors.add(style["color"])
        if len(colors) > 8:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Color Palette Explosion (>8 Unique Foreground Colors)",
                problem=f"Found {len(colors)} distinct text colors, indicating a lack of unified color tokens.",
                evidence=Evidence(measured_values={"colors": list(colors)[:8], "total_count": len(colors)}, expected_values={"max_palette_colors": 8}),
                location=Location(selector="body"),
                fix_goal="Consolidate text colors to primary, secondary, muted, and brand accent.",
                constraints=["Maintain minimum WCAG AA contrast."],
                acceptance_check="Total unique computed text colors must be <= 8."
            )]
        return []

@register_check
class TokenDriftCheck(CheckPlugin):
    id = "DS-TOK-01"
    name = "Duplicate CSS Variable Token Drift"
    layer = "Polish"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Detects multiple CSS variables declared with identical hex/rgb values."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        vars_found = re.findall(r"(--[a-zA-Z0-9_-]+):\s*([^;]+);", dom)
        val_map = {}
        duplicates = []
        for var_name, var_val in vars_found:
            clean_val = var_val.strip().lower()
            if clean_val in val_map and val_map[clean_val] != var_name:
                duplicates.append((var_name, val_map[clean_val], clean_val))
            else:
                val_map[clean_val] = var_name

        if len(duplicates) >= 2:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="CSS Variable Token Drift (Redundant Variables)",
                problem=f"Variables like '{duplicates[0][0]}' and '{duplicates[0][1]}' both define identical value '{duplicates[0][2]}'.",
                evidence=Evidence(measured_values={"duplicates": duplicates[:3]}, expected_values={"unique_token_assignments": True}),
                location=Location(selector=":root"),
                fix_goal="Deduplicate CSS variables and reference common semantic tokens.",
                constraints=["Do not break component CSS references."],
                acceptance_check="Eliminate redundant CSS variables aliasing identical values."
            )]
        return []
