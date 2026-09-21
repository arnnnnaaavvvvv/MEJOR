import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/mockStore';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const scan = getScan(params.id);
  if (!scan) {
    return NextResponse.json({ detail: 'Scan not found' }, { status: 404 });
  }

  if (!scan.share_token) {
    scan.share_token = 'share_' + Math.random().toString(36).substring(2, 12);
  }

  return NextResponse.json({
    share_token: scan.share_token,
    share_url: `/scans/share/${scan.share_token}`,
  });
}
