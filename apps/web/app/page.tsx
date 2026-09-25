'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  Sliders,
  Cpu,
  Monitor,
  Smartphone,
  Eye,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCode,
  Terminal,
  Code2,
  Check,
  Activity,
  Maximize2,
  Lock,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Step {
  id: string;
  name: string;
  completed: boolean;
  active: boolean;
}

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'quick' | 'deep'>('quick');
  const [scanning, setScanning] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Active showcase defect tab
  const [activeDefectTab, setActiveDefectTab] = useState<number>(0);

  const [steps, setSteps] = useState<Step[]>([
    { id: '1', name: 'SSRF Validation & Pre-flight', completed: false, active: false },
    { id: '2', name: 'Root Crawl & Nav Discovery', completed: false, active: false },
    { id: '3', name: 'CDP Telemetry & Animation Pass', completed: false, active: false },
    { id: '4', name: 'Multi-Viewport Visual Capture', completed: false, active: false },
    { id: '5', name: 'Simulation Lab & Edge Cases', completed: false, active: false },
    { id: '6', name: 'Deterministic Check Suite (45+)', completed: false, active: false },
    { id: '7', name: 'LLM Vision & AI Fix Prompts', completed: false, active: false },
  ]);

  const updateSteps = (pct: number) => {
    setProgressPct(pct);
    setSteps((prev) =>
      prev.map((step, idx) => {
        const threshold = (idx + 1) * 14;
        return {
          ...step,
          completed: pct >= threshold,
          active: pct >= threshold - 14 && pct < threshold,
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setErrorMsg('');
    setScanning(true);
    setProgressPct(5);
    setCurrentMessage('Initiating scan pre-flight checks...');

    // Auto-prepend https:// if protocol was omitted
    let targetUrl = url.trim().replace(/^["'`]+|["'`]+$/g, '');
    if (!targetUrl.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, mode }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Scan request failed');
      }

      const data = await res.json();
      const scanId = data.id;

      // Subscribe to Server-Sent Events (SSE)
      const eventSource = new EventSource(`${API_BASE}/api/v1/scans/${scanId}/events`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.pct) updateSteps(payload.pct);
          if (payload.message) setCurrentMessage(payload.message);

          if (payload.pct >= 100 || payload.phase === 'COMPLETED') {
            eventSource.close();
            setTimeout(() => {
              router.push(`/scans/${scanId}`);
            }, 800);
          } else if (payload.phase === 'FAILED') {
            eventSource.close();
            setErrorMsg(payload.message || 'Scan execution encountered an error.');
            setScanning(false);
          }
        } catch (err) {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        // Fallback polling if SSE drops
        const pollInterval = setInterval(async () => {
          const pollRes = await fetch(`${API_BASE}/api/v1/scans/${scanId}`);
          if (pollRes.ok) {
            const statusData = await pollRes.json();
            if (statusData.status === 'COMPLETED') {
              clearInterval(pollInterval);
              router.push(`/scans/${scanId}`);
            } else if (statusData.status === 'FAILED') {
              clearInterval(pollInterval);
              setErrorMsg(statusData.error_message || 'Scan failed.');
              setScanning(false);
            }
          }
        }, 2000);
      };
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error.');
      setScanning(false);
    }
  };

  const defectShowcase = [
    {
      id: 'UX-IOS-AUTOZOOM',
      title: 'iOS Mobile Input Auto-Zoom Trap',
      category: 'Mobile Ergonomics',
      badge: 'CRITICAL',
      badgeColor: 'rose',
      problem:
        'Mobile Safari forcibly zooms the entire viewport when focusing any input element with a font-size smaller than 16px. This breaks fixed navigation, distorts layout, and forces the user to pinch-to-zoom out manually.',
      codeBefore: `/* Developer Code */\ninput[type="text"] {\n  font-size: 14px;\n  padding: 8px 12px;\n}`,
      codeAfter: `/* Verified Remedy */\n@media (max-width: 768px) {\n  input[type="text"] {\n    font-size: 16px !important; /* Prevents iOS auto-zoom */\n  }\n}`,
      impact: 'Eliminates 100% of unprompted viewport zooms on iPhone browsers.',
    },
    {
      id: 'UX-TAP-LATENCY',
      title: '300ms Touch Interaction Delay',
      category: 'Touch Ergonomics',
      badge: 'HIGH',
      badgeColor: 'amber',
      problem:
        'Missing touch-action rules on interactive cards and buttons cause mobile webviews to pause for 300ms to test whether the user intends a double-tap gesture, creating sluggish, unresponsive UI feel.',
      codeBefore: `/* Developer Code */\n.btn-primary, .interactive-card {\n  cursor: pointer;\n}`,
      codeAfter: `/* Verified Remedy */\n.btn-primary, .interactive-card {\n  touch-action: manipulation !important;\n  cursor: pointer;\n}`,
      impact: 'Restores instant 0ms touch trigger response on iOS and Android.',
    },
    {
      id: 'UI-FLEX-SQUISH',
      title: 'Flexbox SVG Icon Squishing',
      category: 'UI Geometry',
      badge: 'HIGH',
      badgeColor: 'amber',
      problem:
        'SVG icons placed inside flex containers without explicit flex-shrink: 0 collapse into distorted ovals when accompanying text wraps or sibling content expands.',
      codeBefore: `/* Developer Code */\n.nav-item {\n  display: flex;\n  align-items: center;\n}\n.nav-item svg { width: 20px; }`,
      codeAfter: `/* Verified Remedy */\n.nav-item svg {\n  flex-shrink: 0 !important;\n  width: 20px;\n  height: 20px;\n}`,
      impact: 'Guarantees 1:1 crisp geometry for navigation icons at any viewport width.',
    },
    {
      id: 'A11Y-FOCUS-OBLITERATED',
      title: 'Obliterated Keyboard Focus Ring',
      category: 'Visual Polish & A11y',
      badge: 'MAJOR',
      badgeColor: 'cyan',
      problem:
        'Developers frequently write "outline: none" or "outline: 0" to remove the default browser ring, leaving keyboard and switch-control users with zero visual indication of where they are.',
      codeBefore: `/* Developer Code */\nbutton:focus, a:focus {\n  outline: none; /* WCAG 2.4.7 Violation */\n}`,
      codeAfter: `/* Verified Remedy */\nbutton:focus-visible, a:focus-visible {\n  outline: 2px solid #00f5a0 !important;\n  outline-offset: 2px !important;\n}`,
      impact: 'Restores WCAG 2.4.7 conformance with a sleek, brand-aligned neon ring.',
    },
  ];

  const faqs = [
    {
      q: 'What makes invisible interface defects different from regular bugs?',
      a: 'Regular bugs trigger runtime console errors or broken HTML tags. Invisible defects, however, pass build linters and unit tests completely clean: they are subtle behavioral flaws like mobile iOS auto-zoom traps, 300ms touch delay, flexbox icon distortion, layout hover jitters, and scroll-locking leaks that degrade user experience on real mobile devices.',
    },
    {
      q: 'Does Vibe Auditor modify my production website or database?',
      a: 'Never. Vibe Auditor executes in a sandboxed, isolated headless browser session. It measures your live interface via CDP (Chrome DevTools Protocol) and calculates CSS patches in memory. You review the before-and-after live split view and decide whether to copy the fix prompts into Cursor or Claude Code.',
    },
    {
      q: 'How does the Live Before vs. After split-screen sandbox work?',
      a: 'The engine spins up two synchronized iframes: the left iframe displays your original site, while the right iframe has isolated, verified CSS remediations injected in real time. Scrolling in one frame automatically synchronizes the other so you can instantly verify the fix.',
    },
    {
      q: 'Can I copy fix prompts directly into Cursor, Claude Code, or Antigravity?',
      a: 'Yes! Every single detected defect includes a tailored remediation prompt with exact CSS selectors, measured vs. expected telemetry values, and architectural constraints designed to prevent AI hallucinations or unintended layout shifts.',
    },
    {
      q: 'Can I add Vibe Auditor to my CI/CD pipeline or embed a live badge?',
      a: 'Yes. Every audited domain generates a real-time SVG badge endpoint (e.g. /api/v1/badges/{domain}.svg) that can be embedded into your GitHub README to showcase your interface quality score.',
    },
  ];

  return (
    <div className="space-y-24">
      {/* 1. HERO SECTION & AUDIT CONSOLE */}
      <section id="audit-console" className="max-w-5xl mx-auto px-4 pt-12 sm:pt-20 scroll-mt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.15)] mb-6 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>ENGINE v2.0 • 200 DETERMINISTIC CHECKS + INVISIBLE INTERFACE ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.12]">
            The Autonomous UI/UX Auditor for{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              AI-Generated Sites
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-3xl mx-auto font-normal leading-relaxed">
            AI builders & vibe coders generate visually stunning UIs riddled with subtle defects that linters miss: 300ms tap delays, iOS auto-zoom traps, flex squishing, and layout hover jitters. Vibe Auditor measures them via headless CDP and generates copy-paste fix prompts.
          </p>
        </div>

        {/* Audit Form / Scanning Console */}
        {!scanning ? (
          <form
            onSubmit={handleSubmit}
            className="bg-[#0b101c]/90 backdrop-blur-2xl p-6 sm:p-9 rounded-2xl border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden"
          >
            {/* Specular hairline top glow */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none" />

            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label htmlFor="url-input" className="block text-sm font-semibold text-slate-200 tracking-wide">
                    Target Website URL
                  </label>
                  <span className="text-xs font-mono text-slate-400">Vercel, Netlify, Custom Domains & IPs</span>
                </div>

                <div className="relative">
                  <input
                    id="url-input"
                    type="text"
                    placeholder="e.g. neurosense-orcin.vercel.app or https://your-site.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-xl bg-[#060911] border border-white/[0.1] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-base font-sans shadow-inner"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400">
                  <span className="font-medium text-slate-400">Instant Demo:</span>
                  <button
                    type="button"
                    onClick={() => setUrl('neurosense-orcin.vercel.app')}
                    className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 border border-white/[0.08] hover:border-emerald-500/30 transition text-xs font-mono font-medium flex items-center gap-1.5"
                  >
                    neurosense-orcin.vercel.app
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrl('https://vibe-saas-example.dev')}
                    className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition text-xs font-mono font-medium flex items-center gap-1.5"
                  >
                    vibe-saas-example.dev
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrl('https://linear.app')}
                    className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition text-xs font-mono font-medium flex items-center gap-1.5"
                  >
                    linear.app
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider font-mono text-slate-400">Scan Mode:</span>
                  <button
                    type="button"
                    onClick={() => setMode('quick')}
                    className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold border transition flex items-center justify-center font-mono ${
                      mode === 'quick'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'bg-white/[0.03] text-slate-400 border-white/[0.07] hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    Quick Pass (~90s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('deep')}
                    className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold border transition flex items-center justify-center font-mono ${
                      mode === 'deep'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'bg-white/[0.03] text-slate-400 border-white/[0.07] hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    Deep (Full 200 Matrix)
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.35)] active:scale-[0.98] text-sm tracking-wide"
                >
                  Run Automated Audit <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-sm flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        ) : (
          /* Active Scanning View */
          <div className="bg-[#0b101c]/95 backdrop-blur-2xl p-8 sm:p-10 rounded-2xl border border-emerald-500/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 animate-pulse" />

            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-mono font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Autonomous Audit Active
                </span>
                <h3 className="text-2xl font-bold text-white truncate max-w-md mt-1 tracking-tight">{url}</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono">
                  {progressPct}
                </span>
                <span className="text-base font-mono text-emerald-500 font-bold">%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#060911] rounded-full overflow-hidden mb-8 border border-white/[0.08] p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="p-4 bg-[#070a13] rounded-xl border border-white/[0.08] text-slate-300 text-sm mb-6 flex items-center gap-3 shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono text-xs sm:text-sm text-emerald-300 font-medium">
                {currentMessage || 'Executing CDP passes & headless telemetry...'}
              </span>
            </div>

            {/* Step list */}
            <div className="space-y-2.5">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                    step.completed
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 shadow-sm'
                      : step.active
                      ? 'bg-[#101626] border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : 'bg-[#060911]/60 border-white/[0.05] text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : step.active ? (
                      <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-700 shrink-0" />
                    )}
                    <span className="text-sm font-medium tracking-tight">{step.name}</span>
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                    {step.completed ? (
                      <span className="text-emerald-400">Done</span>
                    ) : step.active ? (
                      <span className="text-teal-300 animate-pulse">Running</span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proof Statistics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-[#0b101c]/60 p-4 rounded-xl border border-white/[0.06] text-center">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">200+</div>
            <div className="text-xs text-slate-400 mt-0.5">Automated Quality Checks</div>
          </div>
          <div className="bg-[#0b101c]/60 p-4 rounded-xl border border-white/[0.06] text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">60 FPS</div>
            <div className="text-xs text-slate-400 mt-0.5">Compositor Telemetry Pass</div>
          </div>
          <div className="bg-[#0b101c]/60 p-4 rounded-xl border border-white/[0.06] text-center">
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">3 Viewports</div>
            <div className="text-xs text-slate-400 mt-0.5">390px, 768px & 1440px Probes</div>
          </div>
          <div className="bg-[#0b101c]/60 p-4 rounded-xl border border-white/[0.06] text-center">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">0 Code Edits</div>
            <div className="text-xs text-slate-400 mt-0.5">Verified In-Browser Live Patches</div>
          </div>
        </div>
      </section>

      {/* 2. THE INVISIBLE DEFECT MATRIX */}
      <section id="defects" className="max-w-7xl mx-auto px-4 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/25 mb-4">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>SUB-PIXEL ANOMALIES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Defects That Pass Linters, But Break Real Users
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Standard linters and superficial HTML auditors check for basic syntax and missing tags. Vibe Auditor simulates actual touch input, layout geometry, and GPU frames to catch real-world friction.
          </p>
        </div>

        {/* Defect Tabs & Interactive Inspector */}
        <div className="bg-[#0b101c]/90 rounded-2xl border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Tab Selector */}
          <div className="flex flex-wrap border-b border-white/[0.08] bg-[#070a13]">
            {defectShowcase.map((defect, idx) => (
              <button
                key={defect.id}
                onClick={() => setActiveDefectTab(idx)}
                className={`flex-1 min-w-[200px] px-5 py-4 text-xs sm:text-sm font-semibold transition flex items-center justify-between border-r border-white/[0.06] last:border-r-0 ${
                  activeDefectTab === idx
                    ? 'bg-[#0b101c] text-white border-b-2 border-b-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-emerald-400 font-bold">[{defect.id}]</span>
                  <span className="truncate">{defect.title}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-400">
                  {defect.category}
                </span>
              </button>
            ))}
          </div>

          {/* Active Defect View */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {defectShowcase[activeDefectTab].badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {defectShowcase[activeDefectTab].category}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  {defectShowcase[activeDefectTab].title}
                </h3>

                <p className="text-slate-300 text-sm leading-relaxed mb-5">
                  {defectShowcase[activeDefectTab].problem}
                </p>

                <div className="p-4 bg-[#060911] rounded-xl border border-emerald-500/30 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">
                    <strong>Measured Impact:</strong> {defectShowcase[activeDefectTab].impact}
                  </span>
                </div>
              </div>

              {/* Code Comparison Box */}
              <div className="space-y-4">
                <div className="bg-[#050811] rounded-xl border border-rose-500/25 p-4 font-mono text-xs">
                  <div className="flex items-center justify-between text-rose-400 font-semibold mb-2">
                    <span>The Unnoticed Flaw (Dev Code)</span>
                    <span className="text-[10px] text-rose-400/80">Fails on Mobile</span>
                  </div>
                  <pre className="text-slate-300 overflow-x-auto whitespace-pre">
                    {defectShowcase[activeDefectTab].codeBefore}
                  </pre>
                </div>

                <div className="bg-[#050811] rounded-xl border border-emerald-500/30 p-4 font-mono text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold mb-2">
                    <span>VibeAuditor Live Remedy</span>
                    <span className="text-[10px] text-emerald-400/80">Injected & Verified</span>
                  </div>
                  <pre className="text-emerald-300 overflow-x-auto whitespace-pre">
                    {defectShowcase[activeDefectTab].codeAfter}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE 5-PILLAR ARCHITECTURE GRID */}
      <section id="pillars" className="max-w-7xl mx-auto px-4 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-4">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>200 CHECKS TAXONOMY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            The 5 Pillars of Interface Quality
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Every audit evaluates your site across 5 deterministic layers, combining network probes, geometry bounding calculations, and compositor frame analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-[#0b101c]/80 p-6 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-300 group shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-4 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold mb-1">
                Pillar 01
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Production Readiness</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Validates SSRF prevention, HTTPS enforcement, DNS latency, HTTP cache headers, and OpenGraph social metadata cards before shipping to users.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-xs font-mono text-slate-500">
              40 Checks • Automated Pre-flight
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-[#0b101c]/80 p-6 rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-300 group shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-4 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold mb-1">
                Pillar 02
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Mobile Ergonomics & UX</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Calculates physical touch target hitboxes, verifies iOS notch safe-area insets, eliminates 300ms tap lag, and stops mobile Safari zoom traps.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-xs font-mono text-slate-500">
              40 Checks • Multi-Touch Probes
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-[#0b101c]/80 p-6 rounded-2xl border border-white/[0.08] hover:border-violet-500/30 transition-all duration-300 group shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 mb-4 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="text-xs uppercase font-mono tracking-wider text-violet-400 font-semibold mb-1">
                Pillar 03
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">UI Geometry & Layout Stability</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Detects horizontal 100vw scrollbar leaks, flexbox icon collapsing, hover border jumps, and sub-pixel text clipping across responsive breakpoints.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-xs font-mono text-slate-500">
              40 Checks • Sub-Pixel Math
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-[#0b101c]/80 p-6 rounded-2xl border border-white/[0.08] hover:border-amber-500/30 transition-all duration-300 group shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-4 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all">
                <Activity className="w-5 h-5" />
              </div>
              <div className="text-xs uppercase font-mono tracking-wider text-amber-400 font-semibold mb-1">
                Pillar 04
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Interaction & State Resilience</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Identifies ghost click areas, unannounced icon buttons missing aria-labels, scroll-lock leakage behind modals, and z-index stacking collisions.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-xs font-mono text-slate-500">
              40 Checks • Interaction Edge Cases
            </div>
          </div>

          {/* Pillar 5 */}
          <div className="bg-[#0b101c]/80 p-6 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-300 group shadow-lg flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-4 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold mb-1">
                Pillar 05
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Visual Polish & Motion Health</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Measures compositor thread frame drops during scrolling, enforces GPU layer promotion, audits contrast ratios, and verifies focus ring visibility.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-xs font-mono text-slate-500">
              40 Checks • Compositor & WCAG
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS: 3-STEP PIPELINE */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 mb-4">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>AUTONOMOUS PIPELINE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            How Vibe Auditor Inspects & Remediates
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            From headless CDP browser capture to verified live patches, Vibe Auditor turns complex frontend defects into single-click resolutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-[#0b101c]/80 p-7 rounded-2xl border border-white/[0.08] relative">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
              01
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Headless CDP Telemetry</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Chromium instances launch with headless Chrome DevTools Protocol tracing, simulating 3 viewports (390px, 768px, 1440px) and recording frame drops during active scrolling.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#0b101c]/80 p-7 rounded-2xl border border-white/[0.08] relative">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
              02
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Deterministic 200 Suite</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Calculates sub-pixel bounding box math, checks font size thresholds, verifies focus indicators, and tests for layout hover shifts without relying on arbitrary LLM guesswork.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#0b101c]/80 p-7 rounded-2xl border border-white/[0.08] relative">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
              03
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Live Patch & Copilot Prompt</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Generates an isolated CSS patch verified in the live split sandbox, and outputs copy-paste fix instructions tailored for Cursor, Claude Code, and Antigravity.
            </p>
          </div>
        </div>
      </section>

      {/* 5. COMPARISON: TRADITIONAL LINTERS VS VIBE AUDITOR */}
      <section id="comparison" className="max-w-7xl mx-auto px-4 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-4">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>SIDE-BY-SIDE MATRIX</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Traditional Linters vs. Vibe Auditor
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            See why standard tools produce noisy false positives while missing real device-breaking traps.
          </p>
        </div>

        <div className="bg-[#0b101c]/90 rounded-2xl border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#070a13]">
                <th className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Evaluation Feature</th>
                <th className="py-4 px-6 font-semibold text-slate-400 uppercase tracking-wider text-xs">Standard HTML / SEO Linters</th>
                <th className="py-4 px-6 font-semibold text-emerald-400 uppercase tracking-wider text-xs bg-emerald-950/20">Vibe Auditor Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              <tr>
                <td className="py-4 px-6 font-semibold text-white">Inspection Medium</td>
                <td className="py-4 px-6 text-slate-400">Static raw HTML string parsing</td>
                <td className="py-4 px-6 text-emerald-300 font-medium bg-emerald-950/10">Real Chromium headless browser with CDP telemetry</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-white">Mobile iOS Auto-Zoom</td>
                <td className="py-4 px-6 text-slate-400">Ignored completely</td>
                <td className="py-4 px-6 text-emerald-300 font-medium bg-emerald-950/10">Detects &lt;16px input font size and provides safe scaling fix</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-white">300ms Touch Latency</td>
                <td className="py-4 px-6 text-slate-400">Not measured</td>
                <td className="py-4 px-6 text-emerald-300 font-medium bg-emerald-950/10">Audits touch-action rules on buttons and interactive containers</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-white">Touch Hitbox Analysis</td>
                <td className="py-4 px-6 text-slate-400">Blanket warnings on all desktop links</td>
                <td className="py-4 px-6 text-emerald-300 font-medium bg-emerald-950/10">Intelligent viewports: filters out desktop navbar links accurately</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-white">Live Remediation Sandbox</td>
                <td className="py-4 px-6 text-slate-400">None</td>
                <td className="py-4 px-6 text-emerald-300 font-medium bg-emerald-950/10">Synchronized split-view with live injected CSS patches</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-white">AI Fix Prompts for IDEs</td>
                <td className="py-4 px-6 text-slate-400">Generic documentation links</td>
                <td className="py-4 px-6 text-emerald-300 font-medium bg-emerald-950/10">Exact selectors, measured constraints, and prompts for Cursor/Claude</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. AI AGENTS & IDE INTEGRATION */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-[#0c1222] via-[#090e1a] to-[#060911] p-8 sm:p-12 rounded-3xl border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-4 font-mono">
                <Terminal className="w-3.5 h-3.5" />
                <span>NATIVE AGENT PROMPTING</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Tailored Prompts for Cursor, Claude Code & Antigravity
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
                Never waste time explaining CSS bugs to an AI copilot. Vibe Auditor generates prompts with exact DOM selectors, measured bounding telemetry, root causes, and verification tests.
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-mono">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Includes strict file-level constraints to prevent layout regressions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Supplies acceptance test verification scripts for automated validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exports verified CSS files ready for instant project inclusion</span>
                </div>
              </div>
            </div>

            {/* Prompt Codebox Mockup */}
            <div className="bg-[#04060c] rounded-2xl border border-white/[0.08] p-5 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08] text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
                  </div>
                  <span className="text-[11px] text-slate-400">CURSOR_FIX_PROMPT.md</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ready to Paste
                </span>
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto text-[11px]">
{`## FIX INSTRUCTION: [UX-IOS-AUTOZOOM]
Target Selector: input[type="text"].search-box
Measured Value: font-size: 14px on viewport 390px
Expected: font-size >= 16px to prevent iOS auto-zoom

### Guardrails:
1. Do not alter sibling margin or desktop typography.
2. Scope media query strictly to max-width: 768px.
3. Verify input placeholder vertical centering.`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="max-w-4xl mx-auto px-4 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Everything you need to know about autonomous UI/UX auditing and live remediation.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-[#0b101c]/80 rounded-2xl border border-white/[0.08] overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-white hover:text-emerald-400 transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-4" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/[0.04] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. PRE-FOOTER CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 p-8 sm:p-12 rounded-3xl text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
          
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            Audit Your Website in 90 Seconds
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Get instant browser measurements, failure simulation, and exact fix prompts for your AI-built web application.
          </p>

          <a
            href="#audit-console"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-bold rounded-xl text-sm transition shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98]"
          >
            Start Free Audit <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
