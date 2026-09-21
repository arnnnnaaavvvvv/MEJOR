import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/mockStore';

const MANUAL_CHECKLIST = [
  {
    id: 'MANU-001',
    title: 'Multi-Tab Session Synchronization',
    layer: 'States',
    instructions: 'Open site in Tab 1 and Tab 2. Log out in Tab 1, verify Tab 2 session invalidates on navigation.',
    verification_script: `localStorage.clear(); sessionStorage.clear(); window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: null }));`,
  },
  {
    id: 'MANU-002',
    title: 'Screen Reader Orientation Voice Announcement',
    layer: 'UX',
    instructions: 'Enable VoiceOver/NVDA. Rotate screen between portrait and landscape. Verify landmarks remain accessible.',
  },
  {
    id: 'MANU-003',
    title: 'Payment Gateway Offline Resilience',
    layer: 'Production',
    instructions: 'Trigger checkout with network throttled to offline. Verify clear retry alert appears without double billing.',
  },
];

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const scan = getScan(params.id);
  if (!scan) {
    return NextResponse.json({ detail: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({
    scan_id: scan.id,
    target_url: scan.target_url,
    normalized_domain: scan.normalized_domain,
    mode: scan.mode,
    status: scan.status,
    overall_score: scan.overall_score,
    grade: scan.grade,
    layer_scores: scan.layer_scores,
    coverage: scan.coverage_stats,
    issues: scan.issues,
    master_prompt: scan.master_prompt,
    manual_checklist: MANUAL_CHECKLIST,
    artifacts: [],
    share_token: scan.share_token,
    created_at: scan.created_at,
    completed_at: scan.completed_at,
  });
}
