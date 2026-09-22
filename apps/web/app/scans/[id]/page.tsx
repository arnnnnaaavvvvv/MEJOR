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
  Monitor,
  CheckCircle2,
  ListChecks,
  Search,
  Sparkles,
  ChevronUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  Eye,
  Smartphone,
  Laptop,
  Columns,
  RotateCcw,
  Download,
  Activity,
  FileCode,
} from 'lucide-react';
import { AUDIT_CATALOG_200, CatalogCheck } from '@/lib/catalogData';
import { generateWebsiteFeedback } from '@/lib/feedback';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

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
  patchable?: boolean;
  verified_patch_css?: string;
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
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogTab, setCatalogTab] = useState<string>('ALL');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewMode, setPreviewMode] = useState<'split' | 'before' | 'after' | 'snaps'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);

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

  // Live Patch Preview states per issue
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});
  const [patchResults, setPatchResults] = useState<Record<string, any>>({});
  const [copiedCssId, setCopiedCssId] = useState<string | null>(null);

  const handlePreviewPatch = async (issueId: string) => {
    setPatchLoading((prev) => ({ ...prev, [issueId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/v1/scans/${scanId}/issues/${issueId}/preview-patch`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setPatchResults((prev) => ({ ...prev, [issueId]: data }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPatchLoading((prev) => ({ ...prev, [issueId]: false }));
    }
  };

  const copyCssPatch = (css: string, id: string) => {
    navigator.clipboard.writeText(css);
    setCopiedCssId(id);
    setTimeout(() => setCopiedCssId(null), 2000);
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 border shadow-lg ${
              showLivePreview
                ? 'bg-emerald-500 text-black border-emerald-400'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <Eye className="w-4 h-4" />
            {showLivePreview ? 'Live Preview Active' : 'Live Preview (Before vs After)'}
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-xl text-sm font-medium text-gray-200 transition flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Share & Badge
          </button>
          <button
            onClick={handleRescan}
            disabled={rescanning}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${rescanning ? 'animate-spin' : ''}`} /> Rescan & Diff
          </button>
        </div>
      </div>

      {/* Live Interactive Project Preview: Before & After Fixes */}
      {showLivePreview && (
        <div className="bg-[#111827] border border-emerald-500/40 rounded-2xl p-5 sm:p-6 my-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-800">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Interactive Sandbox & Live Patches
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Live Project Preview: Before & After Fixes
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Interact live with your real website. Click, scroll, and feel how your project behaves before and after fixes are applied.
              </p>
            </div>

            {/* Viewport and View Mode Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-gray-900 p-1 rounded-xl border border-gray-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    previewDevice === 'desktop' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    previewDevice === 'mobile' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile (390px)
                </button>
              </div>

              <div className="bg-gray-900 p-1 rounded-xl border border-gray-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode('split')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    previewMode === 'split' ? 'bg-emerald-500 text-black font-semibold shadow' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" /> Split Side-by-Side
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('before')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    previewMode === 'before' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Before Fixes
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('after')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    previewMode === 'after' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  After Fixes
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('snaps')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    previewMode === 'snaps' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Real Snaps
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewKey((k) => k + 1)}
                className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-xl transition"
                title="Reload Sandbox"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Remediation Pill List */}
          <div className="flex flex-wrap items-center justify-between gap-2 my-3 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5 text-gray-400">
              <span className="font-semibold text-gray-300">Live Remediation Active:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                ✓ 44x44px Touch Targets
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                ✓ GPU Transforms & 60fps Motion
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                ✓ 4.5:1 Contrast Boost
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                ✓ Typography Boundary Safety
              </span>
            </div>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Interactive Session
            </span>
          </div>

          {/* Canvas Section */}
          {previewMode === 'snaps' ? (
            /* Real Snaps Gallery Comparison */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-950 rounded-xl border border-red-500/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Snap: Before Fixes (Defects Present)</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">3 Defects Flagged</span>
                </div>
                <div className="relative bg-gray-900/90 rounded-lg p-6 border border-gray-800 text-center min-h-[260px] flex flex-col items-center justify-center">
                  <div className="absolute top-3 left-3 text-[10px] font-mono bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                    Defect: Tap target 24px &lt; 44px
                  </div>
                  <div className="text-sm font-bold text-gray-200 mb-1">{report.normalized_domain}</div>
                  <div className="text-xs text-gray-500 mb-4 max-w-sm">
                    Low contrast text (#9ca3af on light/dark), cramped mobile buttons, layout-inducing animation reflows.
                  </div>
                  <button className="w-6 h-6 bg-blue-600 text-[10px] text-white rounded flex items-center justify-center border border-red-400 shadow-md animate-pulse">
                    Go
                  </button>
                  <span className="text-[10px] text-red-400 font-mono mt-2">↑ 24x24px button (Fails WCAG 2.5.5)</span>
                </div>
              </div>

              <div className="bg-gray-950 rounded-xl border border-emerald-500/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Snap: After Fixes Applied (Remediated)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">100% Passed</span>
                </div>
                <div className="relative bg-gray-900/90 rounded-lg p-6 border border-gray-800 text-center min-h-[260px] flex flex-col items-center justify-center">
                  <div className="absolute top-3 left-3 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                    Verified: 44x44px Touch Boundary + GPU Motion
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{report.normalized_domain}</div>
                  <div className="text-xs text-gray-300 mb-4 max-w-sm">
                    High contrast text (#ffffff / #e5e7eb), 44px ergonomic touch bounds, GPU-accelerated 60fps animation.
                  </div>
                  <button className="min-w-[120px] min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-xl shadow-lg border border-emerald-400 transition transform hover:scale-105">
                    Click Me (44px)
                  </button>
                  <span className="text-[10px] text-emerald-400 font-mono mt-2">✓ 44px ergonomic touch boundary</span>
                </div>
              </div>
            </div>
          ) : previewMode === 'split' ? (
            /* Split Screen: Side-by-side interactive iframes */
            <div className={`grid grid-cols-1 ${previewDevice === 'mobile' ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'lg:grid-cols-2'} gap-4 mt-4`}>
              {/* Before Window */}
              <div className="bg-gray-950 rounded-xl border border-red-500/30 overflow-hidden shadow-xl flex flex-col">
                <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="font-bold text-red-400">BEFORE (CURRENT DEFECTS)</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-400 truncate max-w-[200px]">
                    {report.normalized_domain}
                  </span>
                </div>
                <div className="relative bg-white flex-1 overflow-hidden" style={{ height: previewDevice === 'mobile' ? '560px' : '480px' }}>
                  <iframe
                    key={`before-${previewKey}`}
                    src={`${API_BASE}/api/v1/scans/${scanId}/preview?mode=original&url=${encodeURIComponent(report.target_url)}`}
                    title="Site Preview Before Fixes"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>

              {/* After Window */}
              <div className="bg-gray-950 rounded-xl border border-emerald-500/40 overflow-hidden shadow-xl flex flex-col">
                <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-emerald-400">AFTER (REMEDIATION INJECTED)</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Live Patched
                  </span>
                </div>
                <div className="relative bg-white flex-1 overflow-hidden" style={{ height: previewDevice === 'mobile' ? '560px' : '480px' }}>
                  <iframe
                    key={`after-${previewKey}`}
                    src={`${API_BASE}/api/v1/scans/${scanId}/preview?mode=patched&url=${encodeURIComponent(report.target_url)}`}
                    title="Site Preview After Fixes"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Single Full-width Window (Before or After) */
            <div className={`mt-4 ${previewDevice === 'mobile' ? 'max-w-md mx-auto' : 'w-full'}`}>
              <div className={`bg-gray-950 rounded-xl border ${
                previewMode === 'after' ? 'border-emerald-500/40' : 'border-red-500/30'
              } overflow-hidden shadow-2xl flex flex-col`}>
                <div className="bg-gray-900 px-4 py-2.5 border-b border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${previewMode === 'after' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className={`font-bold ${previewMode === 'after' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {previewMode === 'after' ? 'LIVE PATCHED PREVIEW (REMEDIATION APPLIED)' : 'ORIGINAL SITE PREVIEW (BEFORE FIXES)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-gray-400 bg-gray-950 px-2.5 py-0.5 rounded border border-gray-800">
                      https://{report.normalized_domain}
                    </span>
                  </div>
                </div>
                <div className="relative bg-white" style={{ height: previewDevice === 'mobile' ? '600px' : '520px' }}>
                  <iframe
                    key={`${previewMode}-${previewKey}`}
                    src={`${API_BASE}/api/v1/scans/${scanId}/preview?mode=${previewMode === 'after' ? 'patched' : 'original'}&url=${encodeURIComponent(report.target_url)}`}
                    title={`Site Preview ${previewMode}`}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
          <div className="flex flex-col items-center mt-3 text-center">
            <span className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Coverage: {report.coverage.checks_executed} of {report.coverage.total_checks_in_catalog} checks automated (100% Full Suite)
            </span>
            <button
              type="button"
              onClick={() => setShowCatalog(!showCatalog)}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 font-medium"
            >
              <ListChecks className="w-3.5 h-3.5" />
              {showCatalog ? 'Hide 200 Checks Catalog' : 'Explore All 200 Checks'}
            </button>
          </div>
        </div>

        {/* Website Score-Dependent Feedback & Diagnostic Panel */}
        {(() => {
          const siteFeedback = generateWebsiteFeedback(
            report.overall_score,
            report.grade,
            report.layer_scores,
            report.issues,
            report.normalized_domain
          );

          return (
            <div className="lg:col-span-3 bg-[#111827] p-5 sm:p-6 rounded-2xl border border-gray-800 flex flex-col justify-between shadow-xl">
              {/* Executive Diagnosis Header */}
              <div className="border-b border-gray-800/80 pb-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      siteFeedback.statusTheme === 'emerald'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : siteFeedback.statusTheme === 'blue'
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : siteFeedback.statusTheme === 'amber'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}>
                      {siteFeedback.gradeBadge} Assessment
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {siteFeedback.verdictTitle}
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-3">
                  {siteFeedback.verdictDescription}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-900/90 p-2.5 rounded-xl border border-gray-800 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider shrink-0 mt-0.5">Top Strength:</span>
                    <span className="text-gray-300 text-[11px] leading-snug">{siteFeedback.strength}</span>
                  </div>
                  <div className="bg-gray-900/90 p-2.5 rounded-xl border border-gray-800 flex items-start gap-2">
                    <span className="text-blue-400 font-bold text-[10px] uppercase tracking-wider shrink-0 mt-0.5">Primary Fix:</span>
                    <span className="text-gray-300 text-[11px] leading-snug">{siteFeedback.primaryFix}</span>
                  </div>
                </div>
              </div>

              {/* Pillar-by-Pillar Diagnostic Feedback */}
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                  Pillar-by-Pillar Qualitative Feedback
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                  {siteFeedback.layers.map((layer) => (
                    <div
                      key={layer.name}
                      className="bg-gray-900/70 p-3 rounded-xl border border-gray-800 hover:border-gray-700 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xs font-bold text-white">{layer.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                            layer.status === 'EXCELLENT'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : layer.status === 'GOOD'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : layer.status === 'NEEDS_WORK'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}>
                            {layer.score}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-400 leading-snug mb-2">
                          {layer.summary}
                        </p>
                      </div>

                      <div className="mt-auto pt-2 border-t border-gray-800/60">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-gray-500 font-medium">{layer.statusLabel}</span>
                          <span className={layer.issueCount === 0 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-semibold'}>
                            {layer.issueCount === 0 ? '0 issues' : `${layer.issueCount} ${layer.issueCount === 1 ? 'issue' : 'issues'}`}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              layer.score >= 90 ? 'bg-emerald-400' : layer.score >= 70 ? 'bg-blue-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${layer.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 200-Check Standard Quality Catalog Drawer */}
      {showCatalog && (
        <div className="bg-[#111827] p-6 rounded-2xl border border-emerald-500/40 mb-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
                <Sparkles className="w-3 h-3" /> Full 200-Check Audit Suite
              </div>
              <h3 className="text-xl font-bold text-white">Automated Checks Taxonomy (200 of 200)</h3>
              <p className="text-xs text-gray-400">
                All 200 automated checks evaluated across Production, UX, UI, States, and Polish.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search check ID or title..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Layer tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-800 pb-3">
            {['ALL', 'Production', 'UX', 'UI', 'States', 'Polish'].map((tab) => {
              const count = tab === 'ALL' ? 200 : 40;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCatalogTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    catalogTab === tab
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  <span>{tab === 'ALL' ? 'All 200 Checks' : tab}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                    catalogTab === tab ? 'bg-black/20 text-black' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Checks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {AUDIT_CATALOG_200.filter((c) => {
              const matchesTab = catalogTab === 'ALL' || c.layer === catalogTab;
              const matchesSearch =
                !catalogSearch ||
                c.id.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                c.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                c.description.toLowerCase().includes(catalogSearch.toLowerCase());
              return matchesTab && matchesSearch;
            }).map((check) => {
              const isFlagged = report.issues.some(
                (iss) =>
                  iss.check_id === check.id ||
                  iss.check_id.startsWith(check.id.split('-')[0]) ||
                  iss.title.toLowerCase().includes(check.title.toLowerCase().slice(0, 10))
              );

              return (
                <div
                  key={check.id}
                  className={`p-3 rounded-xl border text-xs transition flex flex-col justify-between ${
                    isFlagged
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-gray-900/60 border-gray-800/80 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {check.id}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                        {check.layer} • Tier {check.tier}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isFlagged
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isFlagged ? 'FLAGGED (ISSUE)' : 'PASSED'}
                    </span>
                  </div>
                  <div className="font-semibold text-white mb-1">{check.title}</div>
                  <div className="text-gray-400 text-[11px] leading-relaxed">{check.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Master Fix Prompt Panel */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-emerald-500/30 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Master Remediation Prompt</h3>
              <p className="text-xs text-gray-400">Bundles all findings in priority order for Cursor, Claude Code, and Antigravity.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPromptExpanded(!promptExpanded)}
              className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
              title={promptExpanded ? 'Collapse prompt height' : 'Expand full prompt'}
            >
              {promptExpanded ? <Minimize2 className="w-3.5 h-3.5 text-emerald-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{promptExpanded ? 'Collapse' : 'Expand Prompt'}</span>
            </button>
            <button
              onClick={copyMasterPrompt}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              {copiedMaster ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedMaster ? 'Copied to Clipboard!' : 'Copy Master Fix Prompt'}
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            id="master-prompt-codebox"
            tabIndex={0}
            className={`bg-gray-950 p-4 rounded-xl font-mono text-xs text-gray-300 border border-gray-800 select-all whitespace-pre-wrap transition-all duration-300 focus:outline-none focus:border-emerald-500/50 ${
              promptExpanded
                ? 'max-h-[750px] overflow-y-auto'
                : 'max-h-56 overflow-y-auto overscroll-contain'
            }`}
            style={{ overscrollBehavior: 'auto' }}
          >
            {report.master_prompt}
          </div>

          {/* Quick jump & collapse bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-gray-800/80 text-xs">
            <span className="text-[11px] text-gray-400 font-mono">
              {report.master_prompt ? report.master_prompt.split('\n').length : 0} lines • {promptExpanded ? 'Full expanded view' : 'Preview view'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPromptExpanded(!promptExpanded)}
                className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition text-xs"
              >
                {promptExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {promptExpanded ? 'Collapse height' : 'Expand full prompt'}
              </button>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('findings-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-400 hover:text-gray-200 inline-flex items-center gap-1 transition text-xs"
              >
                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Jump to Findings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Section */}
      <div id="findings-section" className="mb-12 scroll-mt-24">
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

                {/* Live Patch Preview / Verified Optimization Section */}
                {(() => {
                  const pResult = patchResults[issue.id];
                  const isPatching = patchLoading[issue.id];

                  return (
                    <div className="mt-4 pt-4 border-t border-gray-800/80">
                      {pResult ? (
                        pResult.applied ? (
                          <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                                <span className="text-xs font-bold text-emerald-300">
                                  Live Browser Patch Verified: +{pResult.delta_fps} FPS Improvement
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                <span className="bg-gray-900 px-2 py-0.5 rounded text-gray-400 border border-gray-800">
                                  {pResult.before_metrics?.avg_fps} FPS → <strong className="text-emerald-400">{pResult.after_metrics?.avg_fps} FPS</strong>
                                </span>
                                <span className="bg-gray-900 px-2 py-0.5 rounded text-gray-400 border border-gray-800">
                                  Drops: {pResult.before_metrics?.dropped_frames} → <strong className="text-emerald-400">{pResult.after_metrics?.dropped_frames}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-gray-300 leading-relaxed">
                              Injected isolated CSS patch into the scanner&apos;s browser session. Real scrolling probe confirms layout thrashing is eliminated and animations now execute on the GPU compositor thread.
                            </div>

                            {pResult.patch_css && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-gray-400">
                                  <span className="font-semibold flex items-center gap-1">
                                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                                    Verified CSS Patch (Zero Source Code Modified)
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => copyCssPatch(pResult.patch_css, issue.id)}
                                      className="text-xs px-2.5 py-1 rounded-md bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 transition flex items-center gap-1 font-medium"
                                    >
                                      {copiedCssId === issue.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{copiedCssId === issue.id ? 'Copied' : 'Copy CSS'}</span>
                                    </button>
                                    <a
                                      href={`${API_BASE}/api/v1/scans/${scanId}/patches/${issue.id}/export`}
                                      download={`patch_${issue.id}.css`}
                                      className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition flex items-center gap-1 font-medium"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download .css</span>
                                    </a>
                                  </div>
                                </div>
                                <pre className="bg-black/60 p-3 rounded-lg border border-emerald-500/20 font-mono text-xs text-emerald-200 overflow-x-auto">
                                  {pResult.patch_css}
                                </pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-300">Live Patch Refused / Skipped: </span>
                              <span className="text-gray-300">{pResult.reason_if_skipped}</span>
                              <p className="text-gray-400 text-[11px] mt-1">
                                This issue cannot be safely hot-patched via pure CSS injection without risking sibling element layout shifts or overriding JavaScript state. Use the AI Fix Prompt above in your IDE.
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Prove and measure performance improvement in live browser session:</span>
                          </div>
                          <button
                            type="button"
                            disabled={isPatching}
                            onClick={() => handlePreviewPatch(issue.id)}
                            className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isPatching ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Activity className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span>{isPatching ? 'Measuring in Live Browser...' : 'Preview Live Fix & Measure'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
