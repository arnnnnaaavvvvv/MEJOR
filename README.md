# arnav-audit

> Autonomous Internal Security, Memory Leakage & Invisible UI/UX Interface Auditor

[![npm version](https://img.shields.io/npm/v/arnav-audit.svg?color=00f5a0)](https://www.npmjs.com/package/arnav-audit)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js: >=16](https://img.shields.io/badge/node-%3E%3D16.0.0-blue.svg)](https://nodejs.org/)

`arnav-audit` is a high-speed, zero-dependency command-line interface and npm package designed to audit local codebases for critical security credential leaks, React/JS memory leaks, and invisible frontend UI/UX interface defects.

---

## ⚡ Instant Terminal Audit

Run directly in any project folder with zero installation via `npx`:

```bash
# Audit the current project directory
npx arnav-audit .

# Audit a specific directory or subdirectory
npx arnav-audit ./src

# Generate ready-to-paste AI fix prompts for Cursor, Claude Code, and Antigravity
npx arnav-audit . --prompts

# List every verified file inspected
npx arnav-audit . --files

# Scan exclusively for credentials, secrets & code injection vectors
npx arnav-audit . --security-only

# Scan exclusively for uncleaned listeners, interval timers & viewport leaks
npx arnav-audit . --leakage-only

# Output machine-readable JSON for CI/CD gates
npx arnav-audit . --json > audit-report.json
```

Or install globally:

```bash
npm install -g arnav-audit
arnav-audit .
```

---

## 🛡️ Detection Capabilities

### 1. Internal Security & Credential Leakage
- **Hardcoded Secret Keys**: Scans for exposed AWS access keys (`AKIA...`), OpenAI API keys (`sk-...`), GitHub personal access tokens (`ghp_...`), Stripe live secret keys (`sk_live_...`), and private key blocks (`-----BEGIN RSA PRIVATE KEY-----`).
- **Exposed Configuration**: Detects committed `.env` and `.env.local` files in git trees missing `.gitignore` coverage.
- **XSS & Code Injection Vectors**: Unsanitized `dangerouslySetInnerHTML`, `eval()`, and `new Function()` invocations.
- **Backend Injection Patterns**: Flags raw string interpolations in SQL queries and unsafe `subprocess(..., shell=True)` execution.

### 2. Major & Minor Memory & Resource Leakage
- **Hook Listener Leaks**: `addEventListener` inside React `useEffect` hooks missing clean-up `removeEventListener` callbacks.
- **Timer Leaks**: `setInterval` and `setTimeout` initialized without unmount `clearInterval` teardowns.
- **Global Scope Pollution**: Accidental state assignments to the global `window` object preventing garbage collection.
- **Residual Logging**: Production `console.log` statements leaking internal state and data payloads.

### 3. Invisible Interface & UI/UX Traps
- **iOS Safari Auto-Zoom Trap (`UX-IOS-AUTOZOOM`)**: Form inputs with `font-size < 16px` triggering mandatory mobile viewport zooming on focus.
- **300ms Touch Latency (`UX-TAP-LATENCY`)**: Interactive elements missing `touch-action: manipulation`.
- **Obliterated Focus Rings (`A11Y-FOCUS-OBLITERATED`)**: `outline: none` removing keyboard accessibility indicators (WCAG 2.4.7).
- **Flexbox Icon Collapse (`UI-FLEX-SQUISH`)**: Distorted SVG icons inside flex containers missing `flex-shrink: 0`.
- **Viewport Bleed (`UX-VIEWPORT-BLEED`)**: Horizontal layout thrashing from `100vw` scrollbar leaks.
- **Unannounced Icon Buttons (`A11Y-ICON-UNANNOUNCED`)**: Buttons with only icons missing `aria-label`.

---

## 🛠️ CLI Reference & Flags

| Flag | Shorthand | Description |
|---|---|---|
| `[directory]` | — | Target path to audit (defaults to `.`) |
| `--files` | `--list` | List every scanned file with inspection status |
| `--verbose` | — | Display detailed scan logs and file-by-file verification |
| `--prompts` | `--fix` | Pre-compile copy-paste AI fix prompts for Cursor / Claude Code |
| `--security-only`| `--security` | Scan exclusively for credentials, secrets & injection vectors |
| `--leakage-only` | `--leakage` | Scan exclusively for event listeners, timers & window leaks |
| `--json` | — | Output raw machine-readable JSON for CI/CD pipelines |
| `--version` | `-v` | Display CLI version |
| `--help` | `-h` | Display help screen |

---

## 🚀 GitHub Actions CI/CD Quality Gate

Add `arnav-audit` to your `.github/workflows/audit.yml` to automatically prevent credential leakage or broken mobile viewports from merging into production:

```yaml
name: Codebase Quality & Security Gate
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

## 🧪 Local Development & Testing

```bash
# Run unit tests
npm test

# Run audit locally
node bin/cli.js .

# Check help output
node bin/cli.js --help
```

---

## 📄 License

MIT © [Arnav](https://github.com/arnav)
