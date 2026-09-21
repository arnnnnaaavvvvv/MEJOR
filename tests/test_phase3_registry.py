import pytest
from packages.check_registry import registry
from apps.worker.scanner_types import PageScanData, ViewportCaptureData

def test_registry_count():
    checks = registry.get_all()
    print(f"Total checks registered: {len(checks)}")
    assert len(checks) >= 40, f"Expected at least 40 checks, got {len(checks)}"

def test_registry_detects_defects():
    # Build synthetic page with known defects: undefined leak, localhost leak, and font explosion
    broken_dom = """
    <html>
      <head></head>
      <body>
        <h1>Title</h1>
        <h2>Subtitle</h2>
        <p>User status: undefined</p>
        <a href="http://localhost:3000/dashboard">Local Dashboard</a>
        <input type="text" placeholder="Enter email">
        <button style="width: 20px; height: 20px;">X</button>
      </body>
    </html>
    """

    page_data = PageScanData(
        url="https://test.example.com",
        is_root=True,
        viewport_data={
            1440: ViewportCaptureData(
                viewport=1440,
                screenshot_path="",
                screenshot_url="",
                dom_html=broken_dom,
                computed_styles={
                    "h1": {"fontSize": "48px"},
                    "h2": {"fontSize": "52px"} # Heading scale inversion!
                },
                element_boxes={
                    "button": {"x": 10, "y": 10, "width": 20, "height": 20}
                }
            ),
            390: ViewportCaptureData(
                viewport=390,
                screenshot_path="",
                screenshot_url="",
                dom_html=broken_dom,
                element_boxes={
                    "button": {"x": 10, "y": 10, "width": 20, "height": 20}
                }
            )
        }
    )

    issues = registry.run_all(page_data)
    issue_ids = {i.check_id for i in issues}

    assert "PROD-UNDEF-01" in issue_ids # Found undefined
    assert "PROD-LEAK-01" in issue_ids  # Found localhost
    assert "UI-HEAD-01" in issue_ids    # Found heading inversion (h2 >= h1)
    assert "MOBI-TAP-01" in issue_ids   # Found 20x20 tap target
    assert "A11Y-PHL-01" in issue_ids   # Found placeholder only input
