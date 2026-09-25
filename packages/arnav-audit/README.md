# arnav-audit

> Autonomous Internal Security, Memory Leakage & Invisible UI/UX Interface Auditor by Arnav.

[![Vibe Audit](https://mejor-iota.vercel.app/api/v1/badges/mejor-iota.vercel.app.svg)](https://mejor-iota.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)

Run deep internal security, memory leak, and invisible frontend defect audits across your code repositories and live websites directly from your terminal.

---

## Quickstart

Run directly via `npx` with zero installation:

```bash
# Audit current local project repository
npx arnav-audit

# Audit specific directory
npx arnav-audit ./apps/web

# Audit live deployed URL (queries headless CDP telemetry engine)
npx arnav-audit https://mejor-iota.vercel.app
```

---

## What `arnav-audit` Detects

### 1. Internal Security & Credential Leakage
- **Hardcoded Secret Keys**: Scans for exposed AWS access keys (`AKIA...`), OpenAI API keys (`sk-...`), GitHub personal access tokens (`ghp_...`), Stripe live secret keys (`sk_live_...`), and private key blocks (`-----BEGIN RSA PRIVATE KEY-----`).
- **Exposed Configuration**: Detects committed `.env` and `.env.local` files in git trees.
- **XSS & Code Injection Vectors**: Unsanitized `dangerouslySetInnerHTML`, `eval()`, and `new Function()` invocations.

### 2. Major & Minor Memory Leakage
- **Hook Listener Leaks**: `addEventListener` inside React `useEffect` hooks missing clean-up `removeEventListener` callbacks.
- **Timer Leaks**: `setInterval` and `setTimeout` without unmount `clearInterval` teardowns.
- **Global Scope Pollution**: Accidental state assignments to the global `window` object.
- **Residual Logging**: Production `console.log` statements leaking internal state and data payloads.

### 3. Invisible Interface & UI/UX Traps
- **iOS Safari Auto-Zoom Trap (`UX-IOS-AUTOZOOM`)**: Form inputs with `font-size < 16px` triggering mandatory mobile viewport zooming.
- **300ms Touch Latency (`UX-TAP-LATENCY`)**: Interactive elements missing `touch-action: manipulation`.
- **Obliterated Focus Rings (`A11Y-FOCUS-OBLITERATED`)**: `outline: none` removing keyboard accessibility indicators (WCAG 2.4.7).
- **Flexbox Icon Collapse (`UI-FLEX-SQUISH`)**: Distorted SVG icons inside flex containers missing `flex-shrink: 0`.
- **Viewport Bleed (`UX-VIEWPORT-BLEED`)**: Horizontal layout thrashing from `100vw` scrollbar leaks.
- **Unannounced Icon Buttons (`A11Y-ICON-UNANNOUNCED`)**: Buttons with only icons missing `aria-label`.

---

## Options & Flags

```bash
# Generate ready-to-paste AI fix prompts for Cursor & Claude Code
npx arnav-audit --prompts

# Scan exclusively for security credentials and XSS vulnerabilities
npx arnav-audit --security-only

# Scan exclusively for memory & event listener leaks
npx arnav-audit --leakage-only

# Output machine-readable JSON for CI/CD pipelines
npx arnav-audit --json > audit-results.json
```

---

## GitHub Actions CI/CD Integration

Fail your CI build if critical security or memory leaks are detected:

```yaml
name: Internal Quality & Security Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Run arnav-audit
        run: npx arnav-audit .
```

---

## Online Interactive Dashboard

View synchronized Before vs. After split-view preview and live in-browser CSS patches at:  
👉 [**https://mejor-iota.vercel.app**](https://mejor-iota.vercel.app)
