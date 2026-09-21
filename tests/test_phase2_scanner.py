import pytest
import os
from apps.worker.scanner_engine import scanner_engine
from apps.worker.storage import storage

@pytest.mark.asyncio
async def test_scanner_engine_local_html(tmp_path):
    # Create a simple local HTML file to test Playwright scan
    html_file = tmp_path / "test_page.html"
    html_file.write_text("""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Auditor Test Page</title>
        <style>
            body { font-family: sans-serif; margin: 0; padding: 20px; }
            h1 { font-size: 32px; color: #111827; }
            button.cta { font-size: 14px; padding: 12px 24px; background: #2563eb; color: #fff; }
        </style>
    </head>
    <body>
        <nav>
            <a href="#home">Home</a>
            <a href="#about">About</a>
        </nav>
        <h1>Hello Auditor</h1>
        <p>This is a synthetic test page for Playwright capture.</p>
        <button class="cta">Click Me</button>
    </body>
    </html>
    """)

    file_url = f"file:///{str(html_file).replace(os.sep, '/')}"
    scan_id = "test_scan_p2"

    events = []
    async def on_progress(phase, pct, msg):
        events.append((phase, pct, msg))

    pages = await scanner_engine.scan_site(file_url, scan_id=scan_id, mode="quick", progress_callback=on_progress)

    assert len(pages) >= 1
    root_page = pages[0]
    assert root_page.is_root is True
    assert 1440 in root_page.viewport_data
    assert 390 in root_page.viewport_data

    vp_1440 = root_page.viewport_data[1440]
    assert os.path.exists(vp_1440.screenshot_path)
    assert os.path.getsize(vp_1440.screenshot_path) > 0
    assert len(events) > 0
