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
    checks_executed: 200,
    passed_count: 195,
    failed_count: 5,
    tier_breakdown: { A: 135, B: 35, C: 20, D: 10, M: 0 },
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
      problem: 'Interactive action controls on vibe-saas-example.dev measure below the 44×44px minimum touch boundary on viewport width 390px.',
      evidence: {
        measured_values: { width: 32, height: 32, viewport_tested: '390x844' },
        expected_values: { min_width: 44, min_height: 44 },
      },
      location: { selector: 'header button, nav a.cta-action, div.action-group button', bounding_box: { x: 280, y: 16, width: 32, height: 32 } },
      fix_goal: 'Increase interactive padding or set minimum hit dimension to min-h-[44px] min-w-[44px].',
      constraints: ['Preserve existing font size and layout alignment.'],
      acceptance_check: 'Bounding box width and height must evaluate >= 44px on viewports <= 768px.',
      fix_prompt: '### AI FIX PROMPT: [MOBI-TAP-01]\nAdd minimum touch target dimensions or increase padding: min-h-[44px] min-w-[44px].',
      patchable: true,
      verified_patch_css: `button, [role="button"], a.btn, .cta-action {\n  min-width: 44px !important;\n  min-height: 44px !important;\n  padding: 10px 18px !important;\n}`,
    },
    {
      id: 'iss_demo_02',
      check_id: 'UI-CONTRAST-01',
      layer: 'UI',
      severity: 'MAJOR',
      confidence: 'HIGH',
      tier: 'A',
      title: 'Low Subtitle & Badge Contrast Ratio (<4.5:1)',
      problem: 'Secondary description copy and subtle badges on vibe-saas-example.dev have a calculated contrast ratio of 3.2:1 against light background (minimum 4.5:1 required for normal text).',
      evidence: {
        measured_values: { foreground_color: '#71717a', background_color: '#ffffff', contrast_ratio: 3.2 },
        expected_values: { min_contrast_ratio: 4.5 },
      },
      location: { selector: 'p.text-zinc-500, span.badge-subtext' },
      fix_goal: 'Elevate text contrast to at least 4.5:1 by adjusting font color to zinc-700 or darker.',
      constraints: ['Retain visual hierarchy between titles and body.'],
      acceptance_check: 'Calculated contrast ratio must be >= 4.5:1 under WCAG AA guidelines.',
      fix_prompt: '### AI FIX PROMPT: [UI-CONTRAST-01]\nUpdate text classes from text-zinc-500 to text-zinc-700 or text-gray-800.',
      patchable: true,
      verified_patch_css: `.text-zinc-500, .text-gray-400, span.badge-subtext, p.subtitle {\n  color: #27272a !important;\n}`,
    },
    {
      id: 'iss_demo_03',
      check_id: 'POLISH-ANIM-01',
      layer: 'Polish',
      severity: 'MINOR',
      confidence: 'HIGH',
      tier: 'B',
      title: 'Missing Reduced-Motion Fallback for Ping/Pulse Animations',
      problem: "Continuous CSS keyframe animations (animate-ping / hover transforms) on vibe-saas-example.dev do not respect the user's prefers-reduced-motion OS accessibility preference.",
      evidence: {
        measured_values: { active_animations: ['animate-ping', 'hover:-translate-y-2'], reduced_motion_query_present: false },
        expected_values: { motion_safe_guard: true },
      },
      location: { selector: 'span.animate-ping, div.group, .pulse-beacon' },
      fix_goal: 'Wrap keyframe animations in motion-safe: prefix or @media (prefers-reduced-motion: no-preference).',
      constraints: ['Ensure indicator dots remain visible when animation is disabled.'],
      acceptance_check: 'Animations must pause when prefers-reduced-motion: reduce is toggled.',
      fix_prompt: "### AI FIX PROMPT: [POLISH-ANIM-01]\nWrap animations in Tailwind's motion-safe: prefix or CSS prefers-reduced-motion query.",
      patchable: true,
      verified_patch_css: `@media (prefers-reduced-motion: reduce) {\n  .animate-ping, .pulse-beacon, [class*="animate-"] {\n    animation: none !important;\n    transform: none !important;\n  }\n}`,
    },
    {
      id: 'iss_demo_04',
      check_id: 'PERF-FONT-01',
      layer: 'Production',
      severity: 'MINOR',
      confidence: 'HIGH',
      tier: 'A',
      title: 'Font Preload Swap Optimization for Vercel Edge',
      problem: 'Custom web font files loaded via Next.js can trigger Cumulative Layout Shift (CLS) if font-display swap is omitted.',
      evidence: {
        measured_values: { server: 'Vercel Edge', framework: 'Next.js', font_swap_verified: false },
        expected_values: { font_display: 'swap' },
      },
      location: { selector: 'head link[rel="preload"][as="font"]' },
      fix_goal: 'Ensure next/font declarations include display: "swap" and preload: true.',
      constraints: ['Prevent FOUT on slow networks.'],
      acceptance_check: 'CLS metric remains < 0.05 on mobile and desktop viewports.',
      fix_prompt: "### AI FIX PROMPT: [PERF-FONT-01]\nEnsure next/font declarations include display: 'swap' in layout.tsx.",
      patchable: true,
      verified_patch_css: `@font-face {\n  font-display: swap !important;\n}`,
    },
  ],
  master_prompt: `# MASTER ARCHITECTURAL REMEDIATION PLAN
Target: https://vibe-saas-example.dev
Total Issues: 4 (Critical: 1, Major: 1, Minor: 2)

1. [MOBI-TAP-01] Undersized Mobile Tap Target (<44x44px)
   - Target Selector: header button, nav a.cta-action
   - Goal: Increase interactive padding or set minimum hit dimension to min-h-[44px] min-w-[44px].
2. [UI-CONTRAST-01] Low Subtitle & Badge Contrast Ratio (<4.5:1)
   - Target Selector: p.text-zinc-500, span.badge-subtext
   - Goal: Elevate text contrast to at least 4.5:1 by adjusting font color to zinc-700 or darker.
3. [POLISH-ANIM-01] Missing Reduced-Motion Fallback for Ping/Pulse Animations
   - Target Selector: span.animate-ping, .pulse-beacon
   - Goal: Wrap keyframe animations in motion-safe: prefix or @media (prefers-reduced-motion: no-preference).
4. [PERF-FONT-01] Font Preload Swap Optimization for Vercel Edge
   - Target Selector: head link[rel="preload"][as="font"]
   - Goal: Ensure next/font declarations include display: "swap" and preload: true.`,
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
    checks_executed: 200,
    passed_count: 199,
    failed_count: 1,
    tier_breakdown: { A: 140, B: 35, C: 15, D: 10, M: 0 },
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
