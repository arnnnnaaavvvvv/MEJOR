import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from apps.api.core.database import get_db, ScanModel, PageModel, ArtifactModel, IssueModel
from apps.api.core.security import validate_target_url, check_rate_limit
from apps.api.core.redis_client import redis_service
from packages.shared.schemas import (
    ScanRequest, ScanResponse, ScanReport, DiffReport, Issue, Evidence, Location,
    CoverageStats, ArtifactMeta
)
from packages.scoring_prompts import get_manual_checklist

router = APIRouter(prefix="/api/v1/scans", tags=["Scans"])

@router.post("", status_code=202)
async def create_scan(
    payload: ScanRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    check_rate_limit(request)

    # 1. SSRF URL Validation
    is_valid, validated_url_or_err = validate_target_url(payload.url)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"SSRF Security Violation: {validated_url_or_err}")

    canonical_url = validated_url_or_err
    domain = urlparse(canonical_url).netloc

    # 2. Idempotency Check: Return running scan if requested within last 2 minutes
    recent_threshold = datetime.utcnow() - timedelta(minutes=2)
    stmt = select(ScanModel).where(
        and_(
            ScanModel.target_url == canonical_url,
            ScanModel.mode == payload.mode,
            ScanModel.status.in_(["QUEUED", "IN_PROGRESS", "VALIDATING"]),
            ScanModel.created_at >= recent_threshold
        )
    )
    res = await db.execute(stmt)
    existing = res.scalars().first()
    if existing:
        return {
            "id": existing.id,
            "target_url": existing.target_url,
            "normalized_domain": existing.normalized_domain,
            "mode": existing.mode,
            "status": existing.status,
            "progress_url": f"/api/v1/scans/{existing.id}/events",
            "created_at": existing.created_at
        }

    # 3. Create Scan Entity
    scan_id = str(uuid.uuid4())
    scan = ScanModel(
        id=scan_id,
        target_url=canonical_url,
        normalized_domain=domain,
        mode=payload.mode,
        status="QUEUED"
    )
    db.add(scan)
    await db.commit()

    # 4. Enqueue Job to Redis
    queue_name = "scan.quick" if payload.mode == "quick" else "scan.deep"
    await redis_service.push_task(queue_name, {
        "scan_id": scan_id,
        "target_url": canonical_url,
        "mode": payload.mode
    })

    return {
        "id": scan_id,
        "target_url": canonical_url,
        "normalized_domain": domain,
        "mode": payload.mode,
        "status": "QUEUED",
        "progress_url": f"/api/v1/scans/{scan_id}/events",
        "created_at": scan.created_at
    }

@router.get("/{scan_id}")
async def get_scan_status(scan_id: str, db: AsyncSession = Depends(get_db)):
    scan = await db.get(ScanModel, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {
        "id": scan.id,
        "target_url": scan.target_url,
        "mode": scan.mode,
        "status": scan.status,
        "overall_score": scan.overall_score,
        "grade": scan.grade,
        "error_message": scan.error_message,
        "created_at": scan.created_at,
        "completed_at": scan.completed_at
    }

@router.get("/{scan_id}/events")
async def stream_scan_events(scan_id: str, db: AsyncSession = Depends(get_db)):
    scan = await db.get(ScanModel, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    channel = f"scan.progress.{scan_id}"

    async def event_generator():
        # If already completed or failed, emit final state immediately
        if scan.status in ("COMPLETED", "FAILED"):
            yield f"event: progress\ndata: {{\"phase\":\"{scan.status}\", \"pct\": 100, \"message\":\"Scan {scan.status.lower()}\"}}\n\n"
            return

        async for event_raw in redis_service.event_generator(channel):
            yield f"event: progress\ndata: {event_raw}\n\n"
            if '"pct": 100' in event_raw:
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/{scan_id}/report")
async def get_scan_report(scan_id: str, db: AsyncSession = Depends(get_db)):
    # Query scan with issues and artifacts
    scan_stmt = select(ScanModel).where(ScanModel.id == scan_id)
    res = await db.execute(scan_stmt)
    scan = res.scalars().first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    issues_stmt = select(IssueModel).where(IssueModel.scan_id == scan_id)
    issues_res = await db.execute(issues_stmt)
    db_issues = issues_res.scalars().all()

    report_issues: List[Issue] = []
    for i in db_issues:
        report_issues.append(Issue(
            id=i.id,
            check_id=i.check_id,
            layer=i.layer,
            severity=i.severity,
            confidence=i.confidence,
            tier=i.tier,
            title=i.title,
            problem=i.problem,
            evidence=Evidence(**(i.evidence or {})),
            location=Location(**(i.location or {})),
            fix_goal=i.fix_goal,
            constraints=i.constraints or [],
            acceptance_check=i.acceptance_check,
            fix_prompt=i.fix_prompt
        ))

    artifacts_stmt = select(ArtifactModel).where(ArtifactModel.scan_id == scan_id)
    art_res = await db.execute(artifacts_stmt)
    db_artifacts = art_res.scalars().all()
    artifacts = [
        ArtifactMeta(
            id=a.id,
            type=a.artifact_type,
            viewport=a.viewport,
            file_path=a.file_path,
            url=a.url,
            size_bytes=a.byte_size
        )
        for a in db_artifacts
    ]

    cov = CoverageStats(**(scan.coverage_stats or {}))

    return ScanReport(
        scan_id=scan.id,
        target_url=scan.target_url,
        normalized_domain=scan.normalized_domain,
        mode=scan.mode,
        status=scan.status,
        overall_score=scan.overall_score or 0.0,
        grade=scan.grade or "N/A",
        layer_scores=scan.layer_scores or {},
        coverage=cov,
        issues=report_issues,
        master_prompt=scan.master_prompt or "",
        manual_checklist=get_manual_checklist(),
        artifacts=artifacts,
        share_token=scan.share_token,
        created_at=scan.created_at,
        completed_at=scan.completed_at
    )

@router.post("/{scan_id}/rescan", status_code=202)
async def trigger_rescan(scan_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    base_scan = await db.get(ScanModel, scan_id)
    if not base_scan:
        raise HTTPException(status_code=404, detail="Base scan not found")

    new_scan_id = str(uuid.uuid4())
    new_scan = ScanModel(
        id=new_scan_id,
        target_url=base_scan.target_url,
        normalized_domain=base_scan.normalized_domain,
        mode=base_scan.mode,
        status="QUEUED",
        parent_scan_id=base_scan.id
    )
    db.add(new_scan)
    await db.commit()

    queue_name = "scan.quick" if base_scan.mode == "quick" else "scan.deep"
    await redis_service.push_task(queue_name, {
        "scan_id": new_scan_id,
        "target_url": base_scan.target_url,
        "mode": base_scan.mode
    })

    return {
        "id": new_scan_id,
        "parent_scan_id": base_scan.id,
        "status": "QUEUED",
        "progress_url": f"/api/v1/scans/{new_scan_id}/events"
    }

@router.get("/{scan_id}/diff/{compare_id}")
async def get_scan_diff(scan_id: str, compare_id: str, db: AsyncSession = Depends(get_db)):
    scan_a = await db.get(ScanModel, scan_id)
    scan_b = await db.get(ScanModel, compare_id)
    if not scan_a or not scan_b:
        raise HTTPException(status_code=404, detail="One or both scans not found")

    issues_a_stmt = select(IssueModel).where(IssueModel.scan_id == scan_id)
    issues_b_stmt = select(IssueModel).where(IssueModel.scan_id == compare_id)
    
    issues_a = (await db.execute(issues_a_stmt)).scalars().all()
    issues_b = (await db.execute(issues_b_stmt)).scalars().all()

    map_a = {i.check_id: i for i in issues_a}
    map_b = {i.check_id: i for i in issues_b}

    resolved_ids = set(map_a.keys()) - set(map_b.keys())
    persistent_ids = set(map_a.keys()) & set(map_b.keys())
    new_ids = set(map_b.keys()) - set(map_a.keys())

    def to_schema(db_iss):
        return Issue(
            id=db_iss.id,
            check_id=db_iss.check_id,
            layer=db_iss.layer,
            severity=db_iss.severity,
            confidence=db_iss.confidence,
            tier=db_iss.tier,
            title=db_iss.title,
            problem=db_iss.problem,
            evidence=Evidence(**(db_iss.evidence or {})),
            location=Location(**(db_iss.location or {})),
            fix_goal=db_iss.fix_goal,
            constraints=db_iss.constraints or [],
            acceptance_check=db_iss.acceptance_check,
            fix_prompt=db_iss.fix_prompt
        )

    score_delta = round((scan_b.overall_score or 0) - (scan_a.overall_score or 0), 1)

    return DiffReport(
        base_scan_id=scan_a.id,
        compare_scan_id=scan_b.id,
        base_url=scan_a.target_url,
        score_delta=score_delta,
        grade_delta=f"{scan_a.grade} -> {scan_b.grade}",
        resolved_issues=[to_schema(map_a[cid]) for cid in resolved_ids],
        persistent_issues=[to_schema(map_b[cid]) for cid in persistent_ids],
        new_issues=[to_schema(map_b[cid]) for cid in new_ids]
    )

import secrets

@router.post("/{scan_id}/share")
async def generate_share_link(scan_id: str, db: AsyncSession = Depends(get_db)):
    scan = await db.get(ScanModel, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if not scan.share_token:
        scan.share_token = secrets.token_urlsafe(32)
        await db.commit()

    return {
        "share_token": scan.share_token,
        "share_url": f"/scans/share/{scan.share_token}"
    }
