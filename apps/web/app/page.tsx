'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Circle, Clock, ShieldCheck, Zap } from 'lucide-react';

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
    if (!url) return;

    setErrorMsg('');
    setScanning(true);
    setProgressPct(5);
    setCurrentMessage('Initiating scan pre-flight checks...');

    try {
      const res = await fetch(`${API_BASE}/api/v1/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, mode }),
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
    <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
          <Zap className="w-3.5 h-3.5" /> For Vibe Coders & AI Builders
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Auditing & Copy-Paste Fixes for AI Sites
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Get real browser measurements, failure edge-case simulation, and exact fix prompts tailored for Cursor, Claude Code, and Antigravity.
        </p>
      </div>

      {!scanning ? (
        <form onSubmit={handleSubmit} className="bg-[#111827] p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="url-input" className="block text-sm font-medium text-gray-300 mb-2">
                Target Website URL
              </label>
              <input
                id="url-input"
                type="text"
                placeholder="https://your-app.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-base"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Scan Mode:</span>
                <button
                  type="button"
                  onClick={() => setMode('quick')}
                  className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold border transition flex items-center justify-center ${
                    mode === 'quick'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  Quick (~90s)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('deep')}
                  className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold border transition flex items-center justify-center ${
                    mode === 'deep'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  Deep (Full Matrix & Chaos)
                </button>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                Run Automated Audit <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm">
              {errorMsg}
            </div>
          )}
        </form>
      ) : (
        <div className="bg-[#111827] p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Running Audit</span>
              <h3 className="text-xl font-bold text-white truncate max-w-md">{url}</h3>
            </div>
            <span className="text-2xl font-black text-emerald-400">{progressPct}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="p-3.5 bg-gray-900 rounded-xl border border-gray-800 text-gray-300 text-sm mb-6 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{currentMessage || 'Running checks...'}</span>
          </div>

          {/* Granular Step List */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  step.completed
                    ? 'bg-emerald-950/10 border-emerald-500/30 text-emerald-300'
                    : step.active
                    ? 'bg-gray-900 border-gray-700 text-white shadow'
                    : 'bg-gray-900/40 border-gray-800/60 text-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : step.active ? (
                    <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-600 shrink-0" />
                  )}
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
                <span className="text-xs font-mono">
                  {step.completed ? 'Done' : step.active ? 'In-progress' : 'Queued'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
