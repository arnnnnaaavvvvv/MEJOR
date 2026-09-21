import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vibe Auditor — Automated UI/UX & Performance Auditor',
  description: 'Measurement-backed UI/UX audit engine with copy-paste AI fix prompts for Cursor, Claude Code, and Antigravity.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-[#090d16] text-gray-100 antialiased selection:bg-emerald-500 selection:text-black">
        <header className="border-b border-gray-800 bg-[#0d1322]/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
                V
              </div>
              <span className="font-semibold text-lg tracking-tight text-white">Vibe<span className="text-emerald-400">Auditor</span></span>
            </a>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>v1.0 Production</span>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
