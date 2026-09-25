'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Play,
  Pause,
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
  const [previewMode, setPreviewMode] = useState<'split' | 'before' | 'after'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [highlightsEnabled, setHighlightsEnabled] = useState(true);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Fetch report data and preserve scroll position across loading state switch
  useEffect(() => {
    if (!scanId) return;
    const fetchReport = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/scans/${scanId}/report`);
        if (!res.ok) throw new Error('Report not found or scan is still in progress.');
        const data = await res.json();
        
        // Preserve user scroll position so switching from skeleton to loaded state never jumps to top
        const savedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        setReport(data);
        setLoading(false);

        if (savedScrollY > 0) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: savedScrollY, behavior: 'instant' });
          });
        }
      } catch (err: any) {
        setError(err.message || 'Error loading report.');
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
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-28 bg-[#0b101c]/80 border border-white/[0.06] rounded-2xl"></div>
            ))}
          </div>
          <div className="h-96 bg-[#0b101c]/60 border border-white/[0.06] rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-5 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Scan Report Unavailable</h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error || 'Could not load report.'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold rounded-xl hover:brightness-110 transition shadow-[0_0_25px_rgba(16,185,129,0.3)] text-sm"
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
    <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-8 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
              {report.normalized_domain}
            </h1>
            <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded-full text-xs text-emerald-400 font-mono font-semibold shadow-sm">
              {report.mode.toUpperCase()} SCAN
            </span>
          </div>
          <a
            href={report.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-emerald-400 text-sm inline-flex items-center gap-1.5 mt-1.5 transition font-mono"
          >
            {report.target_url} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 border shadow-lg ${
              showLivePreview
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 border-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <Eye className="w-4 h-4" />
            {showLivePreview ? 'Live Preview Active' : 'Live Preview (Before vs After)'}
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-[#0b101c] hover:bg-[#121828] border border-white/[0.1] hover:border-white/[0.2] rounded-xl text-xs font-medium text-slate-200 transition flex items-center gap-2 shadow-sm"
          >
            <Share2 className="w-4 h-4 text-emerald-400" /> Share & Badge
          </button>
          <button
            onClick={handleRescan}
            disabled={rescanning}
            className="px-4 py-2 bg-[#0b101c] hover:bg-[#121828] border border-white/[0.1] hover:border-white/[0.2] text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${rescanning ? 'animate-spin' : ''}`} /> Rescan & Diff
          </button>
        </div>
      </div>

      {/* Live Interactive Project Preview: Before & After Fixes */}
      {showLivePreview && (
        <div
          id="preview-comparison-section"
          className={
            isFullScreen
              ? 'fixed inset-0 z-50 bg-[#05070d] p-4 sm:p-6 flex flex-col w-screen h-screen overflow-hidden'
              : 'bg-[#0b101c]/90 border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl rounded-2xl p-5 sm:p-6 my-8 relative'
          }
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.12)]">
                <Sparkles className="w-3.5 h-3.5" /> Interactive Sandbox & Live Changes
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isFullScreen ? 'Full Screen Comparison: Before & After' : 'Live Project Preview: Before & After Changes'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Interact live with your real website. See live changes applied directly to your interface in real time.
              </p>
            </div>

            {/* Viewport and View Mode Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-[#060911] p-1 rounded-xl border border-white/[0.08] flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    previewDevice === 'desktop' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    previewDevice === 'mobile' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile (390px)
                </button>
              </div>

              <div className="bg-[#060911] p-1 rounded-xl border border-white/[0.08] flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode('split')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    previewMode === 'split' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" /> Split Side-by-Side
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('before')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    previewMode === 'before' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Before
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('after')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    previewMode === 'after' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  After (Live Changes)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewKey((k) => k + 1)}
                className="p-2 bg-[#0b101c] hover:bg-[#151d32] border border-white/[0.08] text-slate-300 rounded-xl transition shadow-sm"
                title="Reload Sandbox"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Highlight Issues on Interface Toggle Button */}
              <button
                type="button"
                onClick={() => setHighlightsEnabled(!highlightsEnabled)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow ${
                  highlightsEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-[#0b101c] text-slate-400 hover:text-white border border-white/[0.08]'
                }`}
                title="Highlight fixed issues directly on the website interface"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>{highlightsEnabled ? 'Highlights: ON' : 'Highlights: OFF'}</span>
              </button>



              {/* Full Screen Comparison Toggle Button */}
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow ${
                  isFullScreen
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30'
                }`}
                title={isFullScreen ? 'Exit Full Screen (ESC)' : 'Open Full Screen Comparison View'}
              >
                {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullScreen ? 'Exit Full Screen' : 'Full Screen View'}</span>
              </button>
            </div>
          </div>

          {/* Live Preview Display (Split or Single) */}
          {previewMode === 'split' ? (
            <div className={`grid grid-cols-1 ${previewDevice === 'mobile' ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'lg:grid-cols-2'} gap-5 mt-4 flex-1`}>
              {/* Before Window */}
              <div className="bg-[#060912] rounded-2xl border border-rose-500/30 overflow-hidden shadow-2xl flex flex-col">
                <div className="bg-[#0b101c] px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block shadow-sm"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block shadow-sm"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block shadow-sm"></span>
                    </div>
                    <span className="font-bold text-rose-400 tracking-wide">BEFORE</span>
                    <span className="hidden sm:inline-block text-[10px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                      Original
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#060911] px-3 py-1 rounded-full border border-white/[0.06] text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    <span className="truncate">{report.normalized_domain}</span>
                  </div>
                </div>
                <div
                  className="relative bg-white flex-1 overflow-hidden"
                  style={{
                    height: isFullScreen
                      ? 'calc(100vh - 240px)'
                      : previewDevice === 'mobile'
                      ? '600px'
                      : '520px',
                  }}
                >
                  <iframe
                    key={`before-${previewKey}-${highlightsEnabled}`}
                    src={`${API_BASE}/api/v1/scans/${scanId}/preview?mode=original&url=${encodeURIComponent(report.target_url)}&highlight=${highlightsEnabled ? '1' : '0'}`}
                    title="Site Preview Before Fixes"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>

              {/* After Window */}
              <div className="bg-[#060912] rounded-2xl border border-emerald-500/40 overflow-hidden shadow-2xl flex flex-col shadow-[0_0_35px_rgba(16,185,129,0.15)]">
                <div className="bg-[#0b101c] px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block shadow-sm"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block shadow-sm"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block shadow-sm"></span>
                    </div>
                    <span className="font-bold text-emerald-400 tracking-wide">AFTER</span>
                    <span className="hidden sm:inline-block text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      Live Patched
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#060911] px-3 py-1 rounded-full border border-emerald-500/20 text-emerald-400 font-mono text-[11px] truncate max-w-[200px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    <span className="truncate">{report.normalized_domain} (Remediated)</span>
                  </div>
                </div>
                <div
                  className="relative bg-white flex-1 overflow-hidden"
                  style={{
                    height: isFullScreen
                      ? 'calc(100vh - 240px)'
                      : previewDevice === 'mobile'
                      ? '600px'
                      : '520px',
                  }}
                >
                  <iframe
                    key={`after-${previewKey}-${highlightsEnabled}`}
                    src={`${API_BASE}/api/v1/scans/${scanId}/preview?mode=patched&url=${encodeURIComponent(report.target_url)}&highlight=${highlightsEnabled ? '1' : '0'}`}
                    title="Site Preview After Fixes"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={`mt-4 flex-1 ${previewDevice === 'mobile' ? 'max-w-md mx-auto' : 'w-full'}`}>
              <div className={`bg-[#060912] rounded-2xl border ${
                previewMode === 'after' ? 'border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.15)]' : 'border-rose-500/30'
              } overflow-hidden shadow-2xl flex flex-col h-full`}>
                <div className="bg-[#0b101c] px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block shadow-sm"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block shadow-sm"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block shadow-sm"></span>
                    </div>
                    <span className={`font-bold tracking-wide ${previewMode === 'after' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {previewMode === 'after'
                        ? 'LIVE PATCHED PREVIEW (LIVE CHANGES APPLIED)'
                        : 'ORIGINAL SITE PREVIEW (BEFORE FIXES)'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#060911] px-3 py-1 rounded-full border border-white/[0.06] text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${previewMode === 'after' ? 'bg-emerald-400' : 'bg-slate-500'} shrink-0`}></span>
                    <span className="truncate">{report.normalized_domain}</span>
                  </div>
                </div>
                <div
                  className="relative bg-white flex-1 overflow-hidden"
                  style={{
                    height: isFullScreen
                      ? 'calc(100vh - 240px)'
                      : previewDevice === 'mobile'
                      ? '620px'
                      : '540px',
                  }}
                >
                  <iframe
                    key={`single-${previewMode}-${previewKey}-${highlightsEnabled}`}
                    src={`${API_BASE}/api/v1/scans/${scanId}/preview?mode=${previewMode === 'after' ? 'patched' : 'original'}&url=${encodeURIComponent(report.target_url)}&highlight=${highlightsEnabled ? '1' : '0'}`}
                    title="Site Preview Single View"
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
        <div className="lg:col-span-1 bg-[#0b101c]/90 p-7 rounded-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-semibold mb-1">Overall Audit Score</span>
          <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 font-mono tracking-tight my-2">
            {report.overall_score}
          </div>
          <span className={`px-4 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${
            report.grade.startsWith('A')
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
              : report.grade === 'B'
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_20px_rgba(0,229,255,0.2)]'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
          }`}>
            Grade {report.grade}
          </span>
          <div className="flex flex-col items-center mt-4 text-center">
            <span className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Coverage: {report.coverage.checks_executed} / {report.coverage.total_checks_in_catalog} checks (100%)
            </span>
            <button
              type="button"
              onClick={() => setShowCatalog(!showCatalog)}
              className="mt-3 text-xs px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 font-medium shadow-sm"
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
            <div className="lg:col-span-3 bg-[#0b101c]/90 p-6 sm:p-7 rounded-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none" />

              {/* Executive Diagnosis Header */}
              <div className="border-b border-white/[0.08] pb-5 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-3 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase ${
                      siteFeedback.statusTheme === 'emerald'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : siteFeedback.statusTheme === 'blue'
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                        : siteFeedback.statusTheme === 'amber'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                    }`}>
                      {siteFeedback.gradeBadge} Assessment
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {siteFeedback.verdictTitle}
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  {siteFeedback.verdictDescription}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#060911] p-3 rounded-xl border border-white/[0.06] flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold text-[10px] uppercase font-mono tracking-wider shrink-0 mt-0.5">Top Strength:</span>
                    <span className="text-slate-300 text-xs leading-snug">{siteFeedback.strength}</span>
                  </div>
                  <div className="bg-[#060911] p-3 rounded-xl border border-white/[0.06] flex items-start gap-2.5">
                    <span className="text-cyan-400 font-bold text-[10px] uppercase font-mono tracking-wider shrink-0 mt-0.5">Primary Fix:</span>
                    <span className="text-slate-300 text-xs leading-snug">{siteFeedback.primaryFix}</span>
                  </div>
                </div>
              </div>

              {/* Pillar-by-Pillar Diagnostic Feedback */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-3">
                  Pillar-by-Pillar Qualitative Feedback
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {siteFeedback.layers.map((layer) => (
                    <div
                      key={layer.name}
                      className="bg-[#060911]/90 p-3.5 rounded-xl border border-white/[0.06] hover:border-emerald-500/30 transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">{layer.name}</span>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${
                            layer.status === 'EXCELLENT'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : layer.status === 'GOOD'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                              : layer.status === 'NEEDS_WORK'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}>
                            {layer.score}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-snug mb-2.5">
                          {layer.summary}
                        </p>
                      </div>

                      <div className="mt-auto pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                          <span className="text-slate-500">{layer.statusLabel}</span>
                          <span className={layer.issueCount === 0 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-semibold'}>
                            {layer.issueCount === 0 ? '0 issues' : `${layer.issueCount} ${layer.issueCount === 1 ? 'issue' : 'issues'}`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#0b101c] rounded-full overflow-hidden border border-white/[0.04]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              layer.score >= 90 ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : layer.score >= 70 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gradient-to-r from-amber-400 to-rose-400'
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
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md'
                      : 'bg-[#060911] text-slate-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  <span>{tab === 'ALL' ? 'All 200 Checks' : tab}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                    catalogTab === tab ? 'bg-black/20 text-black' : 'bg-[#0b101c] text-slate-400'
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
                  className={`p-3.5 rounded-xl border text-xs transition flex flex-col justify-between ${
                    isFlagged
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                      : 'bg-[#060911]/80 border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                        {check.id}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 font-mono tracking-wider">
                        {check.layer} • Tier {check.tier}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        isFlagged
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isFlagged ? 'FLAGGED (ISSUE)' : 'PASSED'}
                    </span>
                  </div>
                  <div className="font-semibold text-white mb-1 tracking-tight">{check.title}</div>
                  <div className="text-slate-400 text-[11px] leading-relaxed">{check.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Master Fix Prompt Panel */}
      <div className="bg-[#0b101c]/95 p-6 sm:p-7 rounded-2xl border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Master Remediation Prompt</h3>
              <p className="text-xs text-slate-400">Bundles all findings in priority order for Cursor, Claude Code, and Antigravity.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPromptExpanded(!promptExpanded)}
              className="px-3 py-2 bg-[#060911] hover:bg-[#121828] border border-white/[0.08] text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              title={promptExpanded ? 'Collapse prompt height' : 'Expand full prompt'}
            >
              {promptExpanded ? <Minimize2 className="w-3.5 h-3.5 text-emerald-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{promptExpanded ? 'Collapse' : 'Expand Prompt'}</span>
            </button>
            <button
              onClick={copyMasterPrompt}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] tracking-wide"
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
            className={`bg-[#050811] p-4.5 rounded-xl font-mono text-xs text-slate-300 border border-white/[0.07] select-all whitespace-pre-wrap transition-all duration-300 focus:outline-none focus:border-emerald-500/50 shadow-inner ${
              promptExpanded
                ? 'max-h-[750px] overflow-y-auto'
                : 'max-h-56 overflow-y-auto overscroll-contain'
            }`}
            style={{ overscrollBehavior: 'auto' }}
          >
            {report.master_prompt}
          </div>

          {/* Quick jump & collapse bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/[0.06] text-xs">
            <span className="text-[11px] text-slate-400 font-mono">
              {report.master_prompt ? report.master_prompt.split('\n').length : 0} lines • {promptExpanded ? 'Full expanded view' : 'Preview view'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPromptExpanded(!promptExpanded)}
                className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition text-xs font-mono"
              >
                {promptExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {promptExpanded ? 'Collapse height' : 'Expand full prompt'}
              </button>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('findings-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-slate-400 hover:text-white inline-flex items-center gap-1 transition text-xs font-mono"
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
            <h2 className="text-2xl font-bold text-white tracking-tight">Actionable Findings ({report.issues.length})</h2>
            <p className="text-xs sm:text-sm text-slate-400">Every issue is backed by real browser measurements with ready-to-use AI prompts.</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#060911] rounded-xl border border-white/[0.08]">
            {['ALL', 'CRITICAL', 'MAJOR', 'MINOR', 'SUGGESTION'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition ${
                  selectedSeverity === sev
                    ? 'bg-white/[0.1] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredIssues.length === 0 ? (
            <div className="bg-[#0b101c]/90 p-8 rounded-2xl border border-white/[0.08] text-center text-slate-400">
              No issues detected for severity filter &quot;{selectedSeverity}&quot;.
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} className="bg-[#0b101c]/90 rounded-2xl border border-white/[0.08] p-6 sm:p-7 transition-all hover:border-white/[0.15] shadow-lg">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold font-mono ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                          : issue.severity === 'MAJOR'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">[{issue.check_id}]</span>
                      <span className="text-xs text-slate-400 font-mono">Layer: {issue.layer}</span>
                      <span className="text-xs text-slate-500 font-mono">Tier {issue.tier}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{issue.title}</h3>
                    <p className="text-sm text-slate-300 mb-4 leading-relaxed">{issue.problem}</p>

                    {/* Measured Evidence Box */}
                    <div className="bg-[#050811] p-3.5 rounded-xl border border-white/[0.07] text-xs font-mono space-y-1 mb-4 shadow-inner">
                      <div className="text-emerald-400 font-semibold">Selector: {issue.location.selector}</div>
                      {Object.entries(issue.evidence.measured_values).map(([k, v]) => (
                        <div key={k} className="text-slate-400">
                          Measured {k}: <span className="text-white font-medium">{JSON.stringify(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fix prompt copy button */}
                  {issue.fix_prompt && (
                    <button
                      onClick={() => copyToClipboard(issue.fix_prompt!, issue.id)}
                      className="px-4 py-2 bg-[#060911] hover:bg-[#121828] border border-white/[0.1] hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 shadow-sm"
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
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      {pResult ? (
                        pResult.applied ? (
                          <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4.5 space-y-3 shadow-[0_0_20px_rgba(16,185,129,0.12)]">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                                <span className="text-xs font-bold text-emerald-300 font-mono">
                                  Live Browser Patch Verified: +{pResult.delta_fps} FPS Improvement
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                <span className="bg-[#060911] px-2 py-0.5 rounded text-slate-400 border border-white/[0.06]">
                                  {pResult.before_metrics?.avg_fps} FPS → <strong className="text-emerald-400">{pResult.after_metrics?.avg_fps} FPS</strong>
                                </span>
                                <span className="bg-[#060911] px-2 py-0.5 rounded text-slate-400 border border-white/[0.06]">
                                  Drops: {pResult.before_metrics?.dropped_frames} → <strong className="text-emerald-400">{pResult.after_metrics?.dropped_frames}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-slate-300 leading-relaxed">
                              Injected isolated CSS patch into the scanner&apos;s browser session. Real scrolling probe confirms layout thrashing is eliminated and animations now execute on the GPU compositor thread.
                            </div>

                            {pResult.patch_css && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                  <span className="font-semibold flex items-center gap-1 text-slate-300 font-mono">
                                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                                    Verified CSS Patch (Zero Source Code Modified)
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => copyCssPatch(pResult.patch_css, issue.id)}
                                      className="text-xs px-2.5 py-1 rounded-md bg-[#060911] hover:bg-[#121828] border border-white/[0.08] text-slate-200 transition flex items-center gap-1 font-medium font-mono"
                                    >
                                      {copiedCssId === issue.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{copiedCssId === issue.id ? 'Copied' : 'Copy CSS'}</span>
                                    </button>
                                    <a
                                      href={`${API_BASE}/api/v1/scans/${scanId}/patches/${issue.id}/export`}
                                      download={`patch_${issue.id}.css`}
                                      className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition flex items-center gap-1 font-medium font-mono"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download .css</span>
                                    </a>
                                  </div>
                                </div>
                                <pre className="bg-[#030509] p-3.5 rounded-xl border border-emerald-500/25 font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner">
                                  {pResult.patch_css}
                                </pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-300 font-mono">Live Patch Refused / Skipped: </span>
                              <span className="text-slate-300">{pResult.reason_if_skipped}</span>
                              <p className="text-slate-400 text-[11px] mt-1">
                                This issue cannot be safely hot-patched via pure CSS injection without risking sibling element layout shifts or overriding JavaScript state. Use the AI Fix Prompt above in your IDE.
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Prove and measure performance improvement in live browser session:</span>
                          </div>
                          <button
                            type="button"
                            disabled={isPatching}
                            onClick={() => handlePreviewPatch(issue.id)}
                            className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
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
      <div className="bg-[#0b101c]/90 p-6 sm:p-7 rounded-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl mb-12">
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Guided Manual Checklist (Tier M)</h3>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">Interactive verification items requiring multi-tab or physical gestures.</p>
        <div className="space-y-3">
          {report.manual_checklist.map((item) => (
            <div key={item.id} className="p-4 bg-[#060911]/80 rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">[{item.id}]</span>
                <span className="font-semibold text-white text-sm">{item.title}</span>
                <span className="text-xs text-slate-500 font-mono">Layer: {item.layer}</span>
              </div>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">{item.instructions}</p>
              {item.verification_script && (
                <div className="bg-[#030509] p-3 rounded-lg font-mono text-[11px] text-slate-400 whitespace-pre-wrap border border-white/[0.04]">
                  {item.verification_script}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b101c] border border-white/[0.12] p-6 sm:p-7 rounded-2xl max-w-lg w-full shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Share Report & README Badge</h3>
            <p className="text-xs text-slate-400 mb-4">Embed a live score badge in your GitHub repository README:</p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">Markdown Badge</label>
              <div className="bg-[#050811] p-3 rounded-xl border border-white/[0.07] font-mono text-xs text-emerald-300 select-all shadow-inner">
                {`[![Vibe Audit](${API_BASE}/api/v1/badges/${report.normalized_domain}.svg)](${window.location.href})`}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-xs font-semibold transition"
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
