'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Circle, Clock, ShieldCheck, Zap, Sparkles, Layers, Sliders, Cpu } from 'lucide-react';

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

    // Auto-prepend https:// if protocol was omitted (e.g. neurosense-orcin.vercel.app)
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.15)] mb-6 tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>DEEP INTERFACE INTELLIGENCE</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-5 leading-[1.15]">
          Auditing & Copy-Paste Fixes for{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            AI Sites
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
          Detect subtle invisible interface defects missed by developers & vibe coders. Get real browser measurements, failure simulation, and exact fix prompts tailored for Cursor, Claude Code, and Antigravity.
        </p>
      </div>

      {!scanning ? (
        <div className="space-y-12">
          {/* Main Input Form Card */}
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
                  <span className="font-medium text-slate-400">Quick Try:</span>
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
                    Quick (~90s)
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

          {/* Three Ultra-Premium Capability Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#0b101c]/70 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.07] hover:border-emerald-500/30 transition-all duration-300 group shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-4 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">Invisible Defects Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Catches iOS input auto-zoom traps, 300ms tap delays, crushed flex icons, and layout jitter overlooked by standard linters.
              </p>
            </div>

            <div className="bg-[#0b101c]/70 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.07] hover:border-cyan-500/30 transition-all duration-300 group shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-4 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">Live Split-Screen Sandbox</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect your live website side-by-side with verified remediations injected in real time before touching production code.
              </p>
            </div>

            <div className="bg-[#0b101c]/70 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.07] hover:border-violet-500/30 transition-all duration-300 group shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 mb-4 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">Copy-Paste AI Fix Prompts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pre-formatted instruction blocks with measured evidence and architectural guardrails for Cursor, Claude Code, and Antigravity.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Active Scanning State */
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

          {/* Granular Step List */}
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
    </div>
  );
}
