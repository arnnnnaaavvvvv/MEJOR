from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from apps.api.core.database import get_db, ScanModel

router = APIRouter(prefix="/api/v1/badges", tags=["Badges"])

@router.get("/{domain}.svg")
async def get_badge_svg(domain: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ScanModel).where(
        ScanModel.normalized_domain == domain,
        ScanModel.status == "COMPLETED"
    ).order_by(ScanModel.created_at.desc())
    res = await db.execute(stmt)
    scan = res.scalars().first()

    score_str = f"{int(scan.overall_score)} ({scan.grade})" if scan and scan.overall_score else "N/A"
    color = "#10b981" if scan and (scan.overall_score or 0) >= 85 else ("#f59e0b" if scan and (scan.overall_score or 0) >= 70 else "#ef4444")

    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" width="160" height="24" viewBox="0 0 160 24">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="160" height="24" rx="4" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#1f2937" d="M0 0h90v24H0z"/>
    <path fill="{color}" d="M90 0h70v24H90z"/>
    <path fill="url(#b)" d="M0 0h160v24H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="45" y="16" fill="#010101" fill-opacity=".3">vibe audit</text>
    <text x="45" y="15">vibe audit</text>
    <text x="125" y="16" fill="#010101" fill-opacity=".3">{score_str}</text>
    <text x="125" y="15">{score_str}</text>
  </g>
</svg>"""

    return Response(content=svg_content, media_type="image/svg+xml")
