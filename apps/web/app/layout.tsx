import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

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
  title: 'Vibe Auditor — Automated UI/UX & Invisible Defect Auditor',
  description: 'Deep measurement-backed UI/UX audit engine detecting elusive interface defects with copy-paste AI fix prompts for Cursor, Claude Code, and Antigravity.',
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
      <body className="min-h-screen bg-[#060911] text-slate-100 antialiased selection:bg-emerald-400 selection:text-slate-950 font-sans">
        {/* Top Iridescent Accent Border */}
        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 fixed top-0 left-0 right-0 z-[60]" />

        <header className="border-b border-white/[0.08] bg-[#070b14]/80 backdrop-blur-xl sticky top-0 z-50 transition-all">
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

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.12)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[11px] tracking-wide">SYSTEM READY • 200 CHECKS</span>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
