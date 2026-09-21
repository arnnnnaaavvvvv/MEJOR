import pytest
from httpx import AsyncClient, ASGITransport
from apps.api.main import app
from apps.api.core.database import init_db

@pytest.mark.asyncio
async def test_api_scan_lifecycle():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Health
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] in ("healthy", "degraded")

        # Create scan
        resp = await client.post("/api/v1/scans", json={"url": "https://example.com", "mode": "quick"})
        assert resp.status_code == 202
        data = resp.json()
        assert "id" in data
        assert data["status"] == "QUEUED"
        scan_id = data["id"]

        # Get status
        status_resp = await client.get(f"/api/v1/scans/{scan_id}")
        assert status_resp.status_code == 200
        assert status_resp.json()["target_url"] == "https://example.com"

        # Share
        share_resp = await client.post(f"/api/v1/scans/{scan_id}/share")
        assert share_resp.status_code == 200
        assert "share_token" in share_resp.json()

        # Badge
        badge_resp = await client.get("/api/v1/badges/example.com.svg")
        assert badge_resp.status_code == 200
        assert "image/svg+xml" in badge_resp.headers["content-type"]
        assert "<svg" in badge_resp.text
