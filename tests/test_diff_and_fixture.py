import pytest
import os
from httpx import AsyncClient, ASGITransport
from apps.api.main import app
from apps.api.core.database import init_db
from apps.worker.scanner_engine import scanner_engine
from packages.check_registry import registry

@pytest.mark.asyncio
async def test_diff_endpoint_with_seeded_data():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/scans/demo-base-scan-001/diff/demo-rescan-diff-002")
        assert res.status_code == 200
        data = res.json()
        assert data["score_delta"] == 25.5
        assert len(data["resolved_issues"]) >= 3
        resolved_checks = {i["check_id"] for i in data["resolved_issues"]}
        assert "MOBI-TAP-01" in resolved_checks
        assert "PROD-LEAK-01" in resolved_checks
        assert "PROD-UNDEF-01" in resolved_checks

@pytest.mark.asyncio
async def test_seeded_site_fixture_audit():
    fixture_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "fixtures", "seeded_site", "index.html"))
    file_url = f"file:///{fixture_path.replace(os.sep, '/')}"

    pages = await scanner_engine.scan_site(file_url, scan_id="fixture_audit_test", mode="quick")
    assert len(pages) >= 1
    root_page = pages[0]

    issues = registry.run_all(root_page)
    detected_checks = {i.check_id for i in issues}

    # Verify our deliberately seeded defects were all caught by the auditor!
    assert "PROD-UNDEF-01" in detected_checks # 'undefined' text
    assert "PROD-LEAK-01" in detected_checks  # 'localhost' leak
    assert "MOBI-VIEW-01" in detected_checks  # missing viewport meta tag
    assert "UI-HEAD-01" in detected_checks    # heading scale inversion (h2 >= h1)
    assert "MOBI-TAP-01" in detected_checks   # undersized 24x24 button
    assert "A11Y-PHL-01" in detected_checks   # placeholder only input
