# Vibe Auditor — Autonomous UI/UX, Security & Invisible Defect Auditor

[![Vibe Audit](https://mejor-iota.vercel.app/api/v1/badges/mejor-iota.vercel.app.svg)](https://mejor-iota.vercel.app)
[![CLI: npx arnav-audit](https://img.shields.io/badge/CLI-npx%20arnav--audit-00f5a0.svg)](https://mejor-iota.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)

An autonomous UI/UX, internal security, memory leakage, and performance auditor built specifically for "vibe coders" and AI builders.

👉 **Live Production Dashboard**: [https://mejor-iota.vercel.app](https://mejor-iota.vercel.app)

---

## ⚡ Instant Terminal Audit (`arnav-audit`)

Run a full audit of your local codebase or live deployed website directly from your terminal with zero installation:

```bash
# Audit current local project (security, memory leaks, invisible UI traps)
npx arnav-audit

# Audit a live deployed website
npx arnav-audit https://mejor-iota.vercel.app

# Output ready-to-paste AI fix prompts for Cursor, Claude Code, and Antigravity
npx arnav-audit --prompts

# Scan exclusively for credentials, secrets & code injection vectors
npx arnav-audit --security-only

# Scan exclusively for uncleaned listeners, interval timers & viewport leaks
npx arnav-audit --leakage-only

# Output machine-readable JSON for CI/CD pipelines
npx arnav-audit --json > audit-report.json
```

---

## 🛡️ What `arnav-audit` Detects

### 1. Internal Security & Credential Leakage
- **Hardcoded Secret Keys**: Scans for AWS keys (`AKIA...`), OpenAI API keys (`sk-...`), GitHub tokens (`ghp_...`), Stripe keys (`sk_live_...`), JWTs, and unencrypted private keys (`-----BEGIN RSA PRIVATE KEY-----`).
- **Exposed Configuration**: Flags committed `.env` and `.env.local` files in git trees.
- **XSS & Code Injection**: Unsanitized `dangerouslySetInnerHTML`, `eval()`, and `new Function()` invocations.

### 2. Major & Minor Memory & Resource Leakage
- **Event Listener Leaks**: `addEventListener` inside React `useEffect` hooks missing clean-up `removeEventListener` callbacks.
- **Timer Leaks**: `setInterval` and `setTimeout` initialized without unmount `clearInterval` teardowns.
- **Global Scope Pollution**: Accidental state assignments to the global `window` object.
- **Residual Production Logging**: Production `console.log` statements leaking internal state and data payloads.

### 3. Invisible Interface & UI/UX Traps
- **iOS Safari Auto-Zoom Trap (`UX-IOS-AUTOZOOM`)**: Form inputs with `font-size < 16px` triggering mandatory mobile viewport zooming.
- **300ms Touch Latency (`UX-TAP-LATENCY`)**: Interactive elements missing `touch-action: manipulation`.
- **Obliterated Focus Rings (`A11Y-FOCUS-OBLITERATED`)**: `outline: none` removing keyboard accessibility indicators (WCAG 2.4.7).
- **Flexbox Icon Collapse (`UI-FLEX-SQUISH`)**: Distorted SVG icons inside flex containers missing `flex-shrink: 0`.
- **Viewport Bleed (`UX-VIEWPORT-BLEED`)**: Horizontal layout thrashing from `100vw` scrollbar leaks.
- **Unannounced Icon Buttons (`A11Y-ICON-UNANNOUNCED`)**: Buttons with only icons missing `aria-label`.

---

## Key Differentiators

1. **Measurement-Backed Findings**: Every issue is grounded in concrete DOM metrics, bounding-box coordinates, CDP layout telemetry, and computed CSS values. The LLM only phrases actionable instructions; it never invents or hallucinates issues.
2. **Synchronized Split-Screen Sandbox**: Live before-and-after view comparing original site vs. live injected CSS patch remediations.
3. **Copy-Paste Fix Prompts**: Pre-compiled prompts with exact selectors, source file references, constraints, and acceptance tests for Cursor, Claude Code, and Antigravity.
4. **200 Registered Checks**: Comprehensive catalog covering typography scales, off-grid spacing, 44px tap targets, contrast, CLS, longtasks, and dev leaks (`undefined`, `localhost`, `NaN`).
5. **Before/After Rescan & Diffing**: Compares consecutive scan runs, highlighting resolved vs persistent issues and score deltas.

---

## Monorepo Architecture

```
├── apps/
│   ├── api/            # FastAPI REST & SSE Gateway (SSRF validation, rate limiting, DB)
│   ├── worker/         # Playwright background worker (CDP telemetry, simulations, checks)
│   └── web/            # Next.js 14 frontend (Tailwind CSS, App router, score dials)
├── packages/
│   ├── arnav-audit/    # NPM CLI terminal tool (npx arnav-audit)
│   ├── check_registry/ # Check plugin engine & 45+ deterministic & simulation checks
│   ├── llm_analysis/   # Multimodal vision abstraction (Mock, OpenAI, Anthropic)
│   ├── scoring_prompts/# Severity weighting, score calculation, and prompt compiler
│   └── shared/         # Shared Pydantic schemas across services
├── tests/
│   ├── fixtures/       # Seeded defect test site
│   └── test_*.py       # Unit and integration test suites for all phases
└── docker-compose.yml  # Container orchestration (API, Worker, Web, Postgres, Redis)
```

---

## CI/CD GitHub Actions Workflow

Add `arnav-audit` to your `.github/workflows/audit.yml` to block pull requests containing security leaks or broken mobile viewports:

```yaml
name: Interface Quality & Security Gate
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

## Local Development Quickstart

```bash
# 1. Setup Next.js Frontend
npm run dev --prefix apps/web

# 2. Test CLI Locally
node packages/arnav-audit/bin/cli.js --help
```

---

## Production Deployment

Production URL: **[https://mejor-iota.vercel.app](https://mejor-iota.vercel.app)**
