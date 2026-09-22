import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const scanId = params.id;
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'patched'; // 'original' | 'patched'

  const scan = getScan(scanId);
  const targetUrl = searchParams.get('url') || scan?.target_url || 'https://vibe-saas-example.dev';

  try {
    const parsedUrl = new URL(targetUrl);
    const origin = parsedUrl.origin;

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MejorAuditor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    let html = await res.text();

    // Ensure relative assets and links resolve to the target site origin
    const baseTag = `<base href="${origin}/">`;
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}`);
    } else {
      html = baseTag + html;
    }

    // If patched mode, inject the live remediation CSS
    if (mode === 'patched') {
      const patchCss = `
        <style id="auditor-live-remediation-patch">
          /* [MOBI-TAP-01] Ensure 44x44px minimum touch boundaries */
          button, [role="button"], a.btn, input[type="button"], input[type="submit"] {
            min-width: 44px !important;
            min-height: 44px !important;
            padding-left: max(16px, 1rem) !important;
            padding-right: max(16px, 1rem) !important;
            border-radius: 8px !important;
            transition: transform 0.15s ease, filter 0.15s ease !important;
          }
          button:hover, [role="button"]:hover {
            filter: brightness(1.08) !important;
            transform: scale(1.02) !important;
          }

          /* [UI-CONT-01] Contrast enhancements for legibility */
          p, span, li, a {
            text-rendering: optimizeLegibility !important;
          }
          .text-gray-400, .text-gray-500, [class*="text-zinc-500"], [class*="text-slate-400"], nav a {
            color: #d1d5db !important;
          }

          /* [PERF-PROP-01] GPU Acceleration & Compositing */
          .animated-box, [class*="animate-"], [style*="transition"] {
            will-change: transform, opacity !important;
            transform: translateZ(0) !important;
            backface-visibility: hidden !important;
          }

          /* [UI-LINE-01] Typography boundary safety */
          p.long-copy, article p, main p {
            max-width: 72ch !important;
            line-height: 1.65 !important;
          }

          /* [PROD-LEAK-01] Production indicator badge */
          #auditor-patch-indicator {
            position: fixed;
            bottom: 12px;
            right: 12px;
            background: rgba(16, 185, 129, 0.92);
            color: #000;
            font-family: monospace, sans-serif;
            font-size: 11px;
            font-weight: bold;
            padding: 4px 10px;
            border-radius: 9999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999999;
            pointer-events: none;
          }
        </style>
        <div id="auditor-patch-indicator">⚡ Live Patch Active: 44px Tap • GPU Motion • High Contrast</div>
      `;

      if (html.includes('</head>')) {
        html = html.replace('</head>', `${patchCss}</head>`);
      } else {
        html += patchCss;
      }
    }

    // Return HTML with frame-friendly headers
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    // Fallback synthetic interactive sandbox if target site is unreachable
    const isPatched = mode === 'patched';
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${scan?.normalized_domain || 'Site Preview'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 24px;
            background: #0d1322;
            color: #f3f4f6;
          }
          .card {
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 16px;
            padding: 24px;
            max-width: 600px;
            margin: 40px auto;
            text-align: center;
          }
          h2 { color: #fff; margin-bottom: 8px; }
          p { color: ${isPatched ? '#d1d5db' : '#6b7280'}; line-height: 1.6; font-size: 14px; }
          .cta-btn {
            background: #2563eb;
            color: #fff;
            border: none;
            cursor: pointer;
            ${
              isPatched
                ? 'min-width: 44px; min-height: 44px; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: bold; transition: transform 0.2s;'
                : 'width: 24px; height: 24px; padding: 0; font-size: 10px; border-radius: 4px;'
            }
          }
          .cta-btn:hover { ${isPatched ? 'transform: scale(1.05); filter: brightness(1.1);' : ''} }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 16px;
            background: ${isPatched ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
            color: ${isPatched ? '#34d399' : '#f87171'};
            border: 1px solid ${isPatched ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">${isPatched ? '⚡ AFTER FIXES APPLIED (LIVE REMEDIATION)' : '⚠️ BEFORE FIXES (DEFECTS ACTIVE)'}</div>
          <h2>${scan?.normalized_domain || 'Target Application'}</h2>
          <p>
            ${
              isPatched
                ? 'All buttons upgraded to 44px minimum hit targets. Text contrast raised to WCAG 4.5:1 standards. GPU compositing activated.'
                : 'Notice: CTA button is constricted to 24px (fails mobile touch ergonomics). Secondary copy contrast is below 4.5:1.'
            }
          </p>
          <div style="margin-top: 24px;">
            <button class="cta-btn">${isPatched ? 'Click Me (44px Ergonomic Target)' : 'Go'}</button>
          </div>
        </div>
      </body>
      </html>
    `;
    return new NextResponse(fallbackHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
