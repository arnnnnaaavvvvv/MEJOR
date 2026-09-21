import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/mockStore';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; compare_id: string } }
) {
  const scanA = getScan(params.id);
  const scanB = getScan(params.compare_id);

  if (!scanA || !scanB) {
    return NextResponse.json({ detail: 'One or both scans not found' }, { status: 404 });
  }

  const mapA = new Map(scanA.issues.map((i: any) => [i.check_id, i]));
  const mapB = new Map(scanB.issues.map((i: any) => [i.check_id, i]));

  const resolved = scanA.issues.filter((i: any) => !mapB.has(i.check_id));
  const persistent = scanA.issues.filter((i: any) => mapB.has(i.check_id));
  const newIssues = scanB.issues.filter((i: any) => !mapA.has(i.check_id));

  const scoreDelta = Math.round(((scanB.overall_score || 0) - (scanA.overall_score || 0)) * 10) / 10;

  return NextResponse.json({
    base_scan_id: scanA.id,
    compare_scan_id: scanB.id,
    base_url: scanA.target_url,
    score_delta: scoreDelta,
    grade_delta: `${scanA.grade} -> ${scanB.grade}`,
    resolved_issues: resolved,
    persistent_issues: persistent,
    new_issues: newIssues,
  });
}
