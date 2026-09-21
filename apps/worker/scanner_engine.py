import asyncio
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright, Browser
from apps.worker.scanner_types import PageScanData
from apps.worker.navigation import discover_nav_links
from apps.worker.telemetry_pass import run_telemetry_pass
from apps.worker.screenshot_pass import run_screenshot_pass
from apps.api.core.logging import logger

QUICK_VIEWPORTS = [1440, 390]
DEEP_VIEWPORTS = [1440, 1280, 1024, 768, 430, 390, 360]

class ScannerEngine:
    async def scan_site(
        self,
        url: str,
        scan_id: str,
        mode: str = "quick",
        progress_callback: Optional[Any] = None
    ) -> List[PageScanData]:
        """
        Coordinates full site scan: root page plus up to 5 discovered same-origin pages.
        """
        viewports = QUICK_VIEWPORTS if mode == "quick" else DEEP_VIEWPORTS
        pages_scanned: List[PageScanData] = []

        async with async_playwright() as p:
            browser: Browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu"
                ]
            )

            try:
                # 1. Root page scan
                if progress_callback:
                    await progress_callback("CRAWL_DISCOVERY", 10, f"Scanning root page: {url}")

                # Run Telemetry Pass (Desktop & Mobile)
                if progress_callback:
                    await progress_callback("MEASURE_PASS", 25, "Running isolated telemetry and animation pass")
                telemetry, video_path, video_url = await run_telemetry_pass(browser, url, scan_id, is_mobile=False)

                # Run Screenshot Pass
                if progress_callback:
                    await progress_callback("SCREENSHOT_PASS", 50, f"Capturing visual viewports: {viewports}")
                vp_data, net_log, console_logs = await run_screenshot_pass(browser, url, scan_id, viewports)

                # Root Page Data
                root_page_data = PageScanData(
                    url=url,
                    is_root=True,
                    telemetry=telemetry,
                    viewport_data=vp_data,
                    network_requests=net_log,
                    console_logs=console_logs,
                    video_path=video_path,
                    video_url=video_url
                )

                # Discover nav links
                nav_context = await browser.new_context()
                nav_page = await nav_context.new_page()
                try:
                    await nav_page.goto(url, wait_until="domcontentloaded", timeout=15000)
                    nav_links = await discover_nav_links(nav_page, url, max_links=5)
                    root_page_data.nav_links = nav_links
                except Exception:
                    nav_links = []
                finally:
                    await nav_page.close()
                    await nav_context.close()

                pages_scanned.append(root_page_data)

                # 2. Crawl discovered subpages (Deep mode or if requested)
                sub_links = nav_links if mode == "deep" else nav_links[:1]
                for idx, sub_url in enumerate(sub_links):
                    pct = 60 + int((idx / max(len(sub_links), 1)) * 25)
                    if progress_callback:
                        await progress_callback("CRAWL_SUBPAGES", pct, f"Auditing subpage: {sub_url}")

                    sub_vp_data, sub_net, sub_console = await run_screenshot_pass(
                        browser, sub_url, scan_id, [1440, 390]
                    )
                    pages_scanned.append(PageScanData(
                        url=sub_url,
                        is_root=False,
                        viewport_data=sub_vp_data,
                        network_requests=sub_net,
                        console_logs=sub_console
                    ))

            finally:
                await browser.close()

        return pages_scanned

scanner_engine = ScannerEngine()
