import asyncio
from typing import Dict, Any, List, Tuple
from playwright.async_api import Browser, BrowserContext, Page, Request, Response
from apps.worker.scanner_types import ViewportCaptureData
from apps.worker.navigation import auto_dismiss_cookies, enforce_get_only_routes
from apps.worker.storage import storage

VIEWPORT_HEIGHTS = {
    1440: 900,
    1280: 800,
    1024: 768,
    768: 1024,
    430: 932,
    390: 844,
    360: 800
}

COMPUTED_STYLE_SCRIPT = """
(() => {
    const selectors = [
        'h1', 'h2', 'h3', 'p', 'button', 'a', 'nav', 'header', 'footer',
        'input', 'main', '[role="button"]', '[role="navigation"]'
    ];
    const data = {
        computedStyles: {},
        elementBoxes: {}
    };

    let counter = 0;
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (let i = 0; i < Math.min(els.length, 10); i++) {
            const el = els[i];
            const rect = el.getBoundingClientRect();
            const uniqueSelector = el.id ? `#${el.id}` : `${sel}:nth-of-type(${i + 1})`;
            
            const style = window.getComputedStyle(el);
            data.computedStyles[uniqueSelector] = {
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
                color: style.color,
                backgroundColor: style.backgroundColor,
                fontFamily: style.fontFamily,
                margin: style.margin,
                padding: style.padding,
                display: style.display,
                position: style.position,
                zIndex: style.zIndex,
                outline: style.outline,
                width: style.width,
                height: style.height
            };
            data.elementBoxes[uniqueSelector] = {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
            };
        }
    }
    return data;
})();
"""

async def run_screenshot_pass(
    browser: Browser,
    url: str,
    scan_id: str,
    target_viewports: List[int]
) -> Tuple[Dict[int, ViewportCaptureData], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Executes a visual screenshot pass across specified viewports.
    Returns (viewport_data_map, network_log, console_logs).
    """
    context: BrowserContext = await browser.new_context(bypass_csp=True)
    page: Page = await context.new_page()
    await enforce_get_only_routes(page)

    network_requests: List[Dict[str, Any]] = []
    console_logs: List[Dict[str, Any]] = []

    # Listeners
    page.on("request", lambda req: network_requests.append({
        "url": req.url,
        "method": req.method,
        "resource_type": req.resource_type
    }))
    page.on("response", lambda res: network_requests.append({
        "url": res.url,
        "status": res.status,
        "headers": dict(res.headers)
    }))
    page.on("console", lambda msg: console_logs.append({
        "type": msg.type,
        "text": msg.text,
        "location": msg.location
    }))

    viewport_data: Dict[int, ViewportCaptureData] = {}

    try:
        # Load initial page at desktop width
        await page.set_viewport_size({"width": 1440, "height": 900})
        
        # Resilient navigation: try networkidle, fallback gracefully to domcontentloaded
        try:
            response = await page.goto(url, wait_until="networkidle", timeout=15000)
        except Exception:
            try:
                response = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(1000) # Buffer for SPA hydration
            except Exception as e:
                response = None

        # Check for Bot Protection / Cloudflare Block
        page_title = await page.title()
        if "Attention Required! | Cloudflare" in page_title or "Just a moment..." in page_title:
            console_logs.append({
                "type": "error",
                "text": "SCAN_BLOCKED: Target is guarded by Cloudflare bot protection / challenge screen.",
                "location": {}
            })

        await auto_dismiss_cookies(page)
        await page.wait_for_timeout(400)

        # Cycle through all requested viewports
        for vp in target_viewports:
            height = VIEWPORT_HEIGHTS.get(vp, 800)
            await page.set_viewport_size({"width": vp, "height": height})
            await page.wait_for_timeout(300) # Wait for CSS reflow

            # Capture full-page screenshot
            screenshot_bytes = await page.screenshot(full_page=True, type="png")
            subpath = f"screenshots/screenshot_{vp}px.png"
            file_path, public_url = storage.save_bytes(scan_id, subpath, screenshot_bytes)

            # Capture DOM snapshot
            dom_html = await page.content()

            # Capture styles & element bounding boxes
            style_payload = await page.evaluate(COMPUTED_STYLE_SCRIPT)

            viewport_data[vp] = ViewportCaptureData(
                viewport=vp,
                screenshot_path=file_path,
                screenshot_url=public_url,
                dom_html=dom_html,
                computed_styles=style_payload.get("computedStyles", {}),
                element_boxes=style_payload.get("elementBoxes", {})
            )
    except Exception:
        pass
    finally:
        await page.close()
        await context.close()

    return viewport_data, network_requests, console_logs
