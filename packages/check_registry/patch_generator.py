import re
from typing import Dict, Any, List, Optional, Tuple
from packages.shared.schemas import Issue, PatchSet

# Disallowed JS-driven libraries that must never be patched via CSS injection
DISALLOWED_JS_PATTERNS = [
    re.compile(r"gsap", re.IGNORECASE),
    re.compile(r"_gsap", re.IGNORECASE),
    re.compile(r"TweenMax|TweenLite", re.IGNORECASE),
    re.compile(r"framer-motion|motion\.[a-z]+", re.IGNORECASE),
    re.compile(r"lottie|bodymovin", re.IGNORECASE),
    re.compile(r"canvas|webgl|three\.js", re.IGNORECASE),
]

LAYOUT_PROPERTIES = {
    "left", "right", "top", "bottom",
    "width", "height",
    "margin", "margin-left", "margin-right", "margin-top", "margin-bottom",
    "padding", "padding-left", "padding-right", "padding-top", "padding-bottom"
}

def detect_js_animation_library(text_or_dom: str) -> Optional[str]:
    """Detects presence of JS animation libraries that disqualify pure CSS injection."""
    for pat in DISALLOWED_JS_PATTERNS:
        if pat.search(text_or_dom):
            match = pat.pattern
            return f"js_library_detected: {match}"
    return None

def parse_property_and_values(issue: Issue) -> Tuple[str, Dict[str, Any]]:
    """Extracts target property, timing, and values from an issue."""
    evidence_vals = issue.evidence.measured_values or {}
    prop = (
        evidence_vals.get("animated_property")
        or evidence_vals.get("property")
        or ""
    ).lower()

    # Extract timing
    timing = {
        "duration": evidence_vals.get("duration", "0.3s"),
        "easing": evidence_vals.get("easing", "ease"),
        "delay": evidence_vals.get("delay", "0s"),
        "from": evidence_vals.get("from"),
        "to": evidence_vals.get("to") or evidence_vals.get("value")
    }

    # If duration is numeric milliseconds, format to seconds
    dur = timing["duration"]
    if isinstance(dur, (int, float)):
        timing["duration"] = f"{dur / 1000 if dur >= 10 else dur:.2f}s".replace(".00s", "s")

    # If property not explicitly named, attempt to parse from problem description
    if not prop:
        for lp in LAYOUT_PROPERTIES:
            if lp in issue.problem.lower() or lp in issue.title.lower():
                prop = lp
                break

    return prop, timing

def generate_animation_patch(issue: Issue, page_context_text: str = "") -> PatchSet:
    """
    Rule-based rewrite engine mapping layout-inducing animated properties to composite-friendly transforms.
    Correctly refuses to patch if JS animation libraries are detected or mappings are non-derivable.
    """
    selector = issue.location.selector if issue.location else ""
    if not selector:
        selector = "[data-animated]"

    # Clean selector if it was a pseudoselector like [style*='width']
    clean_selector = selector.strip()

    # 1. Check for disqualified JS animation libraries in issue context or surrounding DOM
    search_corpus = f"{issue.problem} {issue.title} {issue.fix_goal} {str(issue.evidence.measured_values)} {page_context_text}"
    js_lib_reason = detect_js_animation_library(search_corpus)
    if js_lib_reason:
        return PatchSet(
            css="",
            target_selectors=[clean_selector],
            patch_type="animation-transform-rewrite",
            reversible=True,
            patchable=False,
            reason=js_lib_reason
        )

    # 2. Extract property and values
    prop, timing = parse_property_and_values(issue)
    if not prop:
        return PatchSet(
            css="",
            target_selectors=[clean_selector],
            patch_type="animation-transform-rewrite",
            reversible=True,
            patchable=False,
            reason="non_derivable_property: layout property could not be safely isolated"
        )

    # 3. Disqualify unsafe or non-derivable multi-rule layout properties
    # E.g. padding and complex percentage margin flows affect neighboring siblings directly
    if prop.startswith("padding"):
        return PatchSet(
            css="",
            target_selectors=[clean_selector],
            patch_type="animation-transform-rewrite",
            reversible=True,
            patchable=False,
            reason="conflicting_sibling_layout: padding shifts internal content box and cannot be isolated to composite transform"
        )

    # 4. Generate rewrite rules based on property
    dur = timing["duration"]
    easing = timing["easing"]
    delay = timing["delay"]
    transition_timing = f"{dur} {easing}".strip()
    if delay and delay != "0s":
        transition_timing += f" {delay}"

    css_rules = []

    if prop in ("left", "right"):
        # Map left/right translation to translateX
        css_rules.append(f"""/* [LIVE-PATCH] Rewriting layout-triggering '{prop}' to GPU-composited transform */
{clean_selector} {{
    position: relative !important;
    {prop}: 0 !important;
    will-change: transform !important;
    transition: transform {transition_timing} !important;
}}
{clean_selector}:hover, {clean_selector}.active {{
    transform: translateX({'100%' if prop == 'left' else '-100%'}) !important;
}}""")

    elif prop in ("top", "bottom"):
        # Map top/bottom translation to translateY
        css_rules.append(f"""/* [LIVE-PATCH] Rewriting layout-triggering '{prop}' to GPU-composited transform */
{clean_selector} {{
    position: relative !important;
    {prop}: 0 !important;
    will-change: transform !important;
    transition: transform {transition_timing} !important;
}}
{clean_selector}:hover, {clean_selector}.active {{
    transform: translateY({'100%' if prop == 'top' else '-100%'}) !important;
}}""")

    elif prop in ("width", "max-width", "min-width"):
        # Map width transition to transform scaleX
        css_rules.append(f"""/* [LIVE-PATCH] Rewriting layout-triggering '{prop}' to GPU-composited transform */
{clean_selector} {{
    transform-origin: left center !important;
    will-change: transform !important;
    transition: transform {transition_timing} !important;
}}
{clean_selector}:hover, {clean_selector}.active {{
    transform: scaleX(1.15) !important;
}}""")

    elif prop in ("height", "max-height", "min-height"):
        # Map height transition to transform scaleY
        css_rules.append(f"""/* [LIVE-PATCH] Rewriting layout-triggering '{prop}' to GPU-composited transform */
{clean_selector} {{
    transform-origin: top center !important;
    will-change: transform !important;
    transition: transform {transition_timing} !important;
}}
{clean_selector}:hover, {clean_selector}.active {{
    transform: scaleY(1.15) !important;
}}""")

    elif prop.startswith("margin"):
        # Margin translation to transform
        axis = "Y" if "top" in prop or "bottom" in prop else "X"
        sign = "-" if "right" in prop or "bottom" in prop else ""
        css_rules.append(f"""/* [LIVE-PATCH] Rewriting layout-triggering '{prop}' to GPU-composited transform */
{clean_selector} {{
    {prop}: 0 !important;
    will-change: transform !important;
    transition: transform {transition_timing} !important;
}}
{clean_selector}:hover, {clean_selector}.active {{
    transform: translate{axis}({sign}16px) !important;
}}""")

    else:
        # Fallback: enforce will-change and transform isolation
        css_rules.append(f"""/* [LIVE-PATCH] Enforcing GPU layer promotion for {prop} */
{clean_selector} {{
    will-change: transform, opacity !important;
    transform: translateZ(0) !important;
    transition: transform {transition_timing}, opacity {transition_timing} !important;
}}""")

    final_css = "\n\n".join(css_rules)
    return PatchSet(
        css=final_css,
        target_selectors=[clean_selector],
        patch_type="animation-transform-rewrite",
        reversible=True,
        patchable=True,
        reason=None
    )
