# Automated UI/UX & Performance Auditor for "Vibe Coders"

An automated website UI/UX, responsive, and performance auditor built specifically for "vibe coders" (developers building sites with AI tools who lack visual design expertise).

Inputs a URL, crawls and executes real browser measurements, runs failure/chaos simulations, and outputs scored reports accompanied by **ready-to-use AI fix prompts for Cursor, Claude Code, and Antigravity**, as well as a consolidated **Master Remediation Prompt**.

---

## Key Differentiators

1. **Measurement-Backed Findings**: Every issue is grounded in concrete DOM metrics, bounding-box coordinates, CDP layout telemetry, and computed CSS values. The LLM only phrases actionable instructions; it never invents or hallucinates issues.
2. **Failure Lab & Chaos Simulation**: Automated injection of $+40\%$ pseudo-localized text lengths, numeric overflow, delayed responses (skeleton verification), and HTTP 500 API failures.
3. **Copy-Paste Fix Prompts**: Pre-compiled prompts with exact selectors, source file references, constraints, and acceptance tests.
4. **45+ Registered Checks**: Comprehensive catalog covering typography scales, off-grid spacing, 44px tap targets, contrast, CLS, longtasks, and dev leaks (`undefined`, `localhost`, `NaN`).
5. **Before/After Rescan & Diffing**: Compares consecutive scan runs, highlighting resolved vs persistent issues and score deltas.
6. **Transparent Coverage**: Reports exact coverage ("N of 200 checked automatically") alongside a guided Tier M manual verification checklist.

---

## Monorepo Architecture

```
├── apps/
│   ├── api/            # FastAPI REST & SSE Gateway (SSRF validation, rate limiting, DB)
│   ├── worker/         # Playwright background worker (CDP telemetry, simulations, checks)
│   └── web/            # Next.js 14 frontend (Tailwind CSS, App router, score dials)
├── packages/
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

## Quickstart

### Option A: Using Docker Compose (Recommended)

To spin up all services (PostgreSQL 16 with pgvector, Redis 7.2, FastAPI backend, Playwright worker, and Next.js frontend):

```bash
docker-compose up --build
```

- Web UI: `http://localhost:3000`
- API Gateway & Swagger Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

---

### Option B: Local Standalone Development (Without Docker)

The backend natively supports SQLite and in-memory pub/sub if PostgreSQL/Redis are not installed locally.

#### 1. Setup Python Backend & Worker
```bash
# Install dependencies
pip install -r requirements.txt
playwright install chromium ffmpeg

# Run API Server (Terminal 1)
uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload

# Run Playwright Worker Daemon (Terminal 2)
python -m apps.worker.worker
```

#### 2. Setup Next.js Frontend
```bash
# Run Web Dashboard (Terminal 3)
npm run dev --prefix apps/web
```
Open `http://localhost:3000` in your browser.

---

## Demo Seed Data & Seeded Fixture

To seed the database with an initial baseline scan and a comparative rescan:
```bash
python scripts/seed_demo.py
```
This seeds:
- **Baseline Scan** (`demo-base-scan-001`): Score `68.5` (Grade `C`) with mobile tap target and dev leak defects.
- **Rescan Diff** (`demo-rescan-diff-002`): Score `94.0` (Grade `A`), demonstrating a $+25.5$ score delta and resolving all critical defects.

View the seeded report at: `http://localhost:3000/scans/demo-base-scan-001`

---

## Running the Automated Test Suite

All tests across every phase are fully automated:

```bash
# Phase 1: Foundation (SSRF, Database, Health)
pytest tests/test_phase1_foundation.py -v

# Phase 2: Scanner (Playwright Crawl, Telemetry, Viewports)
pytest tests/test_phase2_scanner.py -v

# Phase 3: Check Registry (45+ checks verification)
pytest tests/test_phase3_registry.py -v

# Phase 5: Scoring & Prompt Compilation
pytest tests/test_phase5_scoring_prompts.py -v

# Phase 6: API Lifecycle (Endpoints, SSE, Badges)
pytest tests/test_phase6_api.py -v

# Differential Rescan & Fixture Defect Verification
pytest tests/test_diff_and_fixture.py -v
```
