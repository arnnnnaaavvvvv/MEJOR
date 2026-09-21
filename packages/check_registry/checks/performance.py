import re
from typing import List
from packages.check_registry.base import CheckPlugin, CheckContext, register_check
from packages.shared.schemas import Issue, Location, Evidence

@register_check
class CumulativeLayoutShiftCheck(CheckPlugin):
    id = "PERF-CLS-01"
    name = "Cumulative Layout Shift (CLS > 0.1)"
    layer = "Polish"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that unconstrained images or dynamically loaded content do not cause CLS > 0.1."

    def run(self, context: CheckContext) -> List[Issue]:
        cls_val = context.page_data.telemetry.cumulative_layout_shift
        if cls_val > 0.1:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Excessive Cumulative Layout Shift (CLS > 0.1)",
                problem=f"Measured CLS is {round(cls_val, 3)}, which exceeds the Google Core Web Vital good threshold of 0.1.",
                evidence=Evidence(measured_values={"cls": round(cls_val, 3)}, expected_values={"max_cls": 0.1}),
                location=Location(selector="body"),
                fix_goal="Reserve explicit width and height aspect-ratios on images, embeds, and dynamic hero banners to eliminate layout shifts.",
                constraints=["Add aspect-ratio or min-height to dynamically loaded containers."],
                acceptance_check="CLS during initial scroll and load must be < 0.1."
            )]
        return []

@register_check
class LongTaskCheck(CheckPlugin):
    id = "PERF-TASK-01"
    name = "Main-Thread Blocking Long Task (>50ms)"
    layer = "Polish"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Detects long tasks exceeding 50ms that freeze main thread responsiveness."

    def run(self, context: CheckContext) -> List[Issue]:
        tasks = context.page_data.telemetry.longtasks
        long_tasks = [t for t in tasks if t.get("duration", 0) > 50.0]
        if long_tasks:
            max_duration = max(t["duration"] for t in long_tasks)
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Main-Thread Blocking Long Task (>50ms)",
                problem=f"Detected {len(long_tasks)} task(s) blocking the main thread, with max duration of {round(max_duration, 1)}ms.",
                evidence=Evidence(measured_values={"longtask_count": len(long_tasks), "max_duration_ms": round(max_duration, 1)}, expected_values={"max_duration_ms": 50.0}),
                location=Location(selector="window"),
                fix_goal="Break heavy synchronous JavaScript computation using requestIdleCallback, setTimeout, or Web Workers.",
                constraints=["Do not defer critical initial render logic."],
                acceptance_check="No single JS task should block the main event loop for > 50ms."
            )]
        return []

@register_check
class RafJankCheck(CheckPlugin):
    id = "PERF-JANK-01"
    name = "Animation Frame Jank Drop (<30 FPS)"
    layer = "Polish"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Checks for requestAnimationFrame deltas exceeding 33.3ms (dropping below 30 frames per second)."

    def run(self, context: CheckContext) -> List[Issue]:
        deltas = context.page_data.telemetry.raf_deltas
        jank_frames = [d for d in deltas if d.get("deltaMs", 0) > 33.3]
        if len(jank_frames) >= 3:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Animation Frame Rate Drop (<30 FPS)",
                problem=f"Detected {len(jank_frames)} frame stutter events during scrolling where render delta exceeded 33.3ms.",
                evidence=Evidence(measured_values={"jank_events": len(jank_frames)}, expected_values={"max_delta_ms": 33.3}),
                location=Location(selector="window"),
                fix_goal="Optimize scroll event listeners with passive: true and CSS will-change / transform properties.",
                constraints=["Avoid layout calculations inside scroll event callbacks."],
                acceptance_check="rAF frame deltas during smooth scroll should remain consistently <= 16.6ms - 33.3ms."
            )]
        return []

@register_check
class LayoutTriggeringAnimationCheck(CheckPlugin):
    id = "PERF-PROP-01"
    name = "Layout-Triggering Animated Properties"
    layer = "Polish"
    default_severity = "MAJOR"
    confidence = "HIGH"
    tier = "A"
    description = "Flags CSS/WAAPI animations interpolating layout-inducing properties (width, height, top, left, margin, padding) instead of transform and opacity."

    def run(self, context: CheckContext) -> List[Issue]:
        flagged = context.page_data.telemetry.layout_triggering_animations
        if flagged:
            first = flagged[0]
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Layout-Triggering Animation Property (Triggers Paint)",
                problem=f"Animation is actively animating property '{first.get('property')}', forcing full browser layout recalculations on every frame.",
                evidence=Evidence(measured_values={"animated_property": first.get("property"), "duration": first.get("duration")}, expected_values={"composite_only": "transform, opacity"}),
                location=Location(selector=f"[style*='{first.get('property')}']"),
                fix_goal="Refactor animation to use CSS transforms (translate, scale) and opacity, which are GPU-accelerated and composite-only.",
                constraints=["Ensure element position aligns with target."],
                acceptance_check="Animations must only interpolate composite-friendly properties (transform, opacity)."
            )]
        return []

@register_check
class LazyLoadingImagesCheck(CheckPlugin):
    id = "PERF-LAZY-01"
    name = "Images Missing loading='lazy'"
    layer = "Production"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Detects multiple image tags lacking loading='lazy' attribute."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        imgs_without_lazy = re.findall(r"<img(?![^>]*loading=[\"']lazy[\"'])[^>]*>", dom, re.IGNORECASE)
        if len(imgs_without_lazy) > 3:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Images Missing loading='lazy' Attribute",
                problem=f"Found {len(imgs_without_lazy)} images without loading=\"lazy\", increasing initial page payload.",
                evidence=Evidence(measured_values={"eager_images_count": len(imgs_without_lazy)}, expected_values={"lazy_loading": True}),
                location=Location(selector="img:not([loading='lazy'])"),
                fix_goal="Add loading=\"lazy\" and decoding=\"async\" to below-the-fold image tags.",
                constraints=["Keep the hero LCP image eager."],
                acceptance_check="All below-the-fold images should have loading=\"lazy\"."
            )]
        return []

@register_check
class FontDisplaySwapCheck(CheckPlugin):
    id = "PERF-FONT-01"
    name = "Web Font Missing font-display: swap"
    layer = "Performance" if "Performance" in ["UX", "UI", "States", "Production", "Polish"] else "Polish"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Checks that @font-face rules specify font-display: swap to eliminate Flash of Invisible Text (FOIT)."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        has_font_face = bool(re.search(r"@font-face\s*{", dom, re.IGNORECASE))
        has_swap = bool(re.search(r"font-display:\s*(?:swap|optional|fallback)", dom, re.IGNORECASE))
        if has_font_face and not has_swap:
            return [Issue(
                check_id=self.id,
                layer="Polish",
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Web Font Missing font-display: swap",
                problem="@font-face rule declares custom web font without font-display: swap, causing FOIT during initial network load.",
                evidence=Evidence(measured_values={"font_display_declared": False}, expected_values={"font_display_swap": True}),
                location=Location(selector="@font-face"),
                fix_goal="Add font-display: swap; to all @font-face blocks or append &display=swap to Google Fonts links.",
                constraints=["Ensure fallback system font renders during load."],
                acceptance_check="Custom font definitions must specify font-display: swap or optional."
            )]
        return []

@register_check
class UnoptimizedImageFormatCheck(CheckPlugin):
    id = "PERF-IMG-01"
    name = "Legacy Heavy Image Format (PNG/BMP instead of WebP/AVIF)"
    layer = "Production"
    default_severity = "MINOR"
    confidence = "HIGH"
    tier = "A"
    description = "Detects usage of uncompressed raster formats where modern WebP/AVIF would reduce file size by 70%."

    def run(self, context: CheckContext) -> List[Issue]:
        dom = context.primary_vp.dom_html if context.primary_vp else ""
        heavy_imgs = re.findall(r"src=[\"']([^\"']+\.(?:bmp|tiff|raw))[\"']", dom, re.IGNORECASE)
        if heavy_imgs:
            return [Issue(
                check_id=self.id,
                layer=self.layer,
                severity=self.default_severity,
                confidence=self.confidence,
                tier=self.tier,
                title="Unoptimized Heavy Image Format Detected",
                problem=f"Image source references uncompressed raster format: '{heavy_imgs[0]}'.",
                evidence=Evidence(measured_values={"image_src": heavy_imgs[0]}, expected_values={"format": "webp / avif"}),
                location=Location(selector="img"),
                fix_goal="Convert image assets to modern WebP or AVIF formats to reduce payload size.",
                constraints=["Maintain image visual quality."],
                acceptance_check="Images should be served as WebP, AVIF, or optimized PNG/JPG."
            )]
        return []
