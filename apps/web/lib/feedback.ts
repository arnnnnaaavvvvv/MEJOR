export interface LayerFeedback {
  name: string;
  score: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK' | 'CRITICAL';
  statusLabel: string;
  summary: string;
  issueCount: number;
}

export interface WebsiteFeedback {
  verdictTitle: string;
  verdictDescription: string;
  gradeBadge: string;
  gradeColor: string;
  statusTheme: 'emerald' | 'blue' | 'amber' | 'rose';
  strength: string;
  primaryFix: string;
  layers: LayerFeedback[];
}

interface IssueLike {
  layer: string;
  severity: string;
  title: string;
  check_id: string;
}

export function generateWebsiteFeedback(
  overallScore: number,
  grade: string,
  layerScores: Record<string, number>,
  issues: IssueLike[] = [],
  domain: string = 'your website'
): WebsiteFeedback {
  // Determine overall status theme
  let statusTheme: 'emerald' | 'blue' | 'amber' | 'rose' = 'blue';
  let verdictTitle = '';
  let verdictDescription = '';
  let strength = '';
  let primaryFix = '';

  if (overallScore >= 90) {
    statusTheme = 'emerald';
    verdictTitle = 'Production Ready & High Velocity';
    verdictDescription = `${domain} exhibits top-tier engineering discipline. Visual hierarchy, performance metrics, and production hygiene are in the top 5% of audited web applications.`;
    strength = 'High edge cache efficiency, strict accessibility compliance, and zero severe layout blockers.';
    primaryFix = 'Fine-tune font preloading and edge stale-while-revalidate headers for sub-100ms global response times.';
  } else if (overallScore >= 75) {
    statusTheme = 'blue';
    verdictTitle = 'Solid Foundation with UX & Polish Gaps';
    verdictDescription = `${domain} delivers a reliable core experience, but subtle mobile ergonomics and layout animation stutters hold it back from top-tier polish.`;
    strength = 'Stable production infrastructure and consistent general layout structure.';
    primaryFix = 'Expand mobile touch targets to 44px minimum and transition animated CSS properties to GPU transforms.';
  } else if (overallScore >= 60) {
    statusTheme = 'amber';
    verdictTitle = 'User Experience & Production Vulnerabilities Detected';
    verdictDescription = `${domain} has notable architectural flaws that actively hurt conversion, mobile navigation, or search engine indexing.`;
    strength = 'Core page documents load and render without fatal script crashes.';
    primaryFix = 'Purge leaked development endpoints, fix undersized touch targets, and restore 4.5:1 text contrast ratios.';
  } else {
    statusTheme = 'rose';
    verdictTitle = 'High Defect Density — Immediate Remediation Required';
    verdictDescription = `${domain} failed critical baseline standards across multiple layers. The application is at risk of poor user retention and severe usability degradation.`;
    strength = 'Baseline DOM structure is present and queryable.';
    primaryFix = 'Execute Pass 1 critical fixes immediately to resolve interactive blockers and visual regressions.';
  }

  // Generate layer-by-layer feedback
  const layerOrder = ['Production', 'UX', 'UI', 'States', 'Polish'];
  const layers: LayerFeedback[] = layerOrder.map((layerName) => {
    const score = layerScores[layerName] ?? Math.round(overallScore);
    const layerIssues = issues.filter((i) => i.layer.toLowerCase() === layerName.toLowerCase());
    const issueCount = layerIssues.length;

    let status: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK' | 'CRITICAL' = 'GOOD';
    let statusLabel = 'Good';
    let summary = '';

    if (score >= 90) {
      status = 'EXCELLENT';
      statusLabel = 'Excellent';
    } else if (score >= 75) {
      status = 'GOOD';
      statusLabel = 'Good';
    } else if (score >= 60) {
      status = 'NEEDS_WORK';
      statusLabel = 'Needs Work';
    } else {
      status = 'CRITICAL';
      statusLabel = 'Critical Action';
    }

    switch (layerName) {
      case 'Production':
        if (score >= 90) {
          summary = 'Hardened architecture: Zero CLS shifts, clean server transport, and resilient edge delivery.';
        } else if (score >= 75) {
          summary = 'Stable foundation, with minor media aspect-ratio reservations recommended to prevent CLS.';
        } else {
          summary = 'Production hazard: Unsized dynamic media triggering Cumulative Layout Shifts (CLS) on network loads.';
        }
        break;

      case 'UX':
        if (score >= 90) {
          summary = 'Ergonomic & invisible defect immune: Zero 300ms tap delay, iOS zoom immune, and accessible keyboard focus.';
        } else if (score >= 75) {
          summary = 'Solid flow, but form inputs (<16px) risk iOS auto-zoom and buttons lack touch-action: manipulation.';
        } else {
          summary = 'High interaction friction: Obliterated focus rings, iOS auto-zoom traps, or unannounced icon buttons.';
        }
        break;

      case 'UI':
        if (score >= 90) {
          summary = 'Rock-solid layout geometry: Zero hover micro-shift jitter, safe-area protected, and squish-free flex icons.';
        } else if (score >= 75) {
          summary = 'Clean aesthetics, but flex icons lack flex-shrink: 0 and dynamic borders cause hover micro-shifts.';
        } else {
          summary = 'Layout instability: 100vw viewport scrollbar leaks, flex icon crushing, or parent dropdown clipping.';
        }
        break;

      case 'States':
        if (score >= 90) {
          summary = 'Resilient UI states: Verified skeletons, empty placeholders, and graceful error handling.';
        } else if (score >= 75) {
          summary = 'Solid core states, but delayed response simulations expose unhandled pending states.';
        } else {
          summary = 'Vulnerable state handling: Skeletons missing on network latency; layout shifts on data load.';
        }
        break;

      case 'Polish':
        if (score >= 90) {
          summary = 'Flawless optical rendering: Integer pixel snapping, subpixel blur immune, and motion-safe guards.';
        } else if (score >= 75) {
          summary = 'Refined micro-interactions, with minor subpixel transform centering refactors recommended.';
        } else {
          summary = 'Optical degradation: Blurry typography from fractional transforms and continuous unthrottled keyframes.';
        }
        break;

      default:
        summary = `${layerName} scored ${score}/100 based on automated measurements.`;
    }

    return {
      name: layerName,
      score,
      status,
      statusLabel,
      summary,
      issueCount,
    };
  });

  return {
    verdictTitle,
    verdictDescription,
    gradeBadge: `Grade ${grade}`,
    gradeColor: statusTheme,
    statusTheme,
    strength,
    primaryFix,
    layers,
  };
}
