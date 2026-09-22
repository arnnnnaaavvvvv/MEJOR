export interface PatchSet {
  css: string;
  target_selectors: string[];
  patch_type: string;
  reversible: boolean;
  patchable: boolean;
  reason?: string;
}

export interface PerformanceMetrics {
  avg_fps: number;
  p95_frame_time_ms: number;
  dropped_frames: number;
  longtask_total_ms: number;
}

export interface PatchResult {
  issue_id: string;
  scan_id: string;
  patchable: boolean;
  applied: boolean;
  reason_if_skipped?: string;
  patch_css: string;
  target_selectors: string[];
  before_metrics?: PerformanceMetrics;
  after_metrics?: PerformanceMetrics;
  before_clip_url?: string;
  after_clip_url?: string;
  delta_fps?: number;
  created_at: string;
}

const DISALLOWED_JS_PATTERNS = [
  /gsap/i,
  /_gsap/i,
  /TweenMax|TweenLite/i,
  /framer-motion|motion\.[a-z]+/i,
  /lottie|bodymovin/i,
  /canvas|webgl|three\.js/i,
];

const LAYOUT_PROPERTIES = [
  'left', 'right', 'top', 'bottom',
  'width', 'height',
  'margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom',
  'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom'
];

export function detectJsAnimationLibrary(text: string): string | null {
  for (const pat of DISALLOWED_JS_PATTERNS) {
    if (pat.test(text)) {
      return `js_library_detected: ${pat.source}`;
    }
  }
  return null;
}

export function generateAnimationPatch(issue: any, pageContext: string = ''): PatchSet {
  const selector = issue.location?.selector?.trim() || '[data-animated]';

  // 1. Check for JS animation libraries
  const corpus = `${issue.problem || ''} ${issue.title || ''} ${issue.fix_goal || ''} ${JSON.stringify(issue.evidence || {})} ${pageContext}`;
  const jsReason = detectJsAnimationLibrary(corpus);
  if (jsReason) {
    return {
      css: '',
      target_selectors: [selector],
      patch_type: 'animation-transform-rewrite',
      reversible: true,
      patchable: false,
      reason: jsReason,
    };
  }

  // 2. Parse animated property
  const measured = issue.evidence?.measured_values || {};
  let prop = (measured.animated_property || measured.property || '').toLowerCase();
  if (!prop) {
    for (const lp of LAYOUT_PROPERTIES) {
      if ((issue.problem || '').toLowerCase().includes(lp) || (issue.title || '').toLowerCase().includes(lp)) {
        prop = lp;
        break;
      }
    }
  }

  if (!prop) {
    return {
      css: '',
      target_selectors: [selector],
      patch_type: 'animation-transform-rewrite',
      reversible: true,
      patchable: false,
      reason: 'non_derivable_property: layout property could not be safely isolated',
    };
  }

  // 3. Disqualify sibling-affecting properties
  if (prop.includes('padding')) {
    return {
      css: '',
      target_selectors: [selector],
      patch_type: 'animation-transform-rewrite',
      reversible: true,
      patchable: false,
      reason: 'unsafe_flow_property: padding animations cause structural reflow of sibling elements',
    };
  }

  // Timing
  const duration = measured.duration || '0.3s';
  const easing = measured.easing || 'ease';
  const delay = measured.delay || '0s';

  let css = '';
  if (prop === 'left') {
    css = `${selector} {\n  transition: transform ${duration} ${easing} ${delay} !important;\n  will-change: transform !important;\n  transform: translateX(var(--target-x, 100%)) !important;\n  left: 0 !important;\n}`;
  } else if (prop === 'right') {
    css = `${selector} {\n  transition: transform ${duration} ${easing} ${delay} !important;\n  will-change: transform !important;\n  transform: translateX(calc(-1 * var(--target-x, 100%))) !important;\n  right: 0 !important;\n}`;
  } else if (prop === 'top') {
    css = `${selector} {\n  transition: transform ${duration} ${easing} ${delay} !important;\n  will-change: transform !important;\n  transform: translateY(var(--target-y, 100%)) !important;\n  top: 0 !important;\n}`;
  } else if (prop === 'bottom') {
    css = `${selector} {\n  transition: transform ${duration} ${easing} ${delay} !important;\n  will-change: transform !important;\n  transform: translateY(calc(-1 * var(--target-y, 100%))) !important;\n  bottom: 0 !important;\n}`;
  } else if (prop === 'width') {
    css = `${selector} {\n  transition: transform ${duration} ${easing} ${delay} !important;\n  will-change: transform !important;\n  transform-origin: left center !important;\n  transform: scaleX(var(--target-scale-x, 1)) !important;\n}`;
  } else if (prop === 'height') {
    css = `${selector} {\n  transition: transform ${duration} ${easing} ${delay} !important;\n  will-change: transform !important;\n  transform-origin: top center !important;\n  transform: scaleY(var(--target-scale-y, 1)) !important;\n}`;
  } else if (prop.startsWith('margin')) {
    css = `${selector} {\n  transition: transform ${duration} ${easing} ${delay} !important;\n  will-change: transform !important;\n  transform: translate3d(var(--offset-x, 0), var(--offset-y, 0), 0) !important;\n}`;
  } else {
    css = `${selector} {\n  will-change: transform, opacity !important;\n  transform: translateZ(0) !important;\n}`;
  }

  return {
    css,
    target_selectors: [selector],
    patch_type: 'animation-transform-rewrite',
    reversible: true,
    patchable: true,
  };
}
