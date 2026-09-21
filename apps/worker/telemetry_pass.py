import os
import asyncio
from typing import Dict, Any, Tuple, Optional
from playwright.async_api import Browser, BrowserContext, Page
from apps.worker.scanner_types import TelemetryMetrics
from apps.worker.navigation import auto_dismiss_cookies, scripted_scroll_and_hover, enforce_get_only_routes
from apps.worker.storage import storage

TELEMETRY_INJECTION_SCRIPT = """
(() => {
    window.__auditorLongTasks = [];
    window.__auditorCLS = 0.0;
    window.__auditorRafDeltas = [];

    // Observe Performance Longtasks & Layout Shifts
    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'longtask') {
                    window.__auditorLongTasks.push({
                        duration: entry.duration,
                        startTime: entry.startTime,
                        name: entry.name
                    });
                }
                if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                    window.__auditorCLS += entry.value;
                }
            }
        });
        observer.observe({ type: 'longtask', buffered: true });
        observer.observe({ type: 'layout-shift', buffered: true });
    } catch(e) {}

    // Track requestAnimationFrame deltas
    let lastTime = performance.now();
    let frameCount = 0;
    function monitorRAF(now) {
        const delta = now - lastTime;
        lastTime = now;
        if (frameCount < 120) { // Record first 120 frames during interaction
            window.__auditorRafDeltas.push({
                deltaMs: Math.round(delta * 100) / 100,
                scrollY: Math.round(window.scrollY)
            });
            frameCount++;
        }
        if (frameCount < 120) {
            requestAnimationFrame(monitorRAF);
        }
    }
    requestAnimationFrame(monitorRAF);
})();
"""

ANIMATION_INSPECTION_SCRIPT = """
(() => {
    const layoutProps = new Set(['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding', 'min-width', 'max-width']);
    const flagged = [];

    try {
        const animations = document.getAnimations();
        for (const anim of animations) {
            if (anim.effect && anim.effect.getKeyframes) {
                const keyframes = anim.effect.getKeyframes();
                for (const frame of keyframes) {
                    for (const prop of Object.keys(frame)) {
                        const normalizedProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                        for (const trigger of layoutProps) {
                            if (normalizedProp.includes(trigger)) {
                                flagged.push({
                                    id: anim.id || 'unnamed',
                                    property: normalizedProp,
                                    duration: anim.effect.getTiming().duration,
                                    easing: anim.effect.getTiming().easing
                                });
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {}

    return flagged;
})();
"""

async def run_telemetry_pass(
    browser: Browser,
    url: str,
    scan_id: str,
    is_mobile: bool = False
) -> Tuple[TelemetryMetrics, Optional[str], Optional[str]]:
    """
    Executes an isolated measurement and animation telemetry pass with video recording.
    Returns (telemetry_metrics, video_path, video_url).
    """
    scan_dir = storage.get_scan_dir(scan_id)
    videos_dir = os.path.join(scan_dir, "videos")
    os.makedirs(videos_dir, exist_ok=True)

    viewport = {"width": 390, "height": 844} if is_mobile else {"width": 1440, "height": 900}
    user_agent = (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
        if is_mobile else None
    )

    context: BrowserContext = await browser.new_context(
        viewport=viewport,
        user_agent=user_agent,
        is_mobile=is_mobile,
        record_video_dir=videos_dir,
        record_video_size=viewport,
        bypass_csp=True
    )

    page: Page = await context.new_page()
    await enforce_get_only_routes(page)

    # CDP CPU Throttling for mobile pass
    if is_mobile:
        try:
            cdp = await context.new_cdp_session(page)
            # 4x CPU slowdown
            await cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
            # Simulated Fast 3G
            await cdp.send("Network.emulateNetworkConditions", {
                "offline": False,
                "latency": 150,
                "downloadThroughput": 1.6 * 1024 * 1024 / 8, # 1.6 Mbps
                "uploadThroughput": 750 * 1024 / 8           # 750 Kbps
            })
        except Exception:
            pass

    # Inject performance observer before navigation
    await page.add_init_script(TELEMETRY_INJECTION_SCRIPT)

    metrics = TelemetryMetrics()
    video_path, video_url = None, None

    try:
        try:
            await page.goto(url, wait_until="networkidle", timeout=15000)
        except Exception:
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(1000)
        await auto_dismiss_cookies(page)
        await scripted_scroll_and_hover(page)
        await page.wait_for_timeout(500)

        # Collect telemetry
        raw_longtasks = await page.evaluate("() => window.__auditorLongTasks || []")
        raw_cls = await page.evaluate("() => window.__auditorCLS || 0.0")
        raw_raf = await page.evaluate("() => window.__auditorRafDeltas || []")
        layout_animations = await page.evaluate(ANIMATION_INSPECTION_SCRIPT)

        metrics.longtasks = raw_longtasks
        metrics.cumulative_layout_shift = float(raw_cls)
        metrics.raf_deltas = raw_raf
        metrics.layout_triggering_animations = layout_animations

    except Exception:
        pass
    finally:
        # Video is finalized when page and context close
        video_obj = page.video
        await page.close()
        await context.close()

        if video_obj:
            try:
                original_path = await video_obj.path()
                if original_path and os.path.exists(original_path):
                    filename = f"replay_{'mobile' if is_mobile else 'desktop'}.webm"
                    dest_path, dest_url = storage.save_bytes(
                        scan_id,
                        f"videos/{filename}",
                        open(original_path, "rb").read()
                    )
                    video_path, video_url = dest_path, dest_url
            except Exception:
                pass

    return metrics, video_path, video_url
