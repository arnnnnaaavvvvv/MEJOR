import fs from 'fs';
import path from 'path';

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
      check_id: 'UX-IOS-AUTOZOOM',
      layer: 'UX',
      severity: 'CRITICAL',
      confidence: 'HIGH',
      tier: 'A',
      title: 'iOS Safari Auto-Zoom Viewport Trap on Form Inputs (<16px Font)',
      problem: 'Form inputs on vibe-saas-example.dev evaluate to 13px/14px. On iOS Safari devices, tapping any input under 16px forces the browser to aggressively zoom in, disorienting mobile users.',
      evidence: {
        measured_values: { detected_font_size: '13.5px', os_trigger_threshold: '16px', platform: 'iOS Mobile Safari' },
        expected_values: { min_font_size_mobile: '16px' },
      },
      location: { selector: 'input:not([type="checkbox"]):not([type="radio"]), select, textarea' },
      fix_goal: 'Enforce minimum 16px font-size on mobile viewports while preserving compact desktop layout.',
      constraints: ['Preserve existing input border and padding geometry.'],
      acceptance_check: 'All text inputs compute to font-size >= 16px on viewport widths <= 768px.',
      fix_prompt: '### AI FIX PROMPT: [UX-IOS-AUTOZOOM]\n@media (max-width: 768px) {\n  input:not([type="checkbox"]):not([type="radio"]),\n  select,\n  textarea {\n    font-size: 16px !important;\n  }\n}',
      patchable: true,
      verified_patch_css: `@media (max-width: 768px) {\n  input:not([type="checkbox"]):not([type="radio"]),\n  select,\n  textarea {\n    font-size: 16px !important;\n  }\n}`,
    },
    {
      id: 'iss_demo_02',
      check_id: 'UX-TAP-LATENCY',
      layer: 'UX',
      severity: 'MAJOR',
      confidence: 'HIGH',
      tier: 'A',
      title: '300ms Mobile Tap Latency Lag (Missing touch-action: manipulation)',
      problem: 'Interactive buttons and links lack touch-action: manipulation. Mobile browsers enforce a 300ms delay after every touch to detect potential double-tap gestures.',
      evidence: {
        measured_values: { touch_action_declared: false, tap_delay_ms: 300 },
        expected_values: { touch_action: 'manipulation' },
      },
      location: { selector: 'button, [role="button"], a.btn, .cta-btn' },
      fix_goal: 'Eliminate the 300ms touch delay by declaring touch-action: manipulation on all interactive controls.',
      constraints: ['Retain single-tap accessibility and pinch-to-zoom.'],
      acceptance_check: 'Taps trigger instant click event dispatch with zero synthetic latency.',
      fix_prompt: '### AI FIX PROMPT: [UX-TAP-LATENCY]\nbutton, a, [role="button"] {\n  touch-action: manipulation !important;\n  -webkit-tap-highlight-color: transparent !important;\n}',
      patchable: true,
      verified_patch_css: `button, a, [role="button"], input[type="button"] {\n  touch-action: manipulation !important;\n  -webkit-tap-highlight-color: transparent !important;\n}`,
    },
    {
      id: 'iss_demo_03',
      check_id: 'A11Y-FOCUS-OBLITERATED',
      layer: 'UX',
      severity: 'CRITICAL',
      confidence: 'HIGH',
      tier: 'A',
      title: 'Keyboard Focus Indicator Obliterated (outline: none Without :focus-visible)',
      problem: 'Styles suppress outline with outline: none without providing an alternative :focus-visible ring. Keyboard navigators pressing Tab receive zero visual feedback.',
      evidence: {
        measured_values: { outline_suppressed: true, focus_visible_ring_present: false },
        expected_values: { focus_visible_ring: '>= 2px high-contrast outline' },
      },
      location: { selector: 'button:focus-visible, a:focus-visible, input:focus-visible' },
      fix_goal: 'Restore high-contrast focus rings specifically for keyboard tab navigation using :focus-visible.',
      constraints: ['Do not show focus rings on mouse click events.'],
      acceptance_check: 'Pressing Tab illuminates the focused element with a 2.5px distinct indicator.',
      fix_prompt: '### AI FIX PROMPT: [A11Y-FOCUS-OBLITERATED]\n:focus-visible {\n  outline: 2.5px solid #3b82f6 !important;\n  outline-offset: 2.5px !important;\n  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25) !important;\n}',
      patchable: true,
      verified_patch_css: `:focus-visible {\n  outline: 2.5px solid #3b82f6 !important;\n  outline-offset: 2.5px !important;\n  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25) !important;\n}`,
    },
    {
      id: 'iss_demo_04',
      check_id: 'UI-FLEX-SQUISH',
      layer: 'UI',
      severity: 'MAJOR',
      confidence: 'HIGH',
      tier: 'A',
      title: 'Flexbox Icon & Badge Micro-Crush Distortion (Missing flex-shrink: 0)',
      problem: 'Inline SVG icons and notification chips inside flex containers omit flex-shrink: 0. When container width constricts, icons are crushed into non-proportional ovals.',
      evidence: {
        measured_values: { flex_shrink_specified: false, default_flex_shrink: 1 },
        expected_values: { flex_shrink: 0 },
      },
      location: { selector: '[class*="flex"] > svg, .badge, .status-indicator' },
      fix_goal: 'Prevent icon aspect-ratio distortion by locking flex-shrink to 0 across all inline media.',
      constraints: ['Allow adjacent text labels to wrap gracefully.'],
      acceptance_check: 'Icons maintain exact 1:1 aspect-ratio under narrow container constraints.',
      fix_prompt: '### AI FIX PROMPT: [UI-FLEX-SQUISH]\n[class*="flex"] > svg, .badge, .status-indicator {\n  flex-shrink: 0 !important;\n}',
      patchable: true,
      verified_patch_css: `[class*="flex"] > svg, .badge, .status-indicator {\n  flex-shrink: 0 !important;\n}`,
    },
    {
      id: 'iss_demo_05',
      check_id: 'UI-HOVER-JITTER',
      layer: 'UI',
      severity: 'MAJOR',
      confidence: 'HIGH',
      tier: 'B',
      title: 'Hover Micro-Shift Layout Jitter (Dynamic Border Displacement)',
      problem: 'Interactive buttons add a border dynamically on :hover without reserving border geometry in the idle state, shifting adjacent siblings by 1-2px.',
      evidence: {
        measured_values: { border_change_on_hover: true, layout_shift_detected: '1.5px sibling displacement' },
        expected_values: { idle_border: 'transparent border or inset box-shadow' },
      },
      location: { selector: 'button, [role="button"], a.btn' },
      fix_goal: 'Reserve transparent border in the idle state to eliminate layout jitter on hover.',
      constraints: ['Maintain existing background and font color transitions.'],
      acceptance_check: 'Hovering over buttons causes zero bounding box displacement of adjacent siblings.',
      fix_prompt: '### AI FIX PROMPT: [UI-HOVER-JITTER]\nbutton, [role="button"], a.btn {\n  border: 1.5px solid transparent !important;\n  box-sizing: border-box !important;\n}\nbutton:hover, [role="button"]:hover, a.btn:hover {\n  border-color: currentColor !important;\n}',
      patchable: true,
      verified_patch_css: `button, [role="button"], a.btn {\n  border: 1.5px solid transparent !important;\n  box-sizing: border-box !important;\n}\nbutton:hover, [role="button"]:hover, a.btn:hover {\n  border-color: currentColor !important;\n}`,
    },
    {
      id: 'iss_demo_06',
      check_id: 'UX-VIEWPORT-BLEED',
      layer: 'UX',
      severity: 'CRITICAL',
      confidence: 'HIGH',
      tier: 'A',
      title: '100vw Horizontal Scrollbar Bleed & Viewport Width Leak',
      problem: 'Elements use 100vw viewport width without container clipping. On systems with persistent vertical scrollbars (Windows, Android), this causes an unwanted horizontal scrollbar.',
      evidence: {
        measured_values: { full_bleed_unit: '100vw', client_width_delta_px: 17 },
        expected_values: { full_bleed_rule: 'width: 100% or overflow-x: clip' },
      },
      location: { selector: 'body, [class*="w-screen"], [style*="100vw"]' },
      fix_goal: 'Contain horizontal bleed by setting overflow-x: clip on html and body.',
      constraints: ['Preserve full desktop bleed without horizontal scrollbars.'],
      acceptance_check: 'Page has zero horizontal scrollbar on devices with persistent vertical scrollbars.',
      fix_prompt: '### AI FIX PROMPT: [UX-VIEWPORT-BLEED]\nhtml, body {\n  max-width: 100% !important;\n  overflow-x: clip !important;\n}',
      patchable: true,
      verified_patch_css: `html, body {\n  max-width: 100% !important;\n  overflow-x: clip !important;\n}`,
    },
  ],
  master_prompt: `# MASTER ARCHITECTURAL REMEDIATION PLAN: INVISIBLE INTERFACE DEFECTS
Target: https://vibe-saas-example.dev
Total Issues: 6 Critical & Major Hidden Interface Defects

1. [UX-IOS-AUTOZOOM] iOS Safari Auto-Zoom Viewport Trap on Form Inputs (<16px Font)
   - Target Selector: input:not([type="checkbox"]):not([type="radio"]), select, textarea
   - Goal: Enforce minimum 16px font-size on mobile viewports while preserving compact desktop layout.
2. [UX-TAP-LATENCY] 300ms Mobile Tap Latency Lag (Missing touch-action: manipulation)
   - Target Selector: button, [role="button"], a.btn, .cta-btn
   - Goal: Eliminate the 300ms touch delay by declaring touch-action: manipulation on all interactive controls.
3. [A11Y-FOCUS-OBLITERATED] Keyboard Focus Indicator Obliterated (outline: none Without :focus-visible)
   - Target Selector: button:focus-visible, a:focus-visible, input:focus-visible
   - Goal: Restore high-contrast focus rings specifically for keyboard tab navigation using :focus-visible.
4. [UI-FLEX-SQUISH] Flexbox Icon & Badge Micro-Crush Distortion (Missing flex-shrink: 0)
   - Target Selector: [class*="flex"] > svg, .badge, .status-indicator
   - Goal: Prevent icon aspect-ratio distortion by locking flex-shrink to 0 across all inline media.
5. [UI-HOVER-JITTER] Hover Micro-Shift Layout Jitter (Dynamic Border Displacement)
   - Target Selector: button, [role="button"], a.btn
   - Goal: Reserve transparent border in the idle state to eliminate layout jitter on hover.
6. [UX-VIEWPORT-BLEED] 100vw Horizontal Scrollbar Bleed & Viewport Width Leak
   - Target Selector: body, [class*="w-screen"], [style*="100vw"]
   - Goal: Contain horizontal bleed by setting overflow-x: clip on html and body.`,
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

const CACHE_FILE = process.platform === 'win32'
  ? path.join(process.cwd(), '.next', 'cache', 'mejor_scans.json')
  : '/tmp/mejor_scans.json';

function readDiskCache(): Record<string, StoredScan> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch(e) {}
  return {};
}

function writeDiskCache(data: Record<string, StoredScan>) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf-8');
  } catch(e) {}
}

export function getScan(id: string): StoredScan | undefined {
  if (globalScans.has(id)) {
    return globalScans.get(id);
  }
  const disk = readDiskCache();
  if (disk[id]) {
    globalScans.set(id, disk[id]);
    return disk[id];
  }
  return undefined;
}

export function saveScan(scan: StoredScan): void {
  globalScans.set(scan.id, scan);
  const disk = readDiskCache();
  disk[scan.id] = scan;
  writeDiskCache(disk);
}

export function getAllScans(): StoredScan[] {
  const disk = readDiskCache();
  Object.values(disk).forEach((s) => {
    if (!globalScans.has(s.id)) globalScans.set(s.id, s);
  });
  return Array.from(globalScans.values());
}
