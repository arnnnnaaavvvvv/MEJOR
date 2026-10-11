# MEJOR
> **Autonomous zero-dependency AST security auditor and memory leak detector with automated prompt synthesis for AI code assistants.**

[![npm version](https://img.shields.io/npm/v/arnav-audit.svg?color=00f5a0)](https://www.npmjs.com/package/arnav-audit)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js: >=16](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-blue.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/arnnnnaaavvvvv/MEJOR)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-orange.svg)](https://github.com/arnnnnaaavvvvv/MEJOR)
[![GitHub Repository](https://img.shields.io/badge/GitHub-arnnnnaaavvvvv%2FMEJOR-00f5a0.svg?logo=github)](https://github.com/arnnnnaaavvvvv/MEJOR)

🌐 **Package Registry**: [https://www.npmjs.com/package/arnav-audit](https://www.npmjs.com/package/arnav-audit) • **Web Dashboard**: [https://mejor.vercel.app](https://mejor.vercel.app)

---

## Overview

**MEJOR** (`arnav-audit`) is an enterprise-grade, zero-dependency command-line security auditor and AST quality gate engineered for modern full-stack codebases. While traditional static analysis suites like SonarQube or Snyk require heavy Java runtimes, cloud daemon setups, or slow compilation passes, MEJOR executes in sub-second intervals directly over local file streams without external network calls. The engine scans across four mission-critical pillars: (1) **Secret Gateways & Credentials** (unencrypted database URIs, JWT signing keys, cloud access keys, private SSH/RSA blocks), (2) **Backend Vulnerabilities** (production debug flags, SQL query formatting injection, remote shell execution, SSRF vectors, disabled TLS verification), (3) **Runtime Memory & Resource Leaks** (Python mutable function defaults, uncleaned React `useEffect` event listeners, orphaned `setInterval` timers), and (4) **Mobile UI/UX Traps** (iOS 16px auto-zoom triggers, missing focus rings, layout bleed). For every detected defect, MEJOR synthesizes immediate, pre-compiled remediation prompt payloads formatted specifically for Cursor, Claude Code, and Antigravity.

---

## Feature Table

| Feature | Description |
| :--- | :--- |
| **Zero-Dependency Architecture** | Built purely on native Node.js standard libraries (`fs`, `path`, `crypto`); installs in seconds without bulky dependency trees or security supply-chain risks. |
| **Secret Gateway Detection** | Identifies exposed database connection strings (`postgresql://`, `mongodb+srv://`, `redis://`), JWT signing keys, AWS IAM credentials, and unencrypted private keys. |
| **Backend OWASP Protection** | Flags SQL injection vectors (f-string and template literal queries), command injections (`shell=True`, `child_process.exec`), SSRF vectors, and production debug flags. |
| **Memory & Lifecycle Leak Audit** | Pinpoints React hook memory leaks (missing `removeEventListener` cleanups), un-cleared intervals, global `window` object pollution, and Python mutable default arguments. |
| **Mobile & Invisible UX Traps** | Detects iOS Safari form input auto-zoom traps (`< 16px`), 300ms mobile touch delay, obliterated keyboard focus rings (`outline: none`), and flexbox SVG collapse. |
| **Automated AI Fix Prompts** | Compiles structured remediation prompt blocks (`--prompts` / `--fix`) containing exact line numbers, vulnerable snippets, and drop-in fixes for AI coding agents. |
| **Strict CI/CD Quality Gating** | Returns deterministic exit codes (`0` for clean passes, `1` for critical breaches), integrating seamlessly into GitHub Actions and GitLab CI workflows. |
| **Fast Recursive File Walker** | Traverses 10,000+ files in sub-second timeframes with automatic skipping of binary files, lockfiles, hidden directories, and test fixtures. |
| **Machine-Readable JSON Output** | Emits standard JSON payloads (`--json`) for automated pipeline consumption, security dashboards, and internal compliance tracking. |
| **Surgical Pillar Filtering** | Allows running focused scans with granular CLI flags: `--security-only`, `--backend-only`, `--leakage-only`, or `--ui-only`. |

---

## What It Can Do Now

- **Audit Multi-Language Codebases**: Inspects JavaScript, TypeScript, Python, HTML, CSS, JSON, YAML, and `.env` files in a single pass.
- **Prevent Credential Commits**: Halts CI pipelines whenever exposed database URIs with passwords or cloud API keys (AWS, OpenAI, Anthropic, Stripe) are discovered.
- **Surface Invisible Mobile UI Traps**: Flags CSS rules causing mobile usability degradation (e.g., input font sizes below 16px forcing iOS Safari auto-zoom).
- **Identify React Memory Leaks**: Scans component lifecycles to detect event listeners and interval timers missing cleanup teardowns.
- **Generate Immediate AI Remediation**: Outputs pre-formatted fix instructions ready to paste into Cursor, Claude Code, or Antigravity.
- **Run Standalone with Zero Installation**: Executes instantly on any machine with Node.js installed using `npx arnav-audit .`.
- **Enforce Non-Zero Exit Codes**: Automatically fails build pipelines on CRITICAL vulnerability discoveries while reporting advisory warnings for minor issues.

---

## The Problem

| Dimension | Heavy SAST Suites (SonarQube, Snyk) | Generic Linters (ESLint, Flake8) | Manual Code Reviews | MEJOR (`arnav-audit`) |
| :--- | :--- | :--- | :--- | :--- |
| **Dependency Footprint** | Gigabytes of runtime memory, JVM dependencies, external Docker containers. | Requires dozens of plugins, configuration files, and language-specific runners. | None, but consumes expensive engineering hours. | **Zero dependencies. Single self-contained JavaScript script running on native Node.js.** |
| **Scan Velocity** | 30 to 300 seconds per scan; slow build pipeline bottlenecks. | 5 to 20 seconds; requires separate linters for Python, JS, and CSS. | Days of review cycle latency. | **Sub-second execution (< 500ms across thousands of codebase files).** |
| **Credential & Secret Discovery** | Often locked behind enterprise commercial tiers or separate add-ons. | Incapable of cross-language secret detection. | Prone to human oversight in large diffs. | **Built-in 4-Pillar secret gateway auditing covering DB URIs, JWTs, and cloud keys.** |
| **Memory & Mobile UX Auditing** | Blind to client-side timer leaks, iOS auto-zoom traps, and touch latency. | Requires bespoke, heavily configured ESLint rules for hooks. | Subjective and rarely tested across mobile viewports. | **Dedicated memory leak detection and mobile viewport/accessibility trap rules.** |
| **Remediation Workflow** | Generic documentation links requiring manual developer research. | Simple error messages without context or automated fixes. | Freeform comment feedback. | **Auto-generated AI fix prompts tailored for Cursor, Claude Code, and Antigravity.** |

---

## Get Started

### Prerequisites
- **Node.js**: v16.0.0 or higher
- **npm** (comes bundled with Node.js)

### 1. Global Installation (Recommended)
Install `arnav-audit` globally via npm or directly from GitHub:

```bash
# Option A: Install from npm registry
npm install -g arnav-audit

# Option B: Direct install from GitHub
npm install -g github:arnnnnaaavvvvv/MEJOR

# Option C: Zero-install execution via npx
npx arnav-audit .
```

### 2. Verify Installation
```bash
arnav-audit --version
# Output: arnav-audit v1.0.5

arnav-audit --help
# Displays usage flags, detection rules, and examples
```

### 3. Run Your First Codebase Audit
Navigate to any project directory and run:

```bash
# Scan entire project
arnav-audit .

# Scan specific directory or file
arnav-audit ./src/backend

# Generate automated AI fix prompts
arnav-audit . --prompts
```

---

## Docker Quick Start

For containerized CI pipelines or air-gapped security audits, run MEJOR directly inside an official Node.js container:

```bash
# Run one-off audit inside container mounting current working directory
docker run --rm -v "$(pwd):/app" -w /app node:20-alpine npx -y arnav-audit .

# Run with automated AI fix prompts
docker run --rm -v "$(pwd):/app" -w /app node:20-alpine npx -y arnav-audit . --prompts
```

---

## Example input → output

### Example CLI Execution
Executing an audit on a repository with an exposed database URI and an uncleaned React event listener:

```bash
arnav-audit ./src --prompts
```

### Example Terminal Output
```
   _    ____  _   _    ___     __     _   _   _ ____ ___ _____ 
  / \  |  _ \| \ | |  / \ \   / /    / \ | | | |  _ \_ _|_   _|
 / _ \ | |_) |  \| | / _ \ \ / /    / _ \| | | | | | | |  | |  
/ ___ \|  _ <| |\  |/ ___ \ V /    / ___ \ |_| | |_| | |  | |  
/_/   \_\_| \_\_| \_/_/   \_\_/    /_/   \_\___/|____/___| |_|  
Autonomous Security, Memory Leakage, Secret Gateways & Backend Auditor
Engine by Arnav • Cross-Platform Codebase & Gateway Quality Gate

Target: C:\Users\workspace\src
Scanning 42 files across 4 pillars...

[CRITICAL] Exposed Database Gateway URI with Plaintext Password
  Rule: SEC-GATEWAY-DATABASE-URI
  File: src/database/connection.py:14
  Match: postgresql://admin:SuperSecretPass123@prod-db.internal:5432/app
  Fix:   Move database connection URI to environment variables (e.g. DATABASE_URL) and use a secret manager.

[MAJOR] Dangling EventListener in Hook (Missing Clean-up)
  Rule: LEAK-EVENT-LISTENER
  File: src/components/Navigation.tsx:28
  Match: addEventListener('resize', handleResize)
  Fix:   Return a clean-up function in useEffect: () => window.removeEventListener('resize', handleResize).

============================================================
AUDIT SUMMARY:
  Total Files Scanned: 42
  Findings: 2 (1 Critical, 1 Major, 0 Minor)
  Status: FAILED (Critical breaches detected)
============================================================

🤖 AI REMEDIATION PROMPT (Copy & Paste into Cursor / Claude Code):
------------------------------------------------------------
Please fix the following 2 architectural defects identified by arnav-audit:

1. [src/database/connection.py:14] SEC-GATEWAY-DATABASE-URI:
   Exposed Database Gateway URI with Plaintext Password.
   Remedy: Move connection string to os.environ.get('DATABASE_URL').

2. [src/components/Navigation.tsx:28] LEAK-EVENT-LISTENER:
   Dangling EventListener in Hook (Missing Clean-up).
   Remedy: Add `return () => window.removeEventListener('resize', handleResize)` to the useEffect cleanup callback.
------------------------------------------------------------
```

---

## API Usage

### 1. Full Audit with AI Prompt Compilation
```bash
arnav-audit . --prompts
```

### 2. Output Machine-Readable JSON for CI Pipelines
```bash
arnav-audit . --json > audit-results.json
```

### 3. Filter by Audit Pillar
```bash
# Scan exclusively for secret gateways & credential leaks
arnav-audit . --security-only

# Scan exclusively for backend vulnerabilities (SQLi, RCE, SSRF)
arnav-audit . --backend-only

# Scan exclusively for memory and timer leaks
arnav-audit . --leakage-only

# Scan exclusively for mobile UI/UX traps
arnav-audit . --ui-only
```

### 4. Verbose File Inspection
```bash
# List all evaluated files with inspection status
arnav-audit . --files --verbose
```

---

## Configuration table

All scanner options are supplied via command-line arguments:

| Option | Flag | Default | Description |
| :--- | :--- | :--- | :--- |
| `target` | `[path]` | `.` | Target directory or file path to evaluate. |
| `prompts` | `--prompts`, `--fix` | `false` | Generates copy-paste prompt blocks for AI coding agents (Cursor, Claude Code). |
| `json` | `--json` | `false` | Emits raw machine-readable JSON payload instead of ANSI terminal output. |
| `securityOnly` | `--security-only`, `--security` | `false` | Filters rules exclusively to Secret Gateways & Credentials (Pillar 1). |
| `backendOnly` | `--backend-only`, `--backend` | `false` | Filters rules exclusively to Backend Security & OWASP defects (Pillar 2). |
| `leakageOnly` | `--leakage-only`, `--leakage` | `false` | Filters rules exclusively to Memory & Resource Leakage (Pillar 3). |
| `uiOnly` | `--ui-only`, `--ui` | `false` | Filters rules exclusively to Invisible UI/UX Traps & Accessibility (Pillar 4). |
| `verbose` | `--verbose` | `false` | Enables detailed logging of file evaluation and rule matching coordinates. |
| `files` | `--files`, `--list` | `false` | Prints a comprehensive manifest of all inspected file paths. |
| `help` | `--help`, `-h` | `false` | Displays the help manual and usage instructions. |
| `version` | `--version`, `-v` | `false` | Outputs the current installed version of `arnav-audit`. |

---

## System Architecture Diagram

The following diagram illustrates MEJOR's execution architecture: from terminal argument parsing, recursive directory traversal and binary filtering, to 4-pillar rule evaluation, AI prompt compilation, and CI exit-code dispatch.

*Figure 1: High-level architectural flowchart of the MEJOR auditing engine.*
```mermaid
flowchart TD
    classDef highlight fill:#00f5a0,stroke:#00a36c,stroke-width:2px,color:#0f1515;
    classDef standard fill:#1e293b,stroke:#475569,stroke-width:1px,color:#f8fafc;

    CLI[CLI Entry Point<br/>bin/cli.js]:::standard
    ARGS[Argument & Flag Parser<br/>Options & Filter Resolver]:::standard

    subgraph Traversal["File Discovery & Ingestion"]
        WALKER[Recursive Directory Walker<br/>walkDir Function]:::standard
        FILTER[Binary & Ignore Filter<br/>Skips .git, node_modules, 4MB+ blobs]:::standard
        STREAM[File Stream Reader<br/>fs.readFileSync UTF-8]:::standard
    end

    subgraph AuditEngine["4-Pillar AST & Regex Engine"]
        PILLAR1[Pillar 1: Secret Gateways<br/>DB URIs, JWTs, Cloud API Keys]:::highlight
        PILLAR2[Pillar 2: Backend Security<br/>SQLi, RCE, SSRF, Debug Flags]:::highlight
        PILLAR3[Pillar 3: Memory Leakage<br/>React Hooks, Timers, Window Pollution]:::highlight
        PILLAR4[Pillar 4: Invisible UI/UX<br/>iOS Zoom, A11y, Touch Latency]:::highlight
    end

    subgraph Aggregation["Accumulation & Formatting"]
        FINDINGS[Finding Accumulator<br/>Coordinate & Severity Indexer]:::standard
        AI_SYNTH[AI Remediation Synthesizer<br/>Cursor & Claude Code Prompts]:::highlight
        REPORTER[Output Dispatcher<br/>ANSI Terminal / JSON Stream]:::standard
        GATEKEEPER[CI Quality Gatekeeper<br/>Exit Code 0 vs Exit Code 1]:::standard
    end

    CLI --> ARGS
    ARGS --> WALKER
    WALKER --> FILTER
    FILTER --> STREAM

    STREAM --> PILLAR1
    STREAM --> PILLAR2
    STREAM --> PILLAR3
    STREAM --> PILLAR4

    PILLAR1 --> FINDINGS
    PILLAR2 --> FINDINGS
    PILLAR3 --> FINDINGS
    PILLAR4 --> FINDINGS

    FINDINGS --> AI_SYNTH
    FINDINGS --> REPORTER
    FINDINGS --> GATEKEEPER
```

---

## Core Workflow Sequence Diagram

The following sequence diagram outlines the end-to-end execution lifecycle of `arnav-audit`, showing how file streams are evaluated and how exit codes are determined during local scans and CI runs.

*Figure 2: Execution sequence diagram of the audit scanner and report generation.*
```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / CI Pipeline
    participant CLI as CLI Orchestrator
    participant Walker as File Walker & Filter
    participant Reader as File Stream Reader
    participant Rules as 4-Pillar Rule Engine
    participant PromptGen as AI Prompt Compiler
    participant Console as Terminal / JSON Output

    Dev->>CLI: Execute arnav-audit [target] [--flags]
    CLI->>CLI: Parse arguments & configure rule masks
    CLI->>Walker: Traverse target directory
    Walker->>Walker: Filter ignored paths (.git, node_modules) & binary files
    Walker-->>CLI: Return filtered file manifest

    loop For each candidate file
        CLI->>Reader: Read file contents (fs.readFileSync)
        Reader-->>Rules: Stream text content
        Rules->>Rules: Evaluate regex patterns & custom AST check functions
        alt Rule Match Found
            Rules-->>CLI: Record finding (File, Line, Rule ID, Severity, Remedy)
        end
    end

    alt --prompts flag enabled
        CLI->>PromptGen: Synthesize structured fix prompts for findings
        PromptGen-->>CLI: Formatted AI agent prompt block
    end

    CLI->>Console: Render ANSI summary or JSON stream
    alt Critical Findings > 0
        CLI-->>Dev: Process exit code 1 (Build Failed)
    else Clean or Minor Findings Only
        CLI-->>Dev: Process exit code 0 (Build Passed)
    end
```

---

## Key Decision/Logic Flow: Vulnerability Gating & Severity Evaluation

The following Raptor-style decision flowchart outlines the step-by-step logic used by MEJOR to inspect files, suppress false positives, assign severity tiers, and trigger CI build failures.

*Figure 3: Raptor-style deterministic decision flowchart for rule gating and CI quality failure.*
```mermaid
flowchart TD
    classDef highlight fill:#00f5a0,stroke:#00a36c,stroke-width:2px,color:#0f1515;
    classDef standard fill:#1e293b,stroke:#475569,stroke-width:1px,color:#f8fafc;
    classDef terminal fill:#f43f5e,stroke:#e11d48,stroke-width:2px,color:#ffffff;
    classDef pass fill:#10b981,stroke:#059669,stroke-width:2px,color:#ffffff;

    START([Target Path Discovered]):::standard
    BIN_CHECK{Is Binary or<br/>Size > 4MB?}:::standard
    SKIP[Skip File from Scan]:::standard
    READ[Read UTF-8 Content]:::standard
    APPLIES_CHECK{File Extension Matches<br/>Rule Target?}:::standard
    EVAL_RULE{Regex Match or Custom<br/>AST Condition Met?}:::standard
    FALSE_POS{Is Test File and<br/>Rule Ignores Tests?}:::standard
    LOG_FINDING[Log Finding to Registry<br/>Record Line Number & Match]:::highlight
    SEV_CHECK{Finding Severity<br/>Tier?}:::standard
    TIER_CRIT[Increment Critical Count<br/>SEC-GATEWAYS / SQLi / RCE]:::terminal
    TIER_MAJ[Increment Major Count<br/>Memory Leaks / SSRF / CORS]:::standard
    TIER_MIN[Increment Minor Count<br/>UI Traps / Console Logs]:::standard
    MORE_FILES{More Files in<br/>Queue?}:::standard
    CI_GATE{Critical Count > 0?}:::standard
    FAIL_BUILD([Exit Code 1: CI Build Failed]):::terminal
    PASS_BUILD([Exit Code 0: Quality Gate Passed]):::pass

    START --> BIN_CHECK
    BIN_CHECK -- Yes --> SKIP
    BIN_CHECK -- No --> READ
    READ --> APPLIES_CHECK

    APPLIES_CHECK -- No --> MORE_FILES
    APPLIES_CHECK -- Yes --> EVAL_RULE

    EVAL_RULE -- No --> MORE_FILES
    EVAL_RULE -- Yes --> FALSE_POS

    FALSE_POS -- Yes --> SKIP
    FALSE_POS -- No --> LOG_FINDING

    LOG_FINDING --> SEV_CHECK
    SEV_CHECK -- CRITICAL --> TIER_CRIT
    SEV_CHECK -- MAJOR --> TIER_MAJ
    SEV_CHECK -- MINOR --> TIER_MIN

    TIER_CRIT --> MORE_FILES
    TIER_MAJ --> MORE_FILES
    TIER_MIN --> MORE_FILES

    MORE_FILES -- Yes --> START
    MORE_FILES -- No --> CI_GATE

    CI_GATE -- Yes --> FAIL_BUILD
    CI_GATE -- No --> PASS_BUILD
```

---

## Database / Entity Relationship Diagram

While MEJOR operates statelessly in the terminal, its internal memory architecture organizes entities into an object data model for JSON serialization and reporting.

*Figure 4: Entity-Relationship diagram illustrating MEJOR's internal audit data model.*
```mermaid
erDiagram
    AUDIT_SCANS ||--o{ SCANNED_FILES : inspects
    AUDIT_SCANS ||--o{ SECURITY_FINDINGS : aggregates
    SCANNED_FILES ||--o{ SECURITY_FINDINGS : contains
    VULNERABILITY_RULES ||--o{ SECURITY_FINDINGS : classifies
    SECURITY_FINDINGS ||--o{ REMEDIATION_PROMPTS : generates

    AUDIT_SCANS {
        string scan_id PK
        string target_path
        int total_files_scanned
        int total_findings
        int critical_count
        int major_count
        int minor_count
        int execution_duration_ms
        int exit_code
        timestamp scanned_at
    }

    SCANNED_FILES {
        string file_path PK
        string file_extension
        int file_size_bytes
        int lines_of_code
        boolean is_binary
    }

    VULNERABILITY_RULES {
        string rule_id PK
        string pillar
        string severity_tier
        string title
        string description
        string remediation_advice
    }

    SECURITY_FINDINGS {
        string finding_id PK
        string scan_id FK
        string file_path FK
        string rule_id FK
        int line_number
        text matched_content
        string severity
    }

    REMEDIATION_PROMPTS {
        string prompt_id PK
        string finding_id FK
        string target_ai_assistant
        text prompt_text
    }
```

---

## Core Algorithm/Logic Explanation

MEJOR avoids heavy external parsers by using an optimized three-stage scanning pipeline:

1. **Pre-Filtering & Byte Ingestion**: Files are inspected for binary null bytes (`0x00`) within the first 512 bytes. Files exceeding 4MB or matching ignored directories (`node_modules`, `.git`, `venv`, `coverage`) are dropped immediately, eliminating disk thrashing.
2. **Context-Aware Rule Execution**: Rules execute regular expressions or targeted AST checks against in-memory UTF-8 buffers. Rules marked with `ignoreInTests: true` automatically skip mock files and unit tests, avoiding spurious flags.
3. **Severity Weighting & Prompt Assembly**: Each match is classified into `CRITICAL`, `MAJOR`, or `MINOR`. When the `--prompts` flag is provided, the engine extracts surrounding lines, packages the remediation advice, and synthesizes a structured prompt formatted for Cursor, Claude Code, and Antigravity.

*Figure 5: Input signals converging into the audit decision and prompt output.*
```mermaid
flowchart LR
    classDef highlight fill:#00f5a0,stroke:#00a36c,stroke-width:2px,color:#0f1515;
    classDef standard fill:#1e293b,stroke:#475569,stroke-width:1px,color:#f8fafc;

    SOURCE[Source Code Streams]:::standard
    RULES[4-Pillar Rule Definitions]:::standard
    TEST_FILTER[Test & Fixture Filters]:::standard
    CLI_FLAGS[CLI Execution Flags]:::standard

    ENGINE[Audit & Severity Engine<br/>arnav-audit Core]:::highlight

    OUTPUT[Terminal Report / JSON<br/>+ AI Fix Prompts + Exit Code]:::standard

    SOURCE --> ENGINE
    RULES --> ENGINE
    TEST_FILTER --> ENGINE
    CLI_FLAGS --> ENGINE
    ENGINE --> OUTPUT
```

---

## Error Handling table

| Exit Code / Error | Condition | Description | Remediation |
| :--- | :--- | :--- | :--- |
| `0` (Success) | Scan Clean | No critical security breaches or credential leaks discovered. | Proceed with build or deployment pipeline. |
| `1` (Audit Failure) | Critical Finding | One or more `CRITICAL` severity findings detected (DB URIs, JWT keys, SQLi, RCE). | Inspect findings, apply remediation, or run `--prompts` to fix via AI. |
| `2` (Argument Error) | Invalid Flag / Path | Target directory does not exist or unparseable argument supplied. | Verify target directory path and review `arnav-audit --help`. |
| `EACCES` | Permission Denied | Node.js process lacks read permissions for target file or directory. | Run terminal with appropriate filesystem read permissions. |
| `ERR_MAX_SIZE` | Oversized Bundle | Individual file exceeds 4MB internal buffer limit. | File is automatically skipped; add minified bundles to `.gitignore`. |

---

## Testing

Run unit tests and verify CLI execution across the test suite:

```bash
# Run CLI unit tests
npm test

# Audit the scanner's own codebase
node bin/cli.js .

# Verify help and version flags
node bin/cli.js --help
node bin/cli.js --version
```

---

## Design Philosophy

1. **Zero External Dependencies**: The scanner must run instantly on any machine with Node.js installed, eliminating npm supply-chain vulnerabilities.
2. **Sub-Second Execution**: A quality gate that takes minutes to run will be disabled by developers. MEJOR completes full audits in under 500ms.
3. **Actionable Fixes Over Abstract Reports**: Highlighting a vulnerability without providing a concrete fix wastes engineering time. MEJOR generates ready-to-run AI prompts.
4. **Zero False-Positive Toleration**: Test directories and legitimate environment variables are respected so developers never suffer alert fatigue.

---

## Roadmap

- [ ] **GitHub Action Marketplace Action**: One-line GitHub Actions step for pull request security checks.
- [ ] **SARIF Format Export**: Native support for OASIS Static Analysis Results Interchange Format for GitHub Advanced Security.
- [ ] **Custom Rule Configuration**: Support for `.mejorrc.yaml` defining team-specific regex patterns and custom exclusions.
- [ ] **Language Server Protocol (LSP)**: In-editor real-time squiggly warnings for VS Code and Cursor.

---

## Author / Contributors

- **Arnav Singh** ([@arnnnnaaavvvvv](https://github.com/arnnnnaaavvvvv)) — Lead Architect & Maintainer
- **MEJOR Contributors**

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
