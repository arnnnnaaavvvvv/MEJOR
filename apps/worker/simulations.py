import asyncio
from typing import Dict, Any, List
from playwright.async_api import Browser, BrowserContext, Page, Route, Request
from apps.worker.scanner_types import PageScanData, ViewportCaptureData
from apps.worker.navigation import auto_dismiss_cookies, enforce_get_only_routes
from apps.worker.storage import storage

CHAOS_INJECTION_SCRIPT = """
(() => {
    // 1. Text Expansion (+40% length with special characters)
    function expandText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const val = node.nodeValue.trim();
            if (val.length > 2) {
                node.nodeValue = `[!!! ${val} äöü-expanded !!!]`;
            }
        } else {
            for (const child of node.childNodes) {
                expandText(child);
            }
        }
    }
    expandText(document.body);

    // 2. Numeric Overflow injection
    const numbers = document.querySelectorAll('span, td, p, b');
    for (const el of numbers) {
        if (/^\\$?\\d+(\\.\\d+)?$/.test(el.textContent.trim())) {
            el.textContent = '$999,999,999.99 🚀';
        }
    }
})();
"""

SQUINT_FILTER_SCRIPT = """
(() => {
    // Apply 10px Gaussian blur to test primary focal points
    const style = document.createElement('style');
    style.innerHTML = `
        body {
            filter: blur(10px) !important;
            transition: none !important;
        }
    `;
    document.head.appendChild(style);
})();
"""

REMOVE_EFFECTS_SCRIPT = """
(() => {
    // Remove shadows, gradients, and backdrop filters
    const style = document.createElement('style');
    style.innerHTML = `
        * {
            box-shadow: none !important;
            text-shadow: none !important;
            backdrop-filter: none !important;
            background-image: none !important;
        }
    `;
    document.head.appendChild(style);
})();
"""

class SimulationRunner:
    async def run_failure_lab(self, browser: Browser, url: str, scan_id: str) -> List[Dict[str, Any]]:
        results = []

        # 1. Delay Simulation
        context = await browser.new_context()
        page = await context.new_page()
        await enforce_get_only_routes(page)

        async def delay_route(route: Route, request: Request):
            await asyncio.sleep(1.0) # 1000ms delay simulation
            await route.continue_()

        await page.route("**/*", delay_route)
        try:
            await page.goto(url, timeout=15000, wait_until="domcontentloaded")
            content = await page.content()
            results.append({"type": "DELAY", "dom": content})
        except Exception:
            pass
        finally:
            await page.close()
            await context.close()

        # 2. Endpoint 500 Simulation
        context = await browser.new_context()
        page = await context.new_page()
        await enforce_get_only_routes(page)

        async def fail_route(route: Route, request: Request):
            if request.resource_type in ("fetch", "xhr"):
                await route.fulfill(status=500, body='{"error":"Simulated Server Error"}')
            else:
                await route.continue_()

        await page.route("**/*", fail_route)
        try:
            await page.goto(url, timeout=15000, wait_until="domcontentloaded")
            content = await page.content()
            results.append({"type": "ERROR_500", "dom": content})
        except Exception:
            pass
        finally:
            await page.close()
            await context.close()

        # 3. No-JS Simulation
        context = await browser.new_context(java_script_enabled=False)
        page = await context.new_page()
        try:
            await page.goto(url, timeout=15000, wait_until="domcontentloaded")
            content = await page.content()
            results.append({"type": "NO_JS", "dom": content})
        except Exception:
            pass
        finally:
            await page.close()
            await context.close()

        return results

    async def run_chaos_mode(self, browser: Browser, url: str, scan_id: str) -> Optional[Dict[str, Any]]:
        context = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await context.new_page()
        await enforce_get_only_routes(page)
        try:
            await page.goto(url, wait_until="networkidle", timeout=15000)
            await page.evaluate(CHAOS_INJECTION_SCRIPT)
            await page.wait_for_timeout(300)
            
            # Capture screenshot
            screenshot_bytes = await page.screenshot(type="png")
            _, url_path = storage.save_bytes(scan_id, "screenshots/chaos_text_390px.png", screenshot_bytes)

            content = await page.content()
            return {"type": "CHAOS_TEXT", "dom": content, "screenshot_url": url_path}
        except Exception:
            return None
        finally:
            await page.close()
            await context.close()

    async def run_emulation_and_perception(self, browser: Browser, url: str, scan_id: str) -> Dict[str, str]:
        artifacts = {}
        # Dark Mode
        context = await browser.new_context(color_scheme="dark", viewport={"width": 1440, "height": 900})
        page = await context.new_page()
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            dark_bytes = await page.screenshot(type="png")
            _, artifacts["dark_mode"] = storage.save_bytes(scan_id, "screenshots/emulation_dark.png", dark_bytes)

            # Squint test
            await page.evaluate(SQUINT_FILTER_SCRIPT)
            await page.wait_for_timeout(200)
            squint_bytes = await page.screenshot(type="png")
            _, artifacts["squint_test"] = storage.save_bytes(scan_id, "screenshots/perception_squint.png", squint_bytes)
        except Exception:
            pass
        finally:
            await page.close()
            await context.close()

        return artifacts

simulation_runner = SimulationRunner()
