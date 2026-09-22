import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/mockStore';
import { generateAnimationPatch } from '@/lib/patchGenerator';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const scanId = params.id;
  const scan = getScan(scanId);

  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  const patches: Array<{
    issue_id: string;
    check_id: string;
    title: string;
    patch_css: string;
    target_selectors: string[];
    verified: boolean;
  }> = [];

  for (const issue of scan.issues || []) {
    const patchSet = generateAnimationPatch(issue);
    if (patchSet.patchable) {
      patches.push({
        issue_id: issue.id,
        check_id: issue.check_id,
        title: issue.title,
        patch_css: patchSet.css,
        target_selectors: patchSet.target_selectors,
        verified: Boolean(issue.verified_patch_css),
      });
    }
  }

  return NextResponse.json({
    scan_id: scanId,
    patches,
  });
}
