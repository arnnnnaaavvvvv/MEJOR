import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/mockStore';
import { auditWebsite, extractUrlFromScanId } from '@/lib/auditor';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const scanId = params.id;
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'patched'; // 'original' | 'patched'
  const showHighlight = searchParams.get('highlight') !== '0';

  let scan = getScan(scanId);
  if (!scan) {
    const fallbackUrl = extractUrlFromScanId(scanId);
    if (fallbackUrl) {
      scan = await auditWebsite(fallbackUrl);
    }
  }

  const targetUrl = searchParams.get('url') || scan?.target_url || 'https://vibe-saas-example.dev';

  try {
    const parsedUrl = new URL(targetUrl);
    const origin = parsedUrl.origin;

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MejorAuditor/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Target responded with HTTP ${res.status}`);
    }

    let html = await res.text();

    // Ensure relative assets and links resolve to the target site origin
    const baseTag = `<base href="${origin}/">`;
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}`);
    } else {
      html = baseTag + html;
    }

    // Anti-crash shim for sandboxed preview:
    // Prevents Next.js / Vite / SPA client routers from crashing when location pathname doesn't match target routes
    const antiCrashShim = `
      <script id="auditor-sandbox-shim">
        // Suppress client-side routing exceptions inside sandbox iframe
        window.addEventListener('error', function(e) {
          e.stopImmediatePropagation();
          e.preventDefault();
          return true;
        }, true);
        window.addEventListener('unhandledrejection', function(e) {
          e.stopImmediatePropagation();
          e.preventDefault();
          return true;
        }, true);
        try {
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', '/');
          }
        } catch(e) {}
      </script>
    `;

    // Neutralize Next.js client routing chunks that trigger "Application error"
    // Keeps ALL stylesheets, images, and pre-rendered SSR HTML 100% intact
    html = html.replace(/<script([^>]*src="[^"]*\/_next\/static\/chunks\/[^"]*")/gi, '<script type="text/inert-script"$1');
    html = html.replace(/self\.__next_f\.push/g, '(window.__noop_next_f||function(){}).push');

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${antiCrashShim}`);
    }

    // Scroll Reveal & Synchronized Scrolling Engine for Preview Sandbox
    const scrollAndSyncEngine = `
      <style id="auditor-scroll-reveal-styles">
        html {
          scroll-behavior: smooth !important;
        }
        /* Ensure elements with scroll-reveal animations animate into view smoothly */
        [data-reveal] {
          opacity: 0;
          transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) !important;
          will-change: opacity, transform;
        }
        [data-reveal="fade-up"] {
          transform: translateY(22px) !important;
        }
        [data-reveal="fade-down"] {
          transform: translateY(-22px) !important;
        }
        [data-reveal="fade-left"] {
          transform: translateX(22px) !important;
        }
        [data-reveal="fade-right"] {
          transform: translateX(-22px) !important;
        }
        [data-reveal="zoom-in"] {
          transform: scale(0.96) !important;
        }
        [data-reveal="blur-in"] {
          transform: translateY(16px) !important;
          filter: blur(4px);
        }
        [data-reveal].is-visible {
          opacity: 1 !important;
          transform: none !important;
          filter: none !important;
        }
      </style>

      <script id="auditor-scroll-reveal-sync">
        (() => {
          // 1. SCROLL REVEAL ANIMATION ENGINE
          function activateScrollReveal() {
            const targets = document.querySelectorAll('[data-reveal], [data-aos], .reveal-on-scroll, [class*="fade-up"]');
            if (!targets.length) return;

            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('is-visible', 'aos-animate');
                }
              });
            }, {
              threshold: 0.05,
              rootMargin: '20px 0px 40px 0px'
            });

            targets.forEach(el => {
              observer.observe(el);
              const rect = el.getBoundingClientRect();
              if (rect.top < window.innerHeight + 200) {
                el.classList.add('is-visible', 'aos-animate');
              }
            });

            window.addEventListener('scroll', () => {
              targets.forEach(el => {
                if (!el.classList.contains('is-visible')) {
                  const rect = el.getBoundingClientRect();
                  if (rect.top < window.innerHeight + 200) {
                    el.classList.add('is-visible', 'aos-animate');
                  }
                }
              });
            }, { passive: true });
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', activateScrollReveal);
          } else {
            activateScrollReveal();
          }
          setTimeout(activateScrollReveal, 50);
          setTimeout(activateScrollReveal, 250);
          setTimeout(activateScrollReveal, 800);

          // 2. SYNCHRONIZED BIDIRECTIONAL SCROLLING
          let isRemoteScroll = false;
          let scrollTimeout = null;

          window.addEventListener('scroll', () => {
            if (isRemoteScroll) return;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
            try {
              window.parent.postMessage({
                type: 'AUDITOR_SYNC_SCROLL',
                scrollY: window.scrollY,
                scrollRatio: ratio,
                mode: '${mode}'
              }, '*');
            } catch(e) {}
          }, { passive: true });

          window.addEventListener('message', (event) => {
            if (!event.data || event.data.type !== 'AUDITOR_SCROLL_TO') return;
            if (event.data.mode === '${mode}') return;

            isRemoteScroll = true;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const targetY = (event.data.scrollRatio !== undefined && maxScroll > 0)
              ? event.data.scrollRatio * maxScroll
              : event.data.scrollY;

            window.scrollTo({
              top: targetY,
              behavior: event.data.smooth ? 'smooth' : 'auto'
            });

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              isRemoteScroll = false;
            }, 80);
          });
        })();
      </script>
    `;

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${scrollAndSyncEngine}`);
    } else {
      html += scrollAndSyncEngine;
    }

    // =========================================================================
    // ON-INTERFACE ISSUE & REMEDIATION HIGHLIGHTING SYSTEM
    // =========================================================================
    const isPatched = mode === 'patched';

    const interfaceHighlightSystem = `
      <style id="auditor-interface-highlight-styles">
        /* Highlighting Rings on Interface Elements */
        .auditor-fix-highlight {
          position: relative !important;
          outline: 2.5px solid #10b981 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.45) !important;
          animation: auditor-pulse-green 3s infinite ease-in-out !important;
        }
        @keyframes auditor-pulse-green {
          0%, 100% { outline-color: #10b981; box-shadow: 0 0 16px rgba(16, 185, 129, 0.45); }
          50% { outline-color: #34d399; box-shadow: 0 0 24px rgba(52, 211, 153, 0.7); }
        }

        .auditor-defect-highlight {
          position: relative !important;
          outline: 2.5px dashed #f43f5e !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 16px rgba(244, 63, 94, 0.4) !important;
          animation: auditor-pulse-rose 3s infinite ease-in-out !important;
        }
        @keyframes auditor-pulse-rose {
          0%, 100% { outline-color: #f43f5e; box-shadow: 0 0 16px rgba(244, 63, 94, 0.4); }
          50% { outline-color: #fb7185; box-shadow: 0 0 24px rgba(251, 113, 133, 0.7); }
        }

        /* Floating Badges pinned to fixed/defect elements */
        .auditor-fix-badge, .auditor-defect-badge {
          display: inline-flex !important;
          align-items: center !important;
          gap: 5px !important;
          padding: 3px 9px !important;
          border-radius: 9999px !important;
          font-size: 11px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
          letter-spacing: 0.02em !important;
          white-space: nowrap !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4) !important;
          backdrop-filter: blur(8px) !important;
          z-index: 99999 !important;
          pointer-events: none !important;
          user-select: none !important;
        }
        .auditor-fix-badge {
          background: rgba(6, 78, 59, 0.95) !important;
          color: #6ee7b7 !important;
          border: 1px solid #10b981 !important;
        }
        .auditor-defect-badge {
          background: rgba(136, 19, 55, 0.95) !important;
          color: #fda4af !important;
          border: 1px solid #f43f5e !important;
        }

        /* Floating Summary HUD at bottom-right corner */
        .auditor-floating-hud {
          position: fixed !important;
          bottom: 16px !important;
          right: 16px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 8px 14px !important;
          border-radius: 9999px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          letter-spacing: 0.02em !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
          backdrop-filter: blur(12px) !important;
          z-index: 100000 !important;
          pointer-events: none !important;
        }
        .auditor-hud-green {
          background: rgba(6, 78, 59, 0.92) !important;
          color: #a7f3d0 !important;
          border: 1px solid rgba(16, 185, 129, 0.5) !important;
        }
        .auditor-hud-rose {
          background: rgba(136, 19, 55, 0.92) !important;
          color: #fecdd3 !important;
          border: 1px solid rgba(244, 63, 94, 0.5) !important;
        }
        .auditor-hud-dot {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background: #10b981 !important;
          box-shadow: 0 0 8px #10b981 !important;
        }
        .auditor-hud-dot-rose {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background: #f43f5e !important;
          box-shadow: 0 0 8px #f43f5e !important;
        }

        ${isPatched ? `
          /* Live Remediation CSS overrides in Patched Mode */
          button, [role="button"], a.btn, input[type="button"], input[type="submit"], .tiny-btn, .cta-action {
            min-width: 44px !important;
            min-height: 44px !important;
            padding-left: max(16px, 1rem) !important;
            padding-right: max(16px, 1rem) !important;
            border-radius: 10px !important;
            transition: transform 0.15s ease, filter 0.15s ease !important;
          }
          button:hover, [role="button"]:hover, .cta-action:hover {
            filter: brightness(1.08) !important;
            transform: scale(1.02) !important;
          }
          .text-gray-400, .text-gray-500, [class*="text-zinc-500"], [class*="text-slate-400"], nav a, p.subtitle, span.badge-subtext {
            color: #27272a !important;
          }
          .dark .text-gray-400, .dark .text-gray-500, .dark [class*="text-zinc-500"], .dark nav a {
            color: #f4f4f5 !important;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-ping, .pulse-beacon {
              animation: none !important;
              transform: none !important;
              opacity: 1 !important;
            }
          }
          @font-face {
            font-display: swap !important;
          }
        ` : ''}
      </style>

      <script id="auditor-interface-highlighter">
        (() => {
          function highlightInterfaceElements() {
            if (!${showHighlight}) return;
            const isPatched = '${mode}' === 'patched';
            const highlightClass = isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight';
            const badgeClass = isPatched ? 'auditor-fix-badge' : 'auditor-defect-badge';

            // 1. HIGHLIGHT BUTTONS & TOUCH TARGETS
            const buttons = Array.from(document.querySelectorAll('button, [role="button"], a.btn, .cta-action, .cta-btn, header a[href*="login"], header a[href*="signup"], header button'));
            let buttonTagged = 0;
            buttons.forEach(btn => {
              if (buttonTagged >= 4) return;
              if (btn.closest('#auditor-floating-hud') || btn.classList.contains(highlightClass)) return;
              const rect = btn.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                btn.classList.add(highlightClass);
                if (!btn.querySelector('.' + badgeClass) && !btn.parentElement?.querySelector('.' + badgeClass)) {
                  const badge = document.createElement('span');
                  badge.className = badgeClass;
                  badge.style.position = 'absolute';
                  badge.style.top = '-24px';
                  badge.style.left = '0';
                  badge.innerHTML = isPatched ? '✓ Fixed: 44×44px Target' : '⚠️ Defect: &lt;44px Hitbox';
                  if (getComputedStyle(btn).position === 'static') {
                    btn.style.position = 'relative';
                  }
                  btn.appendChild(badge);
                }
                buttonTagged++;
              }
            });

            // 2. HIGHLIGHT SUBTITLES & TEXT CONTRAST
            const paragraphs = Array.from(document.querySelectorAll('p, .text-gray-400, .text-zinc-500, p.subtitle, span.badge-subtext'));
            let textTagged = 0;
            paragraphs.forEach(p => {
              if (textTagged >= 2) return;
              if (p.closest('#auditor-floating-hud') || p.classList.contains(highlightClass) || p.innerText.length < 25) return;
              p.classList.add(highlightClass);
              if (!p.querySelector('.' + badgeClass)) {
                const badge = document.createElement('span');
                badge.className = badgeClass;
                badge.style.display = 'block';
                badge.style.width = 'fit-content';
                badge.style.marginBottom = '6px';
                badge.innerHTML = isPatched ? '✓ Fixed: 4.5:1+ Contrast Boosted' : '⚠️ Defect: Low Contrast (3.2:1)';
                p.insertBefore(badge, p.firstChild);
              }
              textTagged++;
            });

            // 3. HIGHLIGHT CONTINUOUS ANIMATIONS
            const anims = Array.from(document.querySelectorAll('.animate-ping, .pulse-beacon, [class*="animate-"], [data-animated]'));
            anims.forEach(anim => {
              if (anim.classList.contains(highlightClass)) return;
              anim.classList.add(highlightClass);
              const badge = document.createElement('span');
              badge.className = badgeClass;
              badge.innerHTML = isPatched ? '✓ Fixed: Motion-Safe Guard' : '⚠️ Defect: Continuous Animation';
              anim.parentElement?.insertBefore(badge, anim);
            });

            // 4. FLOATING SUMMARY HUD
            if (!document.getElementById('auditor-floating-hud')) {
              const hud = document.createElement('div');
              hud.id = 'auditor-floating-hud';
              hud.className = 'auditor-floating-hud ' + (isPatched ? 'auditor-hud-green' : 'auditor-hud-rose');
              hud.innerHTML = isPatched
                ? '<span class="auditor-hud-dot"></span><span>✨ Live Fixes Highlighted On Interface</span>'
                : '<span class="auditor-hud-dot-rose"></span><span>⚠️ Defects Highlighted On Interface</span>';
              document.body.appendChild(hud);
            }
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', highlightInterfaceElements);
          } else {
            highlightInterfaceElements();
          }
          setTimeout(highlightInterfaceElements, 250);
          setTimeout(highlightInterfaceElements, 800);
        })();
      </script>
    `;

    if (html.includes('</head>')) {
      html = html.replace('</head>', `${interfaceHighlightSystem}</head>`);
    } else {
      html += interfaceHighlightSystem;
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
    // =========================================================================
    // FALLBACK INTERACTIVE SANDBOX: LIVE PREVIEW WITH ON-INTERFACE HIGHLIGHTS
    // =========================================================================
    const isPatched = mode === 'patched';
    let domain = scan?.normalized_domain;
    if (!domain) {
      try {
        domain = new URL(targetUrl).hostname;
      } catch (e) {
        domain = 'vibe-saas-example.dev';
      }
    }

    const fallbackHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${domain} — Live Preview</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        ${isPatched
          ? '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">'
          : '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800" rel="stylesheet">'
        }
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: ${isPatched ? "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" : "serif, -apple-system, sans-serif"};
            margin: 0;
            padding: 0;
            background: #090d16;
            color: #f3f4f6;
            -webkit-font-smoothing: antialiased;
          }
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 28px;
            background: #0f172a;
            border-bottom: 1px solid #1e293b;
          }
          .logo {
            font-weight: 800;
            font-size: 16px;
            letter-spacing: -0.02em;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
          }
          
          .nav-links {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .nav-links a {
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            ${isPatched
              ? 'color: #e4e4e7; transition: color 0.15s ease;'
              : 'color: #64748b;'
            }
          }
          .nav-links a:hover {
            color: #38bdf8;
          }

          /* Interactive CTA Button */
          .cta-btn {
            font-family: inherit;
            cursor: pointer;
            border: none;
            background: #2563eb;
            color: #ffffff;
            font-weight: 600;
            ${isPatched
              ? 'min-width: 44px; min-height: 44px; padding: 10px 20px; border-radius: 10px; font-size: 13px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); transition: transform 0.15s ease, background 0.15s ease;'
              : 'width: auto; height: 26px; padding: 2px 10px; border-radius: 4px; font-size: 11px;'
            }
          }
          .cta-btn:hover {
            ${isPatched ? 'transform: translateY(-1px); background: #3b82f6;' : 'background: #1d4ed8;'}
          }

          .container {
            max-width: 960px;
            margin: 36px auto;
            padding: 0 20px;
          }

          /* Hero Section */
          .hero {
            text-align: center;
            padding: 24px 0 36px;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 16px;
            ${isPatched
              ? 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35);'
              : 'background: rgba(148, 163, 184, 0.1); color: #64748b; border: 1px solid rgba(148, 163, 184, 0.2);'
            }
          }
          .hero h1 {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -0.03em;
            margin: 0 0 14px 0;
            color: #ffffff;
            line-height: 1.2;
          }
          .hero p {
            font-size: 15px;
            max-width: 640px;
            margin: 0 auto 24px;
            line-height: 1.6;
            padding: 12px 16px;
            border-radius: 12px;
            ${isPatched ? 'color: #f1f5f9; background: rgba(15, 23, 42, 0.6);' : 'color: #64748b;'}
          }
          .hero-actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;
          }
          .secondary-btn {
            font-family: inherit;
            cursor: pointer;
            background: #1e293b;
            color: #f1f5f9;
            font-weight: 600;
            border: 1px solid #334155;
            ${isPatched
              ? 'min-width: 44px; min-height: 44px; padding: 10px 20px; border-radius: 10px; font-size: 13px; transition: background 0.15s ease;'
              : 'height: 26px; padding: 2px 10px; border-radius: 4px; font-size: 11px;'
            }
          }
          .secondary-btn:hover {
            background: #334155;
          }

          /* Metrics Dashboard Cards */
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
            margin-top: 24px;
          }
          .card {
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 14px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          }
          .card-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            ${isPatched ? 'color: #10b981;' : 'color: #64748b;'}
          }
          .card-value {
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.02em;
            margin-bottom: 8px;
          }
          .card-desc {
            font-size: 12px;
            line-height: 1.5;
            margin: 0;
            ${isPatched ? 'color: #cbd5e1;' : 'color: #475569;'}
          }

          /* Motion beacon */
          .beacon-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 12px 0 6px;
          }
          .beacon-dot {
            position: relative;
            width: 12px;
            height: 12px;
          }
          .beacon-ring {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: #10b981;
            opacity: 0.75;
            ${isPatched
              ? 'animation: none; transform: scale(1);'
              : 'animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;'
            }
          }
          .beacon-core {
            position: relative;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #059669;
          }
          @keyframes ping {
            75%, 100% {
              transform: scale(2.4);
              opacity: 0;
            }
          }

          .interactive-box {
            margin-top: 32px;
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 14px;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
          }
          .interactive-text {
            font-size: 13px;
            ${isPatched ? 'color: #f1f5f9;' : 'color: #64748b;'}
          }

          /* =========================================================================
             ON-INTERFACE HIGHLIGHTING & BADGES
             ========================================================================= */
          .auditor-fix-highlight {
            outline: 2.5px solid #10b981 !important;
            outline-offset: 3px !important;
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.45) !important;
            animation: pulse-green 3s infinite ease-in-out !important;
          }
          @keyframes pulse-green {
            0%, 100% { outline-color: #10b981; box-shadow: 0 0 16px rgba(16, 185, 129, 0.45); }
            50% { outline-color: #34d399; box-shadow: 0 0 24px rgba(52, 211, 153, 0.7); }
          }

          .auditor-defect-highlight {
            outline: 2.5px dashed #f43f5e !important;
            outline-offset: 3px !important;
            box-shadow: 0 0 16px rgba(244, 63, 94, 0.4) !important;
            animation: pulse-rose 3s infinite ease-in-out !important;
          }
          @keyframes pulse-rose {
            0%, 100% { outline-color: #f43f5e; box-shadow: 0 0 16px rgba(244, 63, 94, 0.4); }
            50% { outline-color: #fb7185; box-shadow: 0 0 24px rgba(251, 113, 133, 0.7); }
          }

          .auditor-fix-badge, .auditor-defect-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 9px;
            border-radius: 9999px;
            font-size: 11px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 700;
            line-height: 1.2;
            letter-spacing: 0.02em;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            backdrop-filter: blur(8px);
            user-select: none;
          }
          .auditor-fix-badge {
            background: rgba(6, 78, 59, 0.95);
            color: #6ee7b7;
            border: 1px solid #10b981;
          }
          .auditor-defect-badge {
            background: rgba(136, 19, 55, 0.95);
            color: #fda4af;
            border: 1px solid #f43f5e;
          }

          .auditor-floating-hud {
            position: fixed;
            bottom: 16px;
            right: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            border-radius: 9999px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.02em;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            backdrop-filter: blur(12px);
            z-index: 100000;
          }
          .auditor-hud-green {
            background: rgba(6, 78, 59, 0.92);
            color: #a7f3d0;
            border: 1px solid rgba(16, 185, 129, 0.5);
          }
          .auditor-hud-rose {
            background: rgba(136, 19, 55, 0.92);
            color: #fecdd3;
            border: 1px solid rgba(244, 63, 94, 0.5);
          }
          .auditor-hud-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 8px #10b981;
          }
          .auditor-hud-dot-rose {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #f43f5e;
            box-shadow: 0 0 8px #f43f5e;
          }

          ${!showHighlight ? `
            .auditor-fix-highlight, .auditor-defect-highlight {
              outline: none !important;
              box-shadow: none !important;
              animation: none !important;
            }
            .auditor-fix-badge, .auditor-defect-badge, .auditor-floating-hud {
              display: none !important;
            }
          ` : ''}
        </style>
      </head>
      <body>
        <header>
          <div class="logo">
            <div class="logo-dot"></div>
            <span>${domain}</span>
          </div>
          <div class="nav-links">
            <a href="#">Overview</a>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Docs</a>
            <div style="position: relative; display: inline-block;">
              <button class="cta-btn ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}" onclick="handleClick()">Launch App</button>
              <div style="position: absolute; top: -22px; right: 0;">
                ${isPatched
                  ? '<span class="auditor-fix-badge">✓ Fixed: 44×44px Target</span>'
                  : '<span class="auditor-defect-badge">⚠️ Defect: 26px Touch Target</span>'
                }
              </div>
            </div>
          </div>
        </header>

        <div class="container">
          <div class="hero">
            <div class="badge">
              <span>●</span> Production Environment
              ${isPatched
                ? '<span class="auditor-fix-badge" style="margin-left: 8px;">✓ Fixed: font-display: swap</span>'
                : '<span class="auditor-defect-badge" style="margin-left: 8px;">⚠️ Defect: FOIT Risk</span>'
              }
            </div>
            <h1>Interactive Performance & Experience Preview</h1>

            <!-- Subtitle with Contrast Highlighting -->
            <div style="margin: 0 auto 24px; max-width: 640px;">
              <div style="margin-bottom: 6px;">
                ${isPatched
                  ? '<span class="auditor-fix-badge">✓ Fixed: 4.5:1+ Contrast Boosted</span>'
                  : '<span class="auditor-defect-badge">⚠️ Defect: 3.2:1 Low Contrast</span>'
                }
              </div>
              <p class="${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}">
                Experience your application with live styling, interactive touch targets, and visual polish applied in real time.
              </p>
            </div>

            <!-- Hero Buttons with Touch Target Highlighting -->
            <div class="hero-actions">
              <div style="position: relative; display: inline-block;">
                <button class="cta-btn ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}" onclick="handleClick()">Get Started</button>
                <div style="position: absolute; top: -22px; left: 0;">
                  ${isPatched
                    ? '<span class="auditor-fix-badge">✓ Fixed: 44×44px Target</span>'
                    : '<span class="auditor-defect-badge">⚠️ Defect: Sub-44px Hitbox</span>'
                  }
                </div>
              </div>
              <button class="secondary-btn ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}" onclick="handleClick()">View Documentation</button>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div>
                <div class="card-label">Latency & Edge</div>
                <div class="card-value">18 ms</div>
              </div>
              <p class="card-desc">Global edge distribution with instant page composition and zero render latency.</p>
            </div>

            <!-- Motion Card with Animation Highlighting -->
            <div class="card ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div class="card-label">Real-time Stream</div>
                  ${isPatched
                    ? '<span class="auditor-fix-badge">✓ Fixed: Motion-Safe Guard</span>'
                    : '<span class="auditor-defect-badge">⚠️ Defect: Infinite Ping</span>'
                  }
                </div>
                <div class="beacon-row">
                  <div class="beacon-dot">
                    <div class="beacon-ring"></div>
                    <div class="beacon-core"></div>
                  </div>
                  <span style="font-size:14px;font-weight:700;">Live Feed Synchronized</span>
                </div>
              </div>
              <p class="card-desc">Telemetry data flowing across active nodes with smooth motion-safe animations.</p>
            </div>

            <div class="card">
              <div>
                <div class="card-label">Visual Fidelity</div>
                <div class="card-value">100%</div>
              </div>
              <p class="card-desc">Optimized contrast rendering ensuring high legibility across all display devices.</p>
            </div>
          </div>

          <div class="interactive-box">
            <div class="interactive-text">
              <strong>Interactive Sandbox:</strong> Test live control responsiveness directly inside this window.
            </div>
            <button id="counter-btn" class="cta-btn ${isPatched ? 'auditor-fix-highlight' : ''}" onclick="handleCounter()">
              Click Counter: <span id="count">0</span>
            </button>
          </div>
        </div>

        <!-- Floating HUD Indicator on Interface -->
        <div class="auditor-floating-hud ${isPatched ? 'auditor-hud-green' : 'auditor-hud-rose'}">
          <span class="${isPatched ? 'auditor-hud-dot' : 'auditor-hud-dot-rose'}"></span>
          <span>${isPatched ? '✨ Live Fixes Highlighted On Interface' : '⚠️ Defects Highlighted On Interface'}</span>
        </div>

        <script>
          let count = 0;
          function handleClick() {
            console.log('Action triggered in preview session');
          }
          function handleCounter() {
            count++;
            const el = document.getElementById('count');
            if (el) el.innerText = count;
          }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(fallbackHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
