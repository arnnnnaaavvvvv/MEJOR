import re
from typing import List
from packages.check_registry.base import CheckPlugin, CheckContext, register_check
from packages.shared.schemas import Issue, Location, Evidence

@register_check
class ReducedMotionCheck(CheckPlugin):
    id = "MOTN-RED-01"
    name = "Reduced Motion Preference Ignored"
    layer = "UX"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that animated sites provide a @media (prefers-reduced-motion: reduce) rule to accommodate vestibular disorders."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        has_animation = bool(re.search(r"animation:\s*[^;]+|@keyframes", dom, re.IGNORECASE))
        has_reduced_motion = bool(re.search(r"prefers-reduced-motion", dom, re.IGNORECASE))
        if has_animation and not has_reduced_motion:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="prefers-reduced-motion Not Respected",
                problem="Site uses CSS animations or keyframes but omits @media (prefers-reduced-motion: reduce) overrides.",
                evidence=Evidence(measured_values={"has_animations": True, "has_reduced_motion_media_query": False}, expected_values={"supports_reduced_motion": True}),
                location=Location(selector=":root"),
                fix_goal="Add global reduced motion override: @media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }",
                constraints=["Do not disable functional state updates."],
                acceptance_check="When prefers-reduced-motion is active, animation durations must collapse to 0."
            )]
        return []

@register_check
class ScrollHijackingCheck(CheckPlugin):
    id = "MOTN-HIJ-01"
    name = "Scroll Hijacking Anti-Pattern"
    layer = "UX"
    default_severity = "CRITICAL"
    confidence = "HIGH"
    tier = "A"
    description = "Flags wheel/scroll event interception overriding native smooth scrolling mechanics."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        hijacked = bool(re.search(r"addEventListener\([\"'](?:wheel|mousewheel)[\"'],\s*(?:function|\([^)]*\)\s*=>)[^;]*preventDefault", dom, re.IGNORECASE))
        if hijacked:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Scroll Hijacking Detected (preventDefault on Wheel)",
                problem="Script prevents default wheel event behavior to enforce custom scrolling mechanics, disorienting users.",
                evidence=Evidence(measured_values={"wheel_prevent_default": True}, expected_values={"native_scroll": True}),
                location=Location(selector="window.onwheel"),
                fix_goal="Remove custom wheel interceptors and rely on native CSS scroll-behavior: smooth or CSS scroll-snap.",
                constraints=["Use standard CSS scroll-snap properties instead of JS wheel overrides."],
                acceptance_check="Wheel event listeners must not call event.preventDefault()."
            )]
        return []

@register_check
class InfiniteAnimationCheck(CheckPlugin):
    id = "MOTN-INF-01"
    name = "Infinite Distracting Background Animation"
    layer = "Polish"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Detects infinite repeating background loops without user pause controls."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        infinite = re.findall(r"animation:\s*[^;]*infinite", dom, re.IGNORECASE)
        if len(infinite) > 2:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Multiple Infinite Animations (Visual Noise)",
                problem=f"Found {len(infinite)} continuously looping CSS animations causing visual fatigue.",
                evidence=Evidence(measured_values={"infinite_animation_count": len(infinite)}, expected_values={"max_infinite_animations": 1}),
                location=Location(selector="[style*='infinite']"),
                fix_goal="Limit infinite animations to subtle accent elements or provide a pause toggle for WCAG 2.2.2 compliance.",
                constraints=["Ensure animations stop after 5 seconds if not essential."],
                acceptance_check="Continuous animations must be pausable or limited in scope."
            )]
        return []
