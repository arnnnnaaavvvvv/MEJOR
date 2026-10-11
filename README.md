# MEJOR
> **Lightweight developer security and code quality scanner with zero dependencies and AI-assisted remediation.**

[![npm version](https://img.shields.io/npm/v/arnav-audit.svg?color=00f5a0)](https://www.npmjs.com/package/arnav-audit)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js: >=16](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-blue.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/arnnnnaaavvvvv/MEJOR)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-orange.svg)](https://github.com/arnnnnaaavvvvv/MEJOR)
[![GitHub Repository](https://img.shields.io/badge/GitHub-arnnnnaaavvvvv%2FMEJOR-00f5a0.svg?logo=github)](https://github.com/arnnnnaaavvvvv/MEJOR)

🌐 **Package Registry**: [https://www.npmjs.com/package/arnav-audit](https://www.npmjs.com/package/arnav-audit) • **Web Dashboard**: [https://mejor.vercel.app](https://mejor.vercel.app)

---

## Overview

**MEJOR** (`arnav-audit`) is a lightweight, zero-dependency developer security and code quality scanner designed to run in local development environments and CI pull-request checks. Rather than functioning as a replacement for comprehensive enterprise SAST suites or formal penetration testing, MEJOR operates as an instant, developer-first quality gate—providing immediate feedback during active coding and pre-commit phases in under 500 milliseconds. The scanner combines targeted regular-expression signatures with custom syntactic checks across four focused pillars: (1) **Secret Gateways & Credentials** (unencrypted database URIs, JWT signing keys, cloud API keys, private keys), (2) **Backend Vulnerabilities** (production debug mode, SQL query string formatting injection, command injection vectors, unvalidated SSRF URLs, disabled TLS validation), (3) **Runtime Memory & Resource Leaks** (Python mutable defaults, React hooks with missing `removeEventListener` cleanups, un-cleared interval timers), and (4) **Mobile UI/UX Traps** (iOS 16px auto-zoom triggers, missing keyboard focus rings, flexbox SVG collapse). When issues are discovered, MEJOR synthesizes structured remediation prompt blocks tailored for AI coding assistants (Cursor, Claude Code, and Antigravity) to accelerate developer fixes.

---

## Feature Table

| Feature | Description |
| :--- | :--- |
| **Zero-Dependency Core** | Built purely on Node.js standard libraries (`fs`, `path`, `crypto`); installs in seconds without bloated dependency trees or supply-chain overhead. |
| **Developer-First Quality Gate** | Runs in sub-second timeframes (< 500ms) locally or in pre-commit hooks, giving engineers immediate feedback before pushing code. |
| **Secret Gateway Detection** | Flags hardcoded database connection URIs (`postgresql://`, `mongodb+srv://`, `redis://`), JWT signing secrets, cloud provider keys, and committed private keys. |
| **Common Backend Vulnerability Checks** | Catches SQL query string interpolation, un-sanitized shell execution (`shell=True`, `child_process.exec`), permissive CORS with credentials, and debug flags. |
| **Syntactic Memory Leak Heuristics** | Identifies React `useEffect` hooks missing teardown callbacks, un-cleared intervals, window pollution, and Python mutable default arguments. |
| **Mobile & Accessibility Trap Linter** | Spots CSS patterns that degrade usability, such as form input font sizes below 16px triggering iOS Safari zoom and suppressed focus rings (`outline: none`). |
| **AI-Assisted Remediation Prompts** | Automatically compiles structured fix prompts (`--prompts` / `--fix`) containing file coordinates, matched snippets, and drop-in fixes for AI coding tools. |
| **Deterministic CI Exit Codes** | Emits standard status codes (`0` for clean runs, `1` for critical breaches), making it simple to enforce quality gates in GitHub Actions. |
| **Rapid Stream-Based File Walker** | Traverses codebases with low memory overhead, skipping binary blobs, lockfiles, hidden directories, and test fixtures automatically. |
| **Pillar-Specific Targeted Scans** | Offers granular flags (`--security-only`, `--backend-only`, `--leakage-only`, `--ui-only`) for focused development workflows. |

---

## What It Can Do Now

- **Run in Local Dev Loops with Zero Config**: Audits codebases immediately using `npx arnav-audit .` without installing heavy daemons, Docker images, or language servers.
- **Catch Committed Credentials Early**: Alerts developers before unencrypted database connection strings, JWT signing keys, or cloud secrets reach remote git remotes.
- **Inspect React Component Cleanups**: Detects `addEventListener` and `setInterval` invocations in `useEffect` hooks that lack proper unmount cleanup functions.
- **Flag Mobile Viewport Usability Defects**: Scans CSS and styling blocks for input font sizes under 16px to prevent unwanted iOS Safari viewport auto-zooming.
- **Generate Ready-to-Paste AI Prompts**: Formats detected issues into structured instructions that can be pasted directly into Cursor, Claude Code, or Antigravity for automated fixes.
- **Emit Machine-Readable JSON**: Outputs standard JSON payloads via `--json` for integration into custom developer tooling, status dashboards, or CI pipelines.
- **Support Multi-Language Codebases**: Inspects JavaScript, TypeScript, Python, HTML, CSS, JSON, and YAML files in a single unified run.

---

## The Problem

| Dimension | Enterprise SAST Platforms (SonarQube, Snyk) | Generic Language Linters (ESLint, Flake8) | Manual Code Reviews | MEJOR (`arnav-audit`) |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Role** | In-depth interprocedural analysis, organizational governance, and enterprise compliance. | Language syntax, code style conventions, and basic best-practice enforcement. | Human architecture evaluation and business logic validation. | **Fast, developer-facing pre-commit scanner and code quality gate with AI fix prompts.** |
| **Setup & Footprint** | Heavy JVM / Docker runtimes, database backends, and cloud coordination. | Per-language configurations (`.eslintrc`, `.flake8`) and plugin ecosystems. | None, but consumes significant engineering hours and review turnaround time. | **Zero dependencies. Single self-contained Node.js script with zero configuration needed.** |
| **Feedback Latency** | 2 to 10+ minutes during CI build jobs; slow for local interactive iteration. | Fast for individual files; often fragmented across separate tools for JS and Python. | Hours to days depending on reviewer availability. | **Instant (< 500ms) whole-project scans suited for local pre-commit hooks.** |
| **Detection Scope** | Deep taint tracking and multi-file dataflow analysis across code paths. | Single-language lint rules; blind to cross-stack secrets or mobile viewport traps. | Variable; dependent on individual reviewer vigilance. | **Focused 4-pillar pattern checks: secrets, backend risks, lifecycle leaks, and mobile UI traps.** |
| **Fix Workflow** | Static documentation links or general advisory notes. | Inline lint errors with limited automatic fixing for stylistic issues. | Comment threads with manual fix suggestions. | **Pre-compiled prompt blocks formatted for AI coding assistants (Cursor, Claude Code, Antigravity).** |

> *Note: MEJOR is designed to complement—not replace—formal enterprise SAST solutions and manual security reviews. It empowers developers to catch common vulnerabilities and anti-patterns immediately at the workstation before code enters deeper CI pipelines.*

---

## Get Started

### Prerequisites
- **Node.js**: v16.0.0 or higher
- **npm** (comes bundled with Node.js)

### 1. Installation Options
Run `arnav-audit` instantly without installation or install it globally:

```bash
# Option A: Zero-install execution via npx (Recommended for quick scans)
npx arnav-audit .

# Option B: Global installation from npm
npm install -g arnav-audit

# Option C: Direct installation from GitHub repository
npm install -g github:arnnnnaaavvvvv/MEJOR
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

    subgraph AuditEngine["4-Pillar Pattern & Lifecycle Engine"]
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
        Rules->>Rules: Evaluate regex signatures & syntactic lifecycle checks
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
    EVAL_RULE{Regex Match or Custom<br/>Syntactic Condition Met?}:::standard
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

MEJOR avoids heavy parsing runtimes by utilizing an optimized, stream-based three-stage scanning pipeline:

1. **Pre-Filtering & Byte Inspection**: Files are inspected for null bytes (`0x00`) within the first 512 bytes to rapidly detect binaries. Files exceeding 4MB or matching ignored directories (`node_modules`, `.git`, `venv`, `coverage`) are skipped immediately to prevent unnecessary disk reads.
2. **Targeted Signature & Syntactic Check Execution**: Candidate text files are evaluated against targeted regular expression patterns and custom syntactic lifecycle checks. For example, the `LEAK-EVENT-LISTENER` check evaluates React files containing `addEventListener` inside `useEffect` and flags components where `removeEventListener` is absent from the cleanup callback. Rules with `ignoreInTests: true` automatically skip test files, suppressing false positives.
3. **Severity Classification & Prompt Assembly**: Findings are classified into `CRITICAL`, `MAJOR`, or `MINOR`. When `--prompts` is supplied, the engine packages the exact file path, line numbers, and remediation guidance into ready-to-run prompt templates formatted for Cursor, Claude Code, and Antigravity.

*Figure 5: Input signals converging into the audit decision and prompt output.*
```mermaid
flowchart LR
    classDef highlight fill:#00f5a0,stroke:#00a36c,stroke-width:2px,color:#0f1515;
    classDef standard fill:#1e293b,stroke:#475569,stroke-width:1px,color:#f8fafc;

    SOURCE[Source Code Streams]:::standard
    RULES[Regex Signatures & Custom Checks]:::standard
    TEST_FILTER[Test & Fixture Filters]:::standard
    CLI_FLAGS[CLI Execution Flags]:::standard

    ENGINE[Pattern & Lifecycle Engine<br/>arnav-audit Core]:::highlight

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

1. **Zero External Dependencies**: The scanner runs natively on standard Node.js without requiring third-party npm packages, eliminating installation overhead and supply-chain vulnerabilities.
2. **Sub-Second Execution**: A pre-commit check must run fast enough that developers never bypass it. MEJOR finishes scans in under 500ms.
3. **Actionable AI Fix Prompts**: Identifying an issue is only half the job; generating drop-in prompts for AI coding assistants lets engineers fix issues in seconds.
4. **Pragmatic Positioning**: MEJOR focuses on catching high-frequency mistakes early in local developer environments, serving as a rapid first line of defense alongside full SAST suites.

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
