import asyncio
from typing import List
from urllib.parse import urlparse
from playwright.async_api import Page, Route, Request
from apps.api.core.security import validate_target_url

COOKIE_SELECTORS = [
    "#onetrust-accept-btn-handler",
    "button#accept-cookies",
    "button[data-testid='cookie-accept']",
    "button:has-text('Accept All')",
    "button:has-text('Accept cookies')",
    "button:has-text('Allow all')",
    "button:has-text('Agree')",
    "button:has-text('I agree')",
    ".cookie-banner button:first-of-type",
    "[aria-label*='cookie' i] button",
    "[id*='consent' i] button",
]

async def auto_dismiss_cookies(page: Page):
    """Attempts to dismiss cookie/GDPR banners safely without throwing."""
    for selector in COOKIE_SELECTORS:
        try:
            loc = page.locator(selector).first
            if await loc.is_visible(timeout=250):
                await loc.click(timeout=500)
                await page.wait_for_timeout(200)
                break
        except Exception:
            continue

async def discover_nav_links(page: Page, root_url: str, max_links: int = 5) -> List[str]:
    """Finds up to max_links same-origin links discovered via navigation landmarks."""
    origin = f"{urlparse(root_url).scheme}://{urlparse(root_url).netloc}"
    discovered = []
    try:
        links = await page.eval_on_selector_all(
            "nav a[href], header a[href], [role='navigation'] a[href]",
            """elements => elements.map(e => e.href)"""
        )
        for link in links:
            if not link:
                continue
            clean_link = link.split("#")[0].rstrip("/")
            clean_root = root_url.split("#")[0].rstrip("/")
            if clean_link.startswith(origin) and clean_link != clean_root and clean_link not in discovered:
                if not any(clean_link.lower().endswith(ext) for ext in ('.png', '.jpg', '.pdf', '.zip', '.svg')):
                    # Also verify candidate link passes SSRF safety
                    is_safe, _ = validate_target_url(clean_link)
                    if is_safe:
                        discovered.append(clean_link)
                        if len(discovered) >= max_links:
                            break
    except Exception:
        pass
    return discovered

async def scripted_scroll_and_hover(page: Page):
    """Executes smooth scroll routine down the page and hovers over interactive elements."""
    try:
        scroll_height = await page.evaluate("() => document.body.scrollHeight")
        steps = [0.25, 0.5, 0.75, 1.0]
        for step in steps:
            target_y = int(scroll_height * step)
            await page.evaluate(f"(y) => window.scrollTo({{ top: y, behavior: 'smooth' }})", target_y)
            await page.wait_for_timeout(250)

        await page.evaluate("() => window.scrollTo({ top: 0, behavior: 'smooth' })")
        await page.wait_for_timeout(200)

        # Subtle hover over visible interactive controls
        buttons = page.locator("button:visible, a:visible").locator("visible=true")
        count = min(await buttons.count(), 5)
        for i in range(count):
            try:
                await buttons.nth(i).hover(timeout=300)
                await page.wait_for_timeout(100)
            except Exception:
                pass
    except Exception:
        pass

async def enforce_get_only_routes(page: Page):
    """
    Route interceptor enforcing:
    1. GET / HEAD / OPTIONS only (mutations aborted).
    2. Real-time SSRF re-validation on all network requests and redirects.
    """
    async def route_handler(route: Route, request: Request):
        # 1. Reject mutating methods
        if request.method.upper() not in ("GET", "HEAD", "OPTIONS"):
            await route.abort("blockedbyclient")
            return

        # 2. Allow local data, blob, and test file URIs
        req_url = request.url
        if req_url.startswith("data:") or req_url.startswith("blob:") or req_url.startswith("file:"):
            await route.continue_()
            return

        # 3. Re-validate request target for SSRF (handles redirects to internal/metadata endpoints)
        is_safe, _ = validate_target_url(req_url)
        if not is_safe:
            # Abort connection immediately before request is dispatched
            await route.abort("accessdenied")
            return

        await route.continue_()

    await page.route("**/*", route_handler)
