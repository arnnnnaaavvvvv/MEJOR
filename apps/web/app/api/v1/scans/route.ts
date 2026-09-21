import { NextRequest, NextResponse } from 'next/server';
import { saveScan, StoredScan } from '@/lib/mockStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, mode = 'quick' } = body;

    if (!url) {
      return NextResponse.json({ detail: 'URL is required.' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ detail: 'Invalid URL format.' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ detail: 'Only HTTP and HTTPS schemes are permitted.' }, { status: 400 });
    }

    const host = parsedUrl.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host === '169.254.169.254'
    ) {
      return NextResponse.json({ detail: 'SSRF Security Violation: Target IP is in a restricted subnet.' }, { status: 400 });
    }

    const scanId = 'scan_' + Math.random().toString(36).substring(2, 10);
    const domain = parsedUrl.hostname;

    // Create new scan record
    const newScan: StoredScan = {
      id: scanId,
      target_url: url,
      normalized_domain: domain,
      mode,
      status: 'IN_PROGRESS',
      overall_score: 87.5,
      grade: 'A',
      layer_scores: {
        Production: 95.0,
        UX: 85.0,
        UI: 88.0,
        States: 80.0,
        Polish: 85.0,
      },
      coverage_stats: {
        total_checks_in_catalog: 200,
        checks_executed: 45,
        passed_count: 42,
        failed_count: 3,
        tier_breakdown: { A: 40, B: 2, C: 3, D: 0, M: 0 },
      },
      issues: [
        {
          id: 'iss_live_01',
          check_id: 'MOBI-TAP-01',
          layer: 'UX',
          severity: 'CRITICAL',
          confidence: 'HIGH',
          tier: 'A',
          title: 'Undersized Mobile Tap Target (<44x44px)',
          problem: 'Interactive element button.nav-cta is 32x32px on mobile viewports.',
          evidence: {
            measured_values: { width: 32, height: 32 },
            expected_values: { min_width: 44, min_height: 44 },
          },
          location: { selector: 'header button.nav-cta', bounding_box: { x: 300, y: 16, width: 32, height: 32 } },
          fix_goal: 'Increase padding to achieve minimum 44px x 44px touch area.',
          constraints: ['Preserve desktop layout'],
          acceptance_check: 'Touch target dimensions must be >= 44px on mobile viewports.',
          fix_prompt: '### AI FIX PROMPT: [MOBI-TAP-01]\nIncrease header button.nav-cta hit area to 44x44px using padding or min-h-[44px].',
        },
        {
          id: 'iss_live_02',
          check_id: 'UI-LINE-01',
          layer: 'UX',
          severity: 'MINOR',
          confidence: 'HIGH',
          tier: 'A',
          title: 'Excessive Reading Line Length (>75 Chars)',
          problem: 'Hero description copy spans unbounded container width.',
          evidence: {
            measured_values: { chars_per_line: 88 },
            expected_values: { max_chars: 75 },
          },
          location: { selector: 'main p.hero-copy' },
          fix_goal: 'Apply max-w-prose or max-width: 65ch container.',
          constraints: [],
          acceptance_check: 'Line length should remain <= 75 characters.',
          fix_prompt: '### AI FIX PROMPT: [UI-LINE-01]\nAdd max-w-prose wrapper to main p.hero-copy.',
        },
      ],
      master_prompt: `# MASTER ARCHITECTURAL REMEDIATION PLAN
Target: ${url}
Total Issues: 2 (Critical: 1, Minor: 1)

1. [MOBI-TAP-01] Undersized Mobile Tap Target (<44x44px)
   - Selector: header button.nav-cta
   - Goal: Increase padding to achieve minimum 44px x 44px touch area.
2. [UI-LINE-01] Excessive Reading Line Length (>75 Chars)
   - Selector: main p.hero-copy
   - Goal: Apply max-w-prose or max-width: 65ch container.`,
      share_token: 'share_' + Math.random().toString(36).substring(2, 12),
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    saveScan(newScan);

    return NextResponse.json(
      {
        id: scanId,
        target_url: url,
        normalized_domain: domain,
        mode,
        status: 'QUEUED',
        progress_url: `/api/v1/scans/${scanId}/events`,
        created_at: newScan.created_at,
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 });
  }
}
