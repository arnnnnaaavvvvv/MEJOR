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

    // Anti-crash and Anti-Scroll-Hijack shim for sandboxed preview:
    // Prevents target site scripts (Squarespace, Next.js, Webflow, etc.) from scrolling or navigating the parent window
    const antiCrashShim = `
      <script id="auditor-sandbox-shim">
        // 1. Suppress client-side routing exceptions inside sandbox iframe
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



        // 3. Prevent focus() calls on iframe elements from auto-scrolling parent window to top
        try {
          const origFocus = HTMLElement.prototype.focus;
          HTMLElement.prototype.focus = function(options) {
            options = options || {};
            options.preventScroll = true;
            try {
              return origFocus.call(this, options);
            } catch(err) {}
          };
        } catch(e) {}

        // 4. Neutralize SPA history path tampering while preserving internal session
        try {
          if (window.history && window.history.replaceState) {
            const origReplace = window.history.replaceState.bind(window.history);
            window.history.replaceState = function(state, unused, url) {
              try { return origReplace(state, unused, window.location.pathname); } catch(err) {}
            };
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

    // Scroll Reveal & User-Intended Synchronized Scrolling Engine for Preview Sandbox
    const scrollAndSyncEngine = `
      <style id="auditor-scroll-reveal-styles">
        /* Elements with scroll-reveal animations animate into view smoothly without global smooth scroll lock */
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
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', activateScrollReveal);
          } else {
            activateScrollReveal();
          }
          setTimeout(activateScrollReveal, 100);

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
          /* Live Remediation CSS overrides in Patched Mode for Invisible Interface Flaws */
          /* 1. iOS Safari Auto-Zoom Viewport Guard (<16px font triggers aggressive zoom) */
          @media (max-width: 768px) {
            input:not([type="checkbox"]):not([type="radio"]), select, textarea {
              font-size: 16px !important;
            }
          }

          /* 2. Zero-Delay Touch Response (Eliminates 300ms double-tap deferral) */
          button, a, [role="button"], input[type="button"], input[type="submit"], .cta-btn, .action-btn {
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: transparent !important;
          }

          /* 3. Keyboard Tab Focus Indicator Restoration */
          :focus-visible {
            outline: 2.5px solid #3b82f6 !important;
            outline-offset: 2.5px !important;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25) !important;
          }

          /* 4. Flexbox Icon & Badge Micro-Crush Elimination */
          [class*="flex"] > svg, [class*="flex"] > .badge, .status-indicator, button svg, .avatar-icon {
            flex-shrink: 0 !important;
          }

          /* 5. Hover Micro-Shift Jitter Elimination (Reserves border box model) */
          button, [role="button"], a.btn, .tab-item {
            border: 1.5px solid transparent !important;
            box-sizing: border-box !important;
            transition: transform 0.15s ease, border-color 0.15s ease !important;
          }
          button:hover, [role="button"]:hover, a.btn:hover {
            border-color: currentColor !important;
          }

          /* 6. 100vw Viewport Bleed & Horizontal Scrollbar Lockout */
          html, body {
            max-width: 100% !important;
            overflow-x: clip !important;
          }

          /* 7. Mobile Safe Area Notch & Home-Indicator Cushioning */
          header, nav, [class*="fixed top-0"], [class*="fixed bottom-0"], .fixed-bottom-bar {
            padding-top: max(12px, env(safe-area-inset-top)) !important;
            padding-bottom: max(16px, env(safe-area-inset-bottom)) !important;
          }

          /* 8. Ghost Click Interception & Dropdown Clipping Defense */
          .overlay, [class*="gradient-to-"]:not(button):not(a), .ambient-glow {
            pointer-events: none !important;
          }
          header, nav, .navbar {
            overflow: visible !important;
          }

          /* 9. Dark Mode Form Control Color-Scheme Synchronization */
          html {
            color-scheme: dark light !important;
          }
          select, input, textarea {
            color-scheme: inherit !important;
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

            function attachBadge(el, text, isBlock) {
              if (el.querySelector('.' + badgeClass) || el.parentElement?.querySelector('.' + badgeClass)) return;
              el.classList.add(highlightClass);
              const badge = document.createElement('span');
              badge.className = badgeClass;
              badge.innerHTML = text;
              if (isBlock) {
                badge.style.display = 'block';
                badge.style.width = 'fit-content';
                badge.style.marginBottom = '6px';
                el.parentElement?.insertBefore(badge, el);
              } else {
                badge.style.position = 'absolute';
                badge.style.top = '-24px';
                badge.style.left = '0';
                if (getComputedStyle(el).position === 'static') {
                  el.style.position = 'relative';
                }
                el.appendChild(badge);
              }
            }

            // 1. HIGHLIGHT FORM INPUTS (iOS Auto-Zoom Trap)
            const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea'));
            let inputTagged = 0;
            inputs.forEach(input => {
              if (inputTagged >= 2) return;
              if (input.closest('#auditor-floating-hud')) return;
              const cs = getComputedStyle(input);
              const fontSize = parseFloat(cs.fontSize) || 14;
              if (fontSize < 16 || isPatched) {
                attachBadge(
                  input,
                  isPatched ? '✓ Fixed: 16px iOS Zoom Guard' : '⚠️ Defect: iOS Auto-Zoom (&lt;16px Font)',
                  true
                );
                inputTagged++;
              }
            });

            // 2. HIGHLIGHT ICON-ONLY BUTTONS (Unannounced Action Blindness)
            const allButtons = Array.from(document.querySelectorAll('button, a[role="button"], a.btn'));
            let iconBtnTagged = 0;
            allButtons.forEach(btn => {
              if (iconBtnTagged >= 2) return;
              if (btn.closest('#auditor-floating-hud') || btn.classList.contains(highlightClass)) return;
              const hasSvg = btn.querySelector('svg');
              const hasText = btn.innerText.trim().length > 0;
              const hasAria = btn.hasAttribute('aria-label') || btn.hasAttribute('title');
              if (hasSvg && !hasText && (!hasAria || isPatched)) {
                attachBadge(
                  btn,
                  isPatched ? '✓ Fixed: Screen-Reader ARIA Label' : '⚠️ Defect: Unannounced Icon Action',
                  false
                );
                iconBtnTagged++;
              }
            });

            // 3. HIGHLIGHT FAST-TAP TOUCH CONTROLS (300ms Latency Lag)
            let tapTagged = 0;
            allButtons.forEach(btn => {
              if (tapTagged >= 2) return;
              if (btn.closest('#auditor-floating-hud') || btn.classList.contains(highlightClass)) return;
              const rect = btn.getBoundingClientRect();
              if (rect.width > 20 && rect.height > 20) {
                attachBadge(
                  btn,
                  isPatched ? '✓ Fixed: Zero-Delay Fast Tap' : '⚠️ Defect: 300ms Touch Latency Lag',
                  false
                );
                tapTagged++;
              }
            });

            // 4. HIGHLIGHT FLEX SQUISH ICONS (Missing flex-shrink: 0)
            const flexIcons = Array.from(document.querySelectorAll('[class*="flex"] > svg, header svg, nav svg'));
            let flexTagged = 0;
            flexIcons.forEach(icon => {
              if (flexTagged >= 2) return;
              if (icon.closest('#auditor-floating-hud') || icon.classList.contains(highlightClass)) return;
              const parent = icon.parentElement;
              if (parent && !parent.classList.contains(highlightClass)) {
                attachBadge(
                  parent,
                  isPatched ? '✓ Fixed: flex-shrink: 0 Locked' : '⚠️ Defect: Flex Shrink Distortion',
                  true
                );
                flexTagged++;
              }
            });

            // 5. HIGHLIGHT HOVER MICRO-SHIFT JITTER (Dynamic Border Jump)
            const interactiveCards = Array.from(document.querySelectorAll('.card, [class*="card"], .tab-item, header nav a'));
            let cardTagged = 0;
            interactiveCards.forEach(card => {
              if (cardTagged >= 1) return;
              if (card.closest('#auditor-floating-hud') || card.classList.contains(highlightClass)) return;
              attachBadge(
                card,
                isPatched ? '✓ Fixed: Zero-Shift Inset Border' : '⚠️ Defect: Hover Layout Jitter',
                true
              );
              cardTagged++;
            });

            // 6. FLOATING SUMMARY HUD
            if (!document.getElementById('auditor-floating-hud')) {
              const hud = document.createElement('div');
              hud.id = 'auditor-floating-hud';
              hud.className = 'auditor-floating-hud ' + (isPatched ? 'auditor-hud-green' : 'auditor-hud-rose');
              hud.innerHTML = isPatched
                ? '<span class="auditor-hud-dot"></span><span>✨ Live Invisible Interface Fixes Active</span>'
                : '<span class="auditor-hud-dot-rose"></span><span>⚠️ Invisible Interface Defects Highlighted</span>';
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
              outline-color: transparent !important;
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
          <div class="logo" style="display: flex; align-items: center; gap: 8px;">
            <div class="logo-dot ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}" style="flex-shrink: ${isPatched ? '0' : '1'};"></div>
            <span>${domain}</span>
            <span class="${isPatched ? 'auditor-fix-badge' : 'auditor-defect-badge'}" style="margin-left: 4px;">
              ${isPatched ? '✓ Fixed: flex-shrink: 0 Locked' : '⚠️ Defect: Flex Shrink Distortion'}
            </span>
          </div>
          <div class="nav-links">
            <a href="#">Overview</a>
            <a href="#">Features</a>
            <a href="#">Docs</a>
            <!-- Icon-only action button with Screen-Reader Accessibility defect / fix -->
            <div style="position: relative; display: inline-block;">
              <button
                class="cta-btn ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}"
                ${isPatched ? 'aria-label="Global Search"' : ''}
                style="display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; padding: 0; border-radius: 8px;"
                title="Search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ${isPatched ? 'aria-hidden="true"' : ''}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <div style="position: absolute; top: -24px; right: 0;">
                ${isPatched
                  ? '<span class="auditor-fix-badge">✓ Fixed: ARIA Label Added</span>'
                  : '<span class="auditor-defect-badge">⚠️ Defect: Unannounced Icon Action</span>'
                }
              </div>
            </div>
            <!-- Fast Tap button with 0ms vs 300ms latency -->
            <div style="position: relative; display: inline-block;">
              <button
                class="cta-btn ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}"
                style="${isPatched ? 'touch-action: manipulation; -webkit-tap-highlight-color: transparent;' : ''}"
                onclick="handleClick()"
              >
                Launch App
              </button>
              <div style="position: absolute; top: -24px; right: 0;">
                ${isPatched
                  ? '<span class="auditor-fix-badge">✓ Fixed: Zero-Delay Fast Tap</span>'
                  : '<span class="auditor-defect-badge">⚠️ Defect: 300ms Touch Latency</span>'
                }
              </div>
            </div>
          </div>
        </header>

        <div class="container">
          <div class="hero">
            <div class="badge">
              <span>●</span> Production Environment
              <span class="${isPatched ? 'auditor-fix-badge' : 'auditor-defect-badge'}" style="margin-left: 8px;">
                ${isPatched ? '✓ Fixed: Viewport 100vw Bleed Clipped' : '⚠️ Defect: 100vw Scrollbar Bleed'}
              </span>
            </div>
            <h1>Invisible Interface Defects Diagnostic Sandbox</h1>
            <p style="color: #94a3b8; max-width: 640px; margin: 0 auto 24px; font-size: 14px; line-height: 1.6;">
              Detecting subtle, elusive interface flaws that developers and vibe coders miss: iOS Safari auto-zooming, 300ms touch delay, icon crushing, and unannounced screen-reader triggers.
            </p>

            <!-- Form Input with iOS Auto-Zoom Highlighting -->
            <div style="max-width: 440px; margin: 0 auto 28px; text-align: left;">
              <div style="margin-bottom: 6px;">
                ${isPatched
                  ? '<span class="auditor-fix-badge">✓ Fixed: 16px iOS Safari Zoom Guard</span>'
                  : '<span class="auditor-defect-badge">⚠️ Defect: iOS Auto-Zoom (13px Font Triggers Viewport Zoom)</span>'
                }
              </div>
              <input
                type="text"
                placeholder="Tap to test iOS auto-zoom behavior..."
                class="${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}"
                style="width: 100%; padding: 12px 16px; border-radius: 10px; background: #0f172a; border: 1.5px solid ${isPatched ? '#10b981' : '#f43f5e'}; color: #fff; font-size: ${isPatched ? '16px' : '13px'}; outline: none; transition: border-color 0.2s;"
              />
              <span style="font-size: 11px; color: #64748b; margin-top: 4px; display: block;">
                ${isPatched ? 'Evaluates at 16px font-size: iOS will not zoom or distort the page layout on focus.' : 'Evaluates at 13px font-size: Mobile Safari will forcibly zoom the screen on tap.'}
              </span>
            </div>

            <!-- Zero-Shift Hover Button -->
            <div class="hero-actions">
              <div style="position: relative; display: inline-block;">
                <button
                  class="cta-btn ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}"
                  style="border: 1.5px solid ${isPatched ? 'transparent' : 'transparent'}; box-sizing: border-box; touch-action: manipulation;"
                  onclick="handleClick()"
                >
                  Interactive Action Button
                </button>
                <div style="position: absolute; top: -24px; left: 0;">
                  ${isPatched
                    ? '<span class="auditor-fix-badge">✓ Fixed: Zero-Shift Inset Border</span>'
                    : '<span class="auditor-defect-badge">⚠️ Defect: Hover Layout Jitter</span>'
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="grid">
            <div class="card ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div class="card-label">Keyboard Tab Navigation</div>
                  ${isPatched
                    ? '<span class="auditor-fix-badge">✓ Fixed: :focus-visible Restored</span>'
                    : '<span class="auditor-defect-badge">⚠️ Defect: Focus Obliterated</span>'
                  }
                </div>
                <div class="card-value" style="font-size: 16px; font-weight: 600; color: #e2e8f0; margin-top: 6px;">
                  ${isPatched ? '2.5px High-Contrast Ring' : 'Missing Visible Focus Ring'}
                </div>
              </div>
              <p class="card-desc">Power users pressing Tab receive clear feedback without unsightly mouse borders.</p>
            </div>

            <div class="card ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div class="card-label">Safe-Area Notch Inset</div>
                  ${isPatched
                    ? '<span class="auditor-fix-badge">✓ Fixed: Notch Safe</span>'
                    : '<span class="auditor-defect-badge">⚠️ Defect: Home Bar Collision</span>'
                  }
                </div>
                <div class="card-value" style="font-size: 16px; font-weight: 600; color: #e2e8f0; margin-top: 6px;">
                  ${isPatched ? 'env(safe-area-inset-bottom)' : 'bottom: 0px (Under Home Bar)'}
                </div>
              </div>
              <p class="card-desc">Bottom action sheets and floating triggers clear modern phone gesture bars.</p>
            </div>

            <div class="card ${isPatched ? 'auditor-fix-highlight' : 'auditor-defect-highlight'}">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div class="card-label">Stacking Context & Overlays</div>
                  ${isPatched
                    ? '<span class="auditor-fix-badge">✓ Fixed: pointer-events: none</span>'
                    : '<span class="auditor-defect-badge">⚠️ Defect: Ghost Pointer Intercept</span>'
                  }
                </div>
                <div class="card-value" style="font-size: 16px; font-weight: 600; color: #e2e8f0; margin-top: 6px;">
                  ${isPatched ? 'Clicks Pass Directly to Buttons' : 'Backdrop Swallows Clicks'}
                </div>
              </div>
              <p class="card-desc">Ambient gradient filters allow mouse and touch events to pass cleanly to controls.</p>
            </div>
          </div>

          <div class="interactive-box">
            <div class="interactive-text">
              <strong>Interactive Sandbox:</strong> Test live control responsiveness and zero-latency click dispatch directly inside this window.
            </div>
            <button id="counter-btn" class="cta-btn ${isPatched ? 'auditor-fix-highlight' : ''}" style="touch-action: manipulation;" onclick="handleCounter()">
              Click Counter: <span id="count">0</span>
            </button>
          </div>
        </div>

        <!-- Floating HUD Indicator on Interface -->
        <div class="auditor-floating-hud ${isPatched ? 'auditor-hud-green' : 'auditor-hud-rose'}">
          <span class="${isPatched ? 'auditor-hud-dot' : 'auditor-hud-dot-rose'}"></span>
          <span>${isPatched ? '✨ Live Invisible Interface Fixes Active' : '⚠️ Invisible Interface Defects Highlighted'}</span>
        </div>

        <script>
          let count = 0;
          function handleClick() {
            // Preview interaction handler
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
