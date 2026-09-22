import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/mockStore';
import { generateAnimationPatch } from '@/lib/patchGenerator';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; issueId: string } }
) {
  const scanId = params.id;
  const issueId = params.issueId;

  const scan = getScan(scanId);
  if (!scan) {
    return new NextResponse('Scan not found', { status: 404 });
  }

  const issue = scan.issues?.find((i: any) => i.id === issueId);
  if (!issue) {
    return new NextResponse('Issue not found', { status: 404 });
  }

  let patchCss = issue.verified_patch_css;
  if (!patchCss) {
    const patchSet = generateAnimationPatch(issue);
    if (!patchSet.patchable) {
      return new NextResponse(`Cannot export patch: ${patchSet.reason || 'Unpatchable'}`, { status: 400 });
    }
    patchCss = patchSet.css;
  }

  const fileHeader = `/* MEJOR Live Verified CSS Patch: [${issue.check_id}] ${issue.title} */\n/* Generated for ${scan.target_url} */\n\n`;
  const fullContent = fileHeader + patchCss;

  return new NextResponse(fullContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Content-Disposition': `attachment; filename="mejor_patch_${issue.check_id?.toLowerCase() || 'fix'}_${issueId}.css"`,
    },
  });
}
