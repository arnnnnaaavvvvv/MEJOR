export interface StoredScan {
  id: string;
  target_url: string;
  normalized_domain: string;
  mode: string;
  status: string;
  overall_score: number;
  grade: string;
  layer_scores: Record<string, number>;
  coverage_stats: {
    total_checks_in_catalog: number;
    checks_executed: number;
    passed_count: number;
    failed_count: number;
    tier_breakdown: Record<string, number>;
  };
  issues: any[];
  master_prompt: string;
  parent_scan_id?: string;
  share_token?: string;
  created_at: string;
  completed_at?: string;
}

// In-memory global store across serverless invocations within warm container
const globalScans: Map<string, StoredScan> = new Map();

// Seed initial demo data
const demoBase: StoredScan = {
  id: 'demo-base-scan-001',
  target_url: 'https://vibe-saas-example.dev',
  normalized_domain: 'vibe-saas-example.dev',
  mode: 'quick',
  status: 'COMPLETED',
  overall_score: 68.5,
  grade: 'C',
  layer_scores: {
    Production: 70.0,
    UX: 60.0,
    UI: 65.0,
    States: 85.0,
    Polish: 75.0,
  },
  coverage_stats: {
    total_checks_in_catalog: 200,
    checks_executed: 45,
    passed_count: 40,
    failed_count: 5,
    tier_breakdown: { A: 38, B: 3, C: 4, D: 0, M: 0 },
  },
  issues: [
    {
      id: 'iss_demo_01',
      check_id: 'MOBI-TAP-01',
      layer: 'UX',
      severity: 'CRITICAL',
      confidence: 'HIGH',
      tier: 'A',
      title: 'Undersized Mobile Tap Target (<44x44px)',
      problem: 'CTA button has a touch bounding box of 24x24px, failing mobile touch target ergonomics.',
      evidence: {
        measured_values: { width: 24, height: 24 },
        expected_values: { min_width: 44, min_height: 44 },
      },
      location: { selector: 'button.tiny-btn', bounding_box: { x: 20, y: 140, width: 24, height: 24 } },
      fix_goal: 'Expand button padding or minimum hit dimension to 44px x 44px.',
      constraints: ['Preserve visual font size'],
      acceptance_check: 'Bounding box width and height must be >= 44px on viewports <= 768px.',
      fix_prompt: '### AI FIX PROMPT: [MOBI-TAP-01]\nExpand button.tiny-btn padding to at least 44x44px.',
    },
    {
      id: 'iss_demo_02',
      check_id: 'PROD-LEAK-01',
      layer: 'Production',
      severity: 'CRITICAL',
      confidence: 'HIGH',
      tier: 'A',
      title: "Localhost URL Leaked in Production DOM",
      problem: "Found hardcoded 'http://localhost:8080' in header dev portal link.",
      evidence: {
        measured_values: { leaked_url: 'http://localhost:8080/dev' },
        expected_values: { relative_url: true },
      },
      location: { selector: 'header nav a[href*="localhost"]' },
      fix_goal: 'Replace hardcoded localhost URL with process.env.NEXT_PUBLIC_PORTAL_URL.',
      constraints: ['Keep anchor text intact'],
      acceptance_check: 'No localhost strings in production markup.',
      fix_prompt: '### AI FIX PROMPT: [PROD-LEAK-01]\nReplace http://localhost:8080 with environment variable.',
    },
    {
      id: 'iss_demo_03',
      check_id: 'PROD-UNDEF-01',
      layer: 'Production',
      severity: 'CRITICAL',
      confidence: 'HIGH',
      tier: 'A',
      title: "Literal 'undefined' Rendered to User",
      problem: "User status node displays unhandled 'undefined' string.",
      evidence: {
        measured_values: { rendered_literal: 'undefined' },
        expected_values: { fallback: true },
      },
      location: { selector: 'div.user-info span' },
      fix_goal: "Add nullish coalescing: user?.username ?? 'Guest'.",
      constraints: ['Do not hide profile container'],
      acceptance_check: "Text must not render 'undefined'.",
      fix_prompt: "### AI FIX PROMPT: [PROD-UNDEF-01]\nGuard username interpolation with ?? 'Guest'.",
    },
  ],
  master_prompt: `# MASTER ARCHITECTURAL REMEDIATION PLAN
Target: https://vibe-saas-example.dev
Total Issues: 3 (Critical: 3, Major: 0, Minor: 0)

1. [MOBI-TAP-01] Undersized Mobile Tap Target (<44x44px)
   - Target Selector: button.tiny-btn
   - Goal: Expand button padding or minimum hit dimension to 44px x 44px.
2. [PROD-LEAK-01] Localhost URL Leaked in Production DOM
   - Target Selector: header nav a[href*="localhost"]
   - Goal: Replace hardcoded localhost URL with process.env.NEXT_PUBLIC_PORTAL_URL.
3. [PROD-UNDEF-01] Literal 'undefined' Rendered to User
   - Target Selector: div.user-info span
   - Goal: Add nullish coalescing: user?.username ?? 'Guest'.`,
  share_token: 'demo-share-token-12345',
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
};

const demoRescan: StoredScan = {
  id: 'demo-rescan-diff-002',
  parent_scan_id: 'demo-base-scan-001',
  target_url: 'https://vibe-saas-example.dev',
  normalized_domain: 'vibe-saas-example.dev',
  mode: 'quick',
  status: 'COMPLETED',
  overall_score: 94.0,
  grade: 'A',
  layer_scores: {
    Production: 100.0,
    UX: 92.0,
    UI: 90.0,
    States: 95.0,
    Polish: 93.0,
  },
  coverage_stats: {
    total_checks_in_catalog: 200,
    checks_executed: 45,
    passed_count: 44,
    failed_count: 1,
    tier_breakdown: { A: 40, B: 2, C: 2, D: 0, M: 0 },
  },
  issues: [
    {
      id: 'iss_demo_04',
      check_id: 'UI-LINE-01',
      layer: 'UX',
      severity: 'MINOR',
      confidence: 'HIGH',
      tier: 'A',
      title: 'Excessive Text Line Length (>75 Chars)',
      problem: 'Paragraph line length slightly wide at 82 chars.',
      evidence: {
        measured_values: { chars_per_line: 82 },
        expected_values: { max_chars: 75 },
      },
      location: { selector: 'p.hero-text' },
      fix_goal: 'Add max-w-prose class.',
      constraints: [],
      acceptance_check: 'Line length <= 75ch.',
      fix_prompt: '### AI FIX PROMPT: [UI-LINE-01]\nWrap reading copy in max-w-prose container.',
    },
  ],
  master_prompt: `# MASTER ARCHITECTURAL REMEDIATION PLAN (RESCAN)
Target: https://vibe-saas-example.dev
All critical issues resolved! Score: 94 (Grade A).`,
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
};

globalScans.set(demoBase.id, demoBase);
globalScans.set(demoRescan.id, demoRescan);

export function getScan(id: string): StoredScan | undefined {
  return globalScans.get(id);
}

export function saveScan(scan: StoredScan): void {
  globalScans.set(scan.id, scan);
}

export function getAllScans(): StoredScan[] {
  return Array.from(globalScans.values());
}
