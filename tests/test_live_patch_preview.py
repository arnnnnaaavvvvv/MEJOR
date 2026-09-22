import os
import pytest
from playwright.async_api import async_playwright

from packages.shared.schemas import Issue, Evidence, Location, PatchSet
from apps.worker.patch_preview import compute_metrics_from_telemetry, run_live_patch_preview


def test_compute_metrics_from_telemetry():
    # 60 frames evenly spaced at 16.66ms = 60fps
    fake_raf = [{"deltaMs": 16.66, "scrollY": 0} for _ in range(60)]
    fake_longtasks = []

    metrics = compute_metrics_from_telemetry(fake_raf, fake_longtasks)
    assert 59.0 <= metrics.avg_fps <= 61.0
    assert metrics.dropped_frames == 0
    assert metrics.longtask_total_ms == 0.0

    # Stutter test: 10 frames taking 50ms (dropped frames)
    stutter_raf = [{"deltaMs": 50.0, "scrollY": 0} for _ in range(10)]
    stutter_longtasks = [{"duration": 50.0, "startTime": 100, "name": "self"}]

    stutter_metrics = compute_metrics_from_telemetry(stutter_raf, stutter_longtasks)
    assert stutter_metrics.avg_fps <= 25.0
    assert stutter_metrics.dropped_frames == 10
    assert stutter_metrics.longtask_total_ms == 50.0


@pytest.mark.asyncio
async def test_run_live_patch_preview_on_seeded_fixture():
    fixture_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "fixtures", "seeded_site", "index.html"))
    file_url = f"file:///{fixture_path.replace(os.sep, '/')}"

    issue = Issue(
        check_id="PERF-PROP-01",
        layer="Polish",
        severity="MAJOR",
        confidence="HIGH",
        title="Layout-inducing width transition",
        problem="Element transitions width property causing layout recalculations.",
        evidence=Evidence(
            measured_values={"animated_property": "width", "duration": "0.3s", "easing": "ease"}
        ),
        location=Location(selector=".animated-box"),
        fix_goal="Refactor to transform: scaleX().",
        acceptance_check="Smooth 60fps compositor animation."
    )

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            result = await run_live_patch_preview(
                browser=browser,
                url=file_url,
                scan_id="test_scan_live_001",
                issue=issue
            )

            assert result.patchable is True
            assert result.applied is True
            assert "will-change: transform" in result.patch_css
            assert ".animated-box" in result.patch_css
            assert result.before_metrics is not None
            assert result.after_metrics is not None
            assert issue.verified_patch_css is not None
        finally:
            await browser.close()


@pytest.mark.asyncio
async def test_run_live_patch_preview_refuses_unpatchable():
    issue = Issue(
        check_id="PERF-PROP-01",
        layer="Polish",
        severity="MAJOR",
        confidence="HIGH",
        title="GSAP ScrollTrigger Stutter",
        problem="gsap ScrollTrigger tweening width coordinates.",
        evidence=Evidence(measured_values={"animated_property": "width"}),
        location=Location(selector=".box"),
        fix_goal="Optimize GSAP animation.",
        acceptance_check="Clean animation."
    )

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            result = await run_live_patch_preview(
                browser=browser,
                url="about:blank",
                scan_id="test_scan_refuse_002",
                issue=issue
            )

            assert result.patchable is False
            assert result.applied is False
            assert "js_library_detected" in (result.reason_if_skipped or "")
            assert result.patch_css == ""
        finally:
            await browser.close()
