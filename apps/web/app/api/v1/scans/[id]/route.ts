import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/mockStore';
import { auditWebsite, extractUrlFromScanId } from '@/lib/auditor';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let scan = getScan(params.id);
  if (!scan) {
    const fallbackUrl = extractUrlFromScanId(params.id);
    if (fallbackUrl) {
      scan = await auditWebsite(fallbackUrl);
    }
  }
  if (!scan) {
    return NextResponse.json({ detail: 'Scan not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: scan.id,
    target_url: scan.target_url,
    normalized_domain: scan.normalized_domain,
    mode: scan.mode,
    status: scan.status,
    overall_score: scan.overall_score,
    grade: scan.grade,
    created_at: scan.created_at,
    completed_at: scan.completed_at,
  });
}
