import { NextRequest, NextResponse } from 'next/server';
import { getScan, saveScan, StoredScan } from '@/lib/mockStore';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const baseScan = getScan(params.id);
  if (!baseScan) {
    return NextResponse.json({ detail: 'Base scan not found' }, { status: 404 });
  }

  const rescanId = 'rescan_' + Math.random().toString(36).substring(2, 10);
  const newScan: StoredScan = {
    ...baseScan,
    id: rescanId,
    parent_scan_id: baseScan.id,
    overall_score: Math.min(100, (baseScan.overall_score || 70) + 15),
    grade: 'A',
    status: 'COMPLETED',
    issues: baseScan.issues.slice(0, 1), // resolved most issues
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };

  saveScan(newScan);

  return NextResponse.json(
    {
      id: rescanId,
      parent_scan_id: baseScan.id,
      status: 'QUEUED',
      progress_url: `/api/v1/scans/${rescanId}/events`,
    },
    { status: 202 }
  );
}
