import pytest
from apps.api.core.security import validate_target_url, is_ip_blocked
from apps.api.core.database import init_db, async_session, ScanModel
from apps.api.core.config import settings

@pytest.mark.asyncio
async def test_ssrf_validator_blocked():
    # Loopback
    valid, msg = validate_target_url("http://127.0.0.1:8000/test")
    assert not valid
    assert "restricted or private" in msg or "resolves to restricted" in msg

    # Cloud metadata
    valid, msg = validate_target_url("http://169.254.169.254/latest/meta-data")
    assert not valid

    # Private IP
    valid, msg = validate_target_url("http://192.168.1.1/admin")
    assert not valid

    # Disallowed scheme
    valid, msg = validate_target_url("file:///etc/passwd")
    assert not valid
    assert "disallowed" in msg.lower()

    valid, msg = validate_target_url("gopher://example.com")
    assert not valid

@pytest.mark.asyncio
async def test_ssrf_validator_allowed():
    valid, url = validate_target_url("https://example.com")
    assert valid
    assert url == "https://example.com"

@pytest.mark.asyncio
async def test_database_initialization():
    await init_db()
    async with async_session() as session:
        scan = ScanModel(
            target_url="https://example.com",
            normalized_domain="example.com",
            mode="quick",
            status="QUEUED"
        )
        session.add(scan)
        await session.commit()
        assert scan.id is not None
