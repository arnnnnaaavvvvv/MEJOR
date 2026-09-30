# arnav-audit

> Autonomous Internal Security, Memory Leakage & Invisible UI/UX Interface Auditor

[![npm version](https://img.shields.io/npm/v/arnav-audit.svg?color=00f5a0)](https://www.npmjs.com/package/arnav-audit)
[![GitHub Repository](https://img.shields.io/badge/GitHub-arnnnnaaavvvvv%2FMEJOR-00f5a0.svg?logo=github)](https://github.com/arnnnnaaavvvvv/MEJOR)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js: >=16](https://img.shields.io/badge/node-%3E%3D16.0.0-blue.svg)](https://nodejs.org/)

`arnav-audit` is a high-speed, zero-dependency command-line interface and package designed to audit local codebases for critical security credential leaks, React/JS memory leaks, and invisible frontend UI/UX interface defects.

---

## 🚀 Quickstart: Installation to Final Execution Pipeline

Follow this 4-step workflow to install, verify, and run audits across your projects:

### Step 1: Install Globally
Choose any method to install or run the CLI:

```bash
# Method A: Install globally via npm
npm install -g arnav-audit

# Method B: Direct install from GitHub (works for anyone without npm login)
npm install -g github:arnnnnaaavvvvv/MEJOR

# Method C: If working inside this cloned repository
npm install -g . --force
```

*(Alternatively, run instantly with zero installation: `npx github:arnnnnaaavvvvv/MEJOR .` or `npx arnav-audit .`)*

---

### Step 2: Verify the CLI Binary
Confirm that `arnav-audit` is globally registered in your terminal:
```bash
arnav-audit --version
# Output: arnav-audit v1.0.5

arnav-audit --help
# Displays available flags, rules, and example commands
```

---

### Step 3: Run the Codebase Audit
Navigate to any project directory and run the audit:
```bash
# Audit the current project directory (visits every file)
arnav-audit .

# Audit a specific backend service, directory, or individual file
arnav-audit ./apps/api
arnav-audit ./apps/api/core/security.py

# List every single file inspected across the codebase
arnav-audit . --files

# Scan exclusively for backend weak points, SQLi, RCE, and auth bypasses
arnav-audit . --backend-only

# Scan exclusively for secret gateways, database URIs, API keys & tokens
arnav-audit . --security-only

# Scan exclusively for memory & event listener leaks
arnav-audit . --leakage-only
```

---

### Step 4: Generate Automated AI Fix Prompts (Final Step)
Generate ready-to-paste prompts formatted specifically for Cursor, Claude Code, or Antigravity:
```bash
arnav-audit . --prompts
```

Or pipe machine-readable JSON into CI/CD quality gates:
```bash
arnav-audit . --json > audit-report.json
```

---

## 🛡️ Detection Capabilities

### 1. Secret Gateway & Sensitive Credential Leakage
- **Database Gateway URIs (`SEC-GATEWAY-DATABASE-URI`)**: Hardcoded connection strings with embedded plaintext passwords (`postgresql://`, `mysql://`, `mongodb://`, `mongodb+srv://`, `redis://`, `amqp://`).
- **Authentication & Gateway Secrets (`SEC-GATEWAY-JWT-SECRET`)**: Hardcoded JWT signing keys (`JWT_SECRET`, `SECRET_KEY`, `AUTH_SECRET`).
- **Cloud & AI Gateway API Keys**: Scans for AWS access keys (`AKIA...`), AWS secret access keys, OpenAI keys (`sk-...`, `sk-proj-...`), Anthropic Claude keys (`sk-ant-...`), Google Cloud keys (`AIza...`), and Stripe live secrets (`sk_live_...`).
- **Developer & Webhook Gateways**: Scans for GitHub PATs (`ghp_...`, `github_pat_...`), GitLab tokens (`glpat-...`), Slack incoming webhooks, Discord webhook URLs, and SendGrid keys.
- **Unencrypted Private Keys (`SEC-PRIVATE-KEY`)**: RSA, DSA, EC, OPENSSH, and PGP private key blocks committed to source.
- **Exposed Configuration (`SEC-ENV-EXPOSED`)**: Detects committed `.env` and `.env.local` files in git trees missing `.gitignore` coverage.

### 2. Backend Security & Weak Points
- **Production Debug Mode (`SEC-BACKEND-DEBUG-ENABLED`)**: Detects `DEBUG = True`, `app.run(debug=True)`, or `FastAPI(debug=True)` exposing interactive execution gateways in production.
- **SQL Injection (`SEC-BACKEND-SQL-INJECTION`)**: Python f-strings, `%` format strings, and Node template literals directly interpolated into database queries (`cursor.execute`, `pool.query`).
- **Remote Command Execution (`SEC-BACKEND-COMMAND-INJECTION`)**: Dangerous shell executions via `subprocess(..., shell=True)`, `os.system()`, `child_process.exec()`, or `execSync()`.
- **Disabled TLS/SSL Verification (`SEC-BACKEND-SSL-VERIFY-DISABLED`)**: Detects `verify=False` in Python `requests`/`httpx` or `rejectUnauthorized: false` in Node.js.
- **Insecure Object Deserialization (`SEC-BACKEND-INSECURE-DESERIALIZE`)**: Unsafe `pickle.loads()` and arbitrary YAML loading allowing remote code execution.
- **Path Traversal & Arbitrary File Access (`SEC-BACKEND-PATH-TRAVERSAL`)**: User parameters passed directly to `open()`, `send_file()`, or `res.sendFile()`.
- **SSRF Vectors (`SEC-BACKEND-SSRF`)**: Outgoing HTTP requests to raw unvalidated URLs without private/loopback IP validation.
- **Permissive Wildcard CORS (`SEC-BACKEND-CORS-WILDCARD`)**: `allow_origins=["*"]` combined with credentials allowed.
- **Hardcoded Admin Bypass (`SEC-BACKEND-HARDCODED-ADMIN`)**: Hardcoded authentication bypass conditions or admin tokens.
- **Stack Trace Information Leaks (`SEC-BACKEND-STACKTRACE-LEAK`)**: Raw stack traces returned in HTTP API error payloads.
- **Insecure Session Cookies (`SEC-BACKEND-INSECURE-COOKIE`)**: Missing `HttpOnly` or `Secure` flags on authentication cookies.
- **Weak Cryptographic Hashes (`SEC-BACKEND-WEAK-HASH`)**: Insecure MD5 or SHA-1 hashes used for security or passwords.

### 3. Major & Minor Memory & Resource Leakage
- **Backend Mutable Default Arguments (`LEAK-BACKEND-MUTABLE-DEFAULT`)**: Python `def func(items=[])` leaking state across API requests and causing unbounded memory accumulation.
- **Hook Listener Leaks (`LEAK-EVENT-LISTENER`)**: `addEventListener` inside React `useEffect` hooks missing clean-up `removeEventListener` callbacks.
- **Timer Leaks (`LEAK-INTERVAL-TIMER`)**: `setInterval` and `setTimeout` initialized without unmount `clearInterval` teardowns.
- **Global Scope Pollution (`LEAK-WINDOW-POLLUTION`)**: Accidental state assignments to the global `window` object preventing garbage collection.
- **Residual Logging (`LEAK-CONSOLE-LOGS`)**: Production `console.log` statements leaking internal state and data payloads.

### 4. Invisible Interface & UI/UX Traps
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
| `[directory\|file]` | — | Target path to audit (defaults to current directory `.`) |
| `--files` | `--list` | List every single scanned file path with inspection status |
| `--backend-only` | `--backend` | Scan exclusively for backend weak points, SQLi, RCE, CORS & auth bypasses |
| `--security-only`| `--security` | Scan exclusively for secret gateways, database URIs, API keys & tokens |
| `--leakage-only` | `--leakage` | Scan exclusively for memory leaks, mutable defaults & dangling listeners |
| `--ui-only` | `--ui` | Scan exclusively for invisible UI/UX interface defects and accessibility traps |
| `--prompts` | `--fix` | Pre-compile copy-paste AI fix prompts for Cursor, Claude Code & Antigravity |
| `--verbose` | — | Display detailed scan logs and file-by-file verification |
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
