import asyncio
import json
import traceback
from datetime import datetime
from typing import Optional
from sqlalchemy import select, update
from apps.api.core.config import settings
from apps.api.core.logging import logger, configure_logging
from apps.api.core.database import async_session, ScanModel, PageModel, ArtifactModel, IssueModel
from apps.api.core.redis_client import redis_service
from apps.worker.scanner_engine import scanner_engine
from apps.worker.simulations import simulation_runner
from packages.check_registry import registry
from packages.llm_analysis import llm_analyzer
from packages.scoring_prompts import calculate_scores, generate_issue_prompt, generate_master_prompt

configure_logging()

async def emit_progress(scan_id: str, phase: str, pct: int, message: str):
    channel = f"scan.progress.{scan_id}"
    payload = {
        "scan_id": scan_id,
        "phase": phase,
        "pct": pct,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    await redis_service.publish_event(channel, payload)

async def process_scan_job(job_data: dict):
    scan_id = job_data["scan_id"]
    target_url = job_data["target_url"]
    mode = job_data.get("mode", "quick")

    logger.info("Processing scan job", scan_id=scan_id, url=target_url, mode=mode)
    await emit_progress(scan_id, "VALIDATING", 5, "Validating target and starting worker")

    try:
        # Progress callback hook for scanner
        async def progress_hook(phase: str, pct: int, msg: str):
            await emit_progress(scan_id, phase, pct, msg)

        # 1. Run Core Scanner Pass
        pages = await scanner_engine.scan_site(
            url=target_url,
            scan_id=scan_id,
            mode=mode,
            progress_callback=progress_hook
        )

        if not pages:
            raise RuntimeError("Scanner failed to extract page content.")

        root_page = pages[0]

        # 2. Simulation Lab (for deep mode or extra robustness)
        sim_issues = []
        if mode == "deep":
            await emit_progress(scan_id, "SIMULATION_PASS", 75, "Executing failure lab and chaos mode simulations")
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                try:
                    # Run Failure Lab
                    failure_results = await simulation_runner.run_failure_lab(browser, target_url, scan_id)
                    for f in failure_results:
                        issues = registry.run_all(root_page, simulation_type=f["type"])
                        sim_issues.extend(issues)

                    # Run Chaos Mode
                    chaos_res = await simulation_runner.run_chaos_mode(browser, target_url, scan_id)
                    if chaos_res:
                        issues = registry.run_all(root_page, simulation_type=chaos_res["type"])
                        sim_issues.extend(issues)

                    # Run Emulation / Squint
                    await simulation_runner.run_emulation_and_perception(browser, target_url, scan_id)
                finally:
                    await browser.close()

        # 3. Check Registry Execution (Tier A & C)
        await emit_progress(scan_id, "EVAL_CHECKS", 85, "Evaluating 45+ deterministic and simulation checks")
        detected_issues = registry.run_all(root_page)
        detected_issues.extend(sim_issues)

        # 4. LLM Vision Audit (Tier B)
        await emit_progress(scan_id, "LLM_ANALYSIS", 90, "Running multimodal vision evaluation on visual hierarchy")
        try:
            tier_b_issues = await llm_analyzer.run_vision_audit(root_page)
            detected_issues.extend(tier_b_issues)
        except Exception as e:
            logger.warning("LLM vision audit skipped or failed", error=str(e))

        # 5. Compile Fix Prompts and Scores
        await emit_progress(scan_id, "COMPILE_PROMPTS", 95, "Generating tailored AI fix prompts and scoring")
        for iss in detected_issues:
            iss.fix_prompt = generate_issue_prompt(iss)

        overall_score, grade, layer_scores, coverage = calculate_scores(detected_issues)
        master_prompt = generate_master_prompt(detected_issues, target_url)

        # 6. Persist to Database
        async with async_session() as db:
            scan = await db.get(ScanModel, scan_id)
            if scan:
                scan.status = "COMPLETED"
                scan.overall_score = overall_score
                scan.grade = grade
                scan.layer_scores = layer_scores
                scan.coverage_stats = coverage.model_dump()
                scan.master_prompt = master_prompt
                scan.completed_at = datetime.utcnow()

                # Add Pages
                for p in pages:
                    db_page = PageModel(
                        scan_id=scan_id,
                        url=p.url,
                        is_root=p.is_root,
                        http_status=p.http_status,
                        page_title=p.title
                    )
                    db.add(db_page)

                # Add Issues
                for iss in detected_issues:
                    db_issue = IssueModel(
                        id=iss.id,
                        scan_id=scan_id,
                        check_id=iss.check_id,
                        layer=iss.layer,
                        severity=iss.severity,
                        confidence=iss.confidence,
                        tier=iss.tier,
                        title=iss.title,
                        problem=iss.problem,
                        evidence=iss.evidence.model_dump(),
                        location=iss.location.model_dump(),
                        fix_goal=iss.fix_goal,
                        constraints=iss.constraints,
                        acceptance_check=iss.acceptance_check,
                        fix_prompt=iss.fix_prompt
                    )
                    db.add(db_issue)

                await db.commit()

        await emit_progress(scan_id, "COMPLETED", 100, f"Audit complete! Score: {overall_score} ({grade})")
        logger.info("Scan completed successfully", scan_id=scan_id, score=overall_score, grade=grade)

    except Exception as e:
        logger.error("Scan job failed", scan_id=scan_id, error=str(e), trace=traceback.format_exc())
        async with async_session() as db:
            scan = await db.get(ScanModel, scan_id)
            if scan:
                scan.status = "FAILED"
                scan.error_message = str(e)
                await db.commit()
        await emit_progress(scan_id, "FAILED", 100, f"Scan failed: {str(e)}")

async def run_worker():
    logger.info("Starting Worker Daemon...")
    await redis_service.connect()
    
    while True:
        try:
            # Poll quick queue first, then deep queue
            job = await redis_service.pop_task("scan.quick", timeout=1)
            if not job:
                job = await redis_service.pop_task("scan.deep", timeout=1)

            if job:
                await process_scan_job(job)
            else:
                await asyncio.sleep(0.5)
        except Exception as e:
            logger.error("Worker loop exception", error=str(e))
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(run_worker())
