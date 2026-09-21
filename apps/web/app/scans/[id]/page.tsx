'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Layers,
  RefreshCw,
  Share2,
  ShieldAlert,
  Sliders,
  Terminal,
  Video,
  Monitor
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Issue {
  id: string;
  check_id: string;
  layer: string;
  severity: string;
  confidence: string;
  tier: string;
  title: string;
  problem: string;
  evidence: {
    measured_values: Record<string, any>;
    expected_values: Record<string, any>;
    viewport?: number;
  };
  location: {
    selector: string;
    bounding_box?: { x: number; y: number; width: number; height: number };
    source_file?: string;
  };
  fix_goal: string;
  constraints: string[];
  acceptance_check: string;
  fix_prompt?: string;
}

interface ScanReport {
  scan_id: string;
  target_url: string;
  normalized_domain: string;
  mode: string;
  status: string;
  overall_score: number;
  grade: string;
  layer_scores: Record<string, number>;
  coverage: {
    total_checks_in_catalog: number;
    checks_executed: number;
    passed_count: number;
    failed_count: number;
  };
  issues: Issue[];
  master_prompt: string;
  manual_checklist: Array<{
    id: string;
    title: string;
    layer: string;
    instructions: string;
    verification_script?: string;
  }>;
  artifacts: Array<{
    id: string;
    type: string;
    viewport?: number;
    url: string;
  }>;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params?.id as string;

  const [report, setReport] = useState<ScanReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedMaster, setCopiedMaster] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [rescanning, setRescanning] = useState(false);

  useEffect(() => {
    if (!scanId) return;
    const fetchReport = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/scans/${scanId}/report`);
        if (!res.ok) throw new Error('Report not found or scan is still in progress.');
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Error loading report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [scanId]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const copyMasterPrompt = () => {
    if (!report?.master_prompt) return;
    navigator.clipboard.writeText(report.master_prompt);
    setCopiedMaster(true);
    setTimeout(() => setCopiedMaster(false), 2000);
  };

  const handleRescan = async () => {
    setRescanning(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/scans/${scanId}/rescan`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        router.push(`/`);
      }
    } catch (e) {
      // ignore
    } finally {
      setRescanning(false);
    }
  };

  const handleShare = async () => {
    setShowShareModal(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/scans/${scanId}/share`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setShareToken(data.share_token);
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-24 bg-gray-800/60 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-800/40 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Scan Report Unavailable</h2>
        <p className="text-gray-400 mb-6">{error || 'Could not load report.'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400 transition"
        >
          Return to Auditor
        </button>
      </div>
    );
  }

  const filteredIssues = report.issues.filter((iss) => {
    if (selectedSeverity === 'ALL') return true;
    return iss.severity === selectedSeverity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white">{report.normalized_domain}</h1>
            <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300 font-mono">
              {report.mode.toUpperCase()} SCAN
            </span>
          </div>
          <a
            href={report.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-emerald-400 text-sm inline-flex items-center gap-1 mt-1 transition"
          >
            {report.target_url} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-xl text-sm font-medium text-gray-200 transition flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Share & Badge
          </button>
          <button
            onClick={handleRescan}
            disabled={rescanning}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-sm font-semibold transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${rescanning ? 'animate-spin' : ''}`} /> Rescan & Diff
          </button>
        </div>
      </div>

      {/* Score Overview Dial & 5 Layer Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 my-8">
        <div className="lg:col-span-1 bg-[#111827] p-6 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">Overall Audit Score</span>
          <div className="text-6xl font-black text-white tracking-tight my-2">
            {report.overall_score}
          </div>
          <span className={`px-4 py-1 rounded-full text-sm font-bold border ${
            report.grade.startsWith('A')
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : report.grade === 'B'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            Grade {report.grade}
          </span>
          <span className="text-xs text-gray-500 mt-4">
            Coverage: {report.coverage.checks_executed} of {report.coverage.total_checks_in_catalog} checks automated
          </span>
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(report.layer_scores).map(([layer, score]) => (
            <div key={layer} className="bg-[#111827] p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
              <span className="text-xs text-gray-400 font-medium">{layer}</span>
              <div className="text-2xl font-bold text-white my-2">{score}</div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    score >= 90 ? 'bg-emerald-400' : score >= 70 ? 'bg-blue-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master Fix Prompt Panel */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-emerald-500/30 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Master Remediation Prompt</h3>
              <p className="text-xs text-gray-400">Bundles all findings in priority order for Cursor, Claude Code, and Antigravity.</p>
            </div>
          </div>
          <button
            onClick={copyMasterPrompt}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            {copiedMaster ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedMaster ? 'Copied to Clipboard!' : 'Copy Master Fix Prompt'}
          </button>
        </div>
        <div className="bg-gray-950 p-4 rounded-xl font-mono text-xs text-gray-300 max-h-48 overflow-y-auto border border-gray-800 select-all whitespace-pre-wrap">
          {report.master_prompt}
        </div>
      </div>

      {/* Issues Section */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Actionable Findings ({report.issues.length})</h2>
            <p className="text-sm text-gray-400">Every issue is backed by browser measurements with ready-to-use AI prompts.</p>
          </div>

          <div className="flex items-center gap-2">
            {['ALL', 'CRITICAL', 'MAJOR', 'MINOR', 'SUGGESTION'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  selectedSeverity === sev
                    ? 'bg-gray-800 text-white border-gray-600'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-gray-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredIssues.length === 0 ? (
            <div className="bg-[#111827] p-8 rounded-xl border border-gray-800 text-center text-gray-400">
              No issues detected for severity filter &quot;{selectedSeverity}&quot;.
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} className="bg-[#111827] rounded-xl border border-gray-800 p-6 transition hover:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : issue.severity === 'MAJOR'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">[{issue.check_id}]</span>
                      <span className="text-xs text-gray-400">Layer: {issue.layer}</span>
                      <span className="text-xs text-gray-500">Tier {issue.tier}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{issue.title}</h3>
                    <p className="text-sm text-gray-300 mb-4">{issue.problem}</p>

                    {/* Measured Evidence Box */}
                    <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-800 text-xs font-mono space-y-1 mb-4">
                      <div className="text-emerald-400 font-semibold">Selector: {issue.location.selector}</div>
                      {Object.entries(issue.evidence.measured_values).map(([k, v]) => (
                        <div key={k} className="text-gray-400">
                          Measured {k}: <span className="text-white">{JSON.stringify(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fix prompt copy button */}
                  {issue.fix_prompt && (
                    <button
                      onClick={() => copyToClipboard(issue.fix_prompt!, issue.id)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0"
                    >
                      {copiedPromptId === issue.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copiedPromptId === issue.id ? 'Copied Prompt' : 'Copy Fix Prompt'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual Checklist Section */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800 mb-12">
        <h3 className="text-xl font-bold text-white mb-2">Guided Manual Checklist (Tier M)</h3>
        <p className="text-sm text-gray-400 mb-6">Interactive verification items requiring multi-tab or physical gestures.</p>
        <div className="space-y-4">
          {report.manual_checklist.map((item) => (
            <div key={item.id} className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-emerald-400">[{item.id}]</span>
                <span className="font-semibold text-white text-sm">{item.title}</span>
                <span className="text-xs text-gray-500">Layer: {item.layer}</span>
              </div>
              <p className="text-xs text-gray-300 mb-2">{item.instructions}</p>
              {item.verification_script && (
                <div className="bg-black/50 p-2.5 rounded font-mono text-[11px] text-gray-400 whitespace-pre-wrap">
                  {item.verification_script}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 p-6 rounded-2xl max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Share Report & README Badge</h3>
            <p className="text-xs text-gray-400 mb-4">Embed a live score badge in your GitHub repository README:</p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-300 mb-1">Markdown Badge</label>
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 font-mono text-xs text-gray-300 select-all">
                {`[![Vibe Audit](${API_BASE}/api/v1/badges/${report.normalized_domain}.svg)](${window.location.href})`}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2 bg-gray-800 text-white rounded-xl text-xs font-semibold hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
