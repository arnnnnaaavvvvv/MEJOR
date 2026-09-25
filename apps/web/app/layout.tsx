import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ArrowUpRight, Github, Shield, Terminal, Zap } from 'lucide-react';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vibe Auditor — Autonomous UI/UX & Invisible Defect Auditor for AI Sites',
  description: 'Deep measurement-backed UI/UX audit engine detecting elusive interface defects with copy-paste AI fix prompts for Cursor, Claude Code, and Antigravity.',
  keywords: ['UI/UX auditor', 'vibe coding', 'frontend audit', 'invisible defects', 'Cursor prompts', 'Claude Code fixes', 'automated testing'],
  openGraph: {
    title: 'Vibe Auditor — Autonomous UI/UX & Invisible Defect Auditor',
    description: 'Catches iOS auto-zoom traps, 300ms tap delays, flexbox squishing, and layout thrashing missed by standard linters.',
    url: 'https://mejor-iota.vercel.app',
    siteName: 'Vibe Auditor',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#060911] text-slate-100 antialiased selection:bg-emerald-400 selection:text-slate-950 font-sans flex flex-col justify-between">
        {/* Top Iridescent Accent Border */}
        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 fixed top-0 left-0 right-0 z-[60]" />

        {/* Global Navigation Header */}
        <header className="border-b border-white/[0.08] bg-[#070b14]/85 backdrop-blur-xl sticky top-0 z-50 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400/20 via-teal-500/10 to-transparent border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-base shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] group-hover:border-emerald-400 transition-all duration-300">
                <span className="bg-gradient-to-br from-emerald-300 to-teal-400 bg-clip-text text-transparent">V</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  Vibe<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Auditor</span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-wider uppercase font-mono -mt-1 font-medium">Interface Intelligence</span>
              </div>
            </a>

            {/* Navigation Anchor Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
              <a href="#audit-console" className="hover:text-emerald-400 transition-colors">Audit Console</a>
              <a href="#cli" className="hover:text-emerald-400 transition-colors flex items-center gap-1 text-emerald-300">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">CLI</span>
                arnav-audit
              </a>
              <a href="#defects" className="hover:text-emerald-400 transition-colors">Invisible Defects</a>
              <a href="#pillars" className="hover:text-emerald-400 transition-colors">5 Pillars</a>
              <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
              <a href="#comparison" className="hover:text-emerald-400 transition-colors">Linter vs Vibe</a>
              <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.12)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[11px] tracking-wide">200 CHECKS ACTIVE</span>
              </div>

              <a
                href="#audit-console"
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-bold rounded-xl text-xs transition shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center gap-1.5"
              >
                <span>Launch Audit</span>
                <Zap className="w-3.5 h-3.5 fill-current" />
              </a>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1">{children}</main>

        {/* Global Premium Footer */}
        <footer className="border-t border-white/[0.08] bg-[#05070d] py-12 px-4 sm:px-6 relative z-10 mt-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-xs">
                  V
                </div>
                <span className="font-bold text-sm tracking-tight text-white">
                  Vibe<span className="text-emerald-400">Auditor</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm text-center md:text-left">
                The measurement-backed UI/UX audit engine detecting subtle invisible interface defects for AI builders.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <a href="#audit-console" className="hover:text-emerald-400 transition-colors">Scanner Console</a>
              <a href="#cli" className="hover:text-emerald-400 transition-colors">CLI (arnav-audit)</a>
              <a href="#defects" className="hover:text-emerald-400 transition-colors">Defect Taxonomy</a>
              <a href="#pillars" className="hover:text-emerald-400 transition-colors">Quality Pillars</a>
              <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
              <a
                href="https://github.com/arnnnnaaavvvvv/MEJOR"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Production: <strong className="text-slate-300">mejor-iota.vercel.app</strong></span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
