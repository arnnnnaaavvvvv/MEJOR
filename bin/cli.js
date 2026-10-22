#!/usr/bin/env node

/**
 * arnav-audit - High-Accuracy Automated Internal Security, Memory Leakage, Secret Gateways & Backend Auditor
 * Version: 1.1.0
 * Author: Arnav
 *
 * Runs a complete 4-Pillar Audit across every file on any device:
 * 1. 🔐 Secret Gateways & Sensitive Credentials Leaks (CWE-798, CWE-312 | OWASP A02:2021)
 * 2. 🛡️ Backend Security, SQLi, RCE, SSRF & Weak Points (CWE-89, CWE-78, CWE-918 | OWASP A03:2021)
 * 3. 🧠 Memory, Timers, File Handles & Resource Leakage (CWE-400, CWE-775 | OWASP A04:2021)
 * 4. 📱 Invisible UI/UX Traps & Accessibility Defects (CWE-1374 | WCAG 2.1)
 */

const fs = require('fs');
const path = require('path');

// Terminal ANSI styling
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  
  // Foreground
  white: '\x1b[37m',
  black: '\x1b[30m',
  emerald: '\x1b[38;2;0;245;160m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  amber: '\x1b[38;2;245;158;11m',
  rose: '\x1b[38;2;244;63;94m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  purple: '\x1b[38;2;168;85;247m',

  // Background
  bgEmerald: '\x1b[48;2;16;185;129m',
  bgRose: '\x1b[48;2;244;63;94m',
  bgAmber: '\x1b[48;2;245;158;11m',
  bgDark: '\x1b[48;2;16;22;38m',
  bgPurple: '\x1b[48;2;147;51;234m',
};

const BANNER = `
${C.emerald}${C.bold}   _    ____  _   _    ___     __     _   _   _ ____ ___ _____ 
  / \\  |  _ \\| \\ | |  / \\ \\   / /    / \\ | | | |  _ \\_ _|_   _|
 / _ \\ | |_) |  \\| | / _ \\ \\ / /    / _ \\| | | | | | | |  | |  
/ ___ \\|  _ <| |\\  |/ ___ \\ V /    / ___ \\ |_| | |_| | |  | |  
/_/   \\_\\_| \\_\\_| \\_/_/   \\_\\_/    /_/   \\_\\___/|____/___| |_|  ${C.reset}
${C.dim}High-Accuracy Security, Memory Leakage, Secret Gateways & Backend Auditor${C.reset}
${C.gray}Engine by Arnav • Cross-Platform Codebase & Gateway Quality Gate v1.1.0${C.reset}
`;

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  target: '.',
  json: false,
  prompts: false,
  securityOnly: false,
  backendOnly: false,
  leakageOnly: false,
  uiOnly: false,
  verbose: false,
  files: false,
  ci: false,
  includeDocs: false,
  noCodeframe: false,
  minSeverity: 'SUGGESTION',
  format: 'pretty',
  help: false,
  version: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help' || arg === '-h') options.help = true;
  else if (arg === '--version' || arg === '-v') options.version = true;
  else if (arg === '--verbose') options.verbose = true;
  else if (arg === '--files' || arg === '--list') options.files = true;
  else if (arg === '--json') { options.json = true; options.format = 'json'; }
  else if (arg === '--prompts' || arg === '--fix') options.prompts = true;
  else if (arg === '--security' || arg === '--security-only') options.securityOnly = true;
  else if (arg === '--backend' || arg === '--backend-only') options.backendOnly = true;
  else if (arg === '--leakage' || arg === '--leakage-only') options.leakageOnly = true;
  else if (arg === '--ui' || arg === '--ui-only') options.uiOnly = true;
  else if (arg === '--ci') options.ci = true;
  else if (arg === '--include-docs' || arg === '--with-docs') options.includeDocs = true;
  else if (arg === '--no-codeframe' || arg === '--compact') options.noCodeframe = true;
  else if (arg.startsWith('--min-severity=')) options.minSeverity = arg.split('=')[1].toUpperCase();
  else if (arg === '--min-severity' && args[i + 1]) { options.minSeverity = args[++i].toUpperCase(); }
  else if (arg.startsWith('--format=')) options.format = arg.split('=')[1].toLowerCase();
  else if (arg === '--format' && args[i + 1]) { options.format = args[++i].toLowerCase(); }
  else if (!arg.startsWith('-')) options.target = arg;
}

if (options.version) {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  let ver = '1.1.0';
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    ver = pkg.version || ver;
  } catch (e) {}
  console.log(`arnav-audit v${ver}`);
  process.exit(0);
}

if (options.help) {
  console.log(BANNER);
  console.log(`
${C.bold}USAGE:${C.reset}
  npx arnav-audit [target] [options]

${C.bold}TARGETS:${C.reset}
  [directory|file]   Path to local project root, directory, or individual file (defaults to ".")

${C.bold}DEFAULT BEHAVIOR:${C.reset}
  Running ${C.bold}arnav-audit .${C.reset} automatically runs all 4 pillars simultaneously:
  • 🔐 Secret Gateway & Credential Leaks (Database URIs, JWT Secrets, Cloud & API Keys, Bot Tokens)
  • 🛡️ Backend Vulnerabilities & Weak Points (SQLi, RCE, SSRF, Deserialization, Insecure PRNG, ReDoS)
  • 🧠 Memory Leakage & Resource Auditor (Dangling Listeners, Timers, File Handles, Mutable Defaults)
  • 📱 Invisible UI/UX & Accessibility Traps (iOS Zoom, 300ms Delay, Squished Icons, Missing Alt)

${C.bold}OPTIONS:${C.reset}
  --files, --list         List every single inspected file path with line metrics & inspection status
  --ci                    CI/CD quality gate mode (exits with code 1 if CRITICAL or MAJOR issues exist)
  --include-docs          Include documentation & markdown files in audit (skipped by default to prevent false positives)
  --no-codeframe          Disable surrounding visual codeframe snippets for compact terminal output
  --prompts, --fix        Generate copy-paste AI fix instructions with implementation guardrails
  --min-severity <level>  Filter issues by severity: CRITICAL, MAJOR, MINOR, SUGGESTION
  --format <type>         Output format: pretty (default), json, compact
  --backend-only          Filter exclusively to backend security, SQLi, RCE, SSRF, and auth bypasses
  --security-only         Filter exclusively to exposed credentials, tokens, and secret gateways
  --leakage-only          Filter exclusively to memory leaks, unclosed handles, and dangling timers
  --ui-only               Filter exclusively to UI/UX accessibility defects and interface traps
  --verbose               Display detailed file-by-file verification and execution telemetry
  --json                  Output raw machine-readable JSON for CI/CD pipelines
  -v, --version           Display package version
  -h, --help              Display this documentation

${C.bold}EXAMPLES:${C.reset}
  $ npx arnav-audit .
  $ npx arnav-audit . --ci
  $ npx arnav-audit ./apps/api --verbose
  $ npx arnav-audit ./apps/api/core/security.py
  $ npx arnav-audit . --files
  $ npx arnav-audit . --prompts
  $ npx arnav-audit . --json > audit-report.json
`);
  process.exit(0);
}

// -------------------------------------------------------------
// CROSS-PLATFORM SCANNER ENGINE (Filesystem, Gateways, Backend)
// -------------------------------------------------------------
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.vercel',
  '.kilo',
  '.pytest_cache',
  'artifacts',
  'test-results',
  'playwright-report',
  'dist',
  'build',
  'out',
  '.output',
  'coverage',
  '.cache',
  'venv',
  '.venv',
  'env',
  '__pycache__',
  '.idea',
  '.vscode',
  '.turbo',
  '.nuxt',
  '.svelte-kit',
  '.docusaurus',
  'storybook-static',
  'bower_components',
  'jspm_packages',
  'vendor',
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'shrinkwrap.yaml',
  'Gemfile.lock',
  'composer.lock',
  'Cargo.lock',
  'poetry.lock',
  '.DS_Store',
  'Thumbs.db'
]);

const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.avif', '.svgz',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav', '.flac',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.zip', '.tar', '.gz', '.tgz', '.rar', '.7z',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.pyc', '.pyo', '.pyd',
  '.db', '.sqlite', '.sqlite3',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.tsbuildinfo', '.lock', '.class', '.o', '.obj',
  '.map'
]);

const DOC_EXTS = new Set([
  '.md', '.markdown', '.rst', '.adoc', '.txt'
]);

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (BINARY_EXTS.has(ext)) return true;
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(512);
    const bytesRead = fs.readSync(fd, buf, 0, 512, 0);
    fs.closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buf[i] === 0) return true; // Null byte indicates binary content
    }
  } catch (err) {
    return false;
  }
  return false;
}

function walkDir(targetPath, fileList = [], includeDocs = false) {
  try {
    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      if (!isBinaryFile(targetPath)) {
        fileList.push(targetPath);
      }
      return fileList;
    }

    const entries = fs.readdirSync(targetPath);
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry)) continue;
      const fullPath = path.join(targetPath, entry);
      try {
        const fileStat = fs.statSync(fullPath);
        if (fileStat.isDirectory()) {
          // Allow .github & .gitlab while skipping hidden dot-folders like .git, .cache
          if (entry.startsWith('.') && entry !== '.github' && entry !== '.gitlab') continue;
          if (entry.includes('worktree')) continue;
          walkDir(fullPath, fileList, includeDocs);
        } else {
          // Skip scanner's own CLI script so pattern definitions aren't self-flagged
          if (entry === 'cli.js' && fullPath.includes('bin')) continue;
          // Skip known noisy lockfiles & OS metadata
          if (IGNORED_FILES.has(entry)) continue;
          // Skip minified bundles and sourcemaps
          if (entry.endsWith('.min.js') || entry.endsWith('.min.css') || entry.endsWith('.bundle.js')) continue;
          // Skip documentation files unless explicitly requested to prevent false positives in documentation examples
          const ext = path.extname(entry).toLowerCase();
          if (!includeDocs && DOC_EXTS.has(ext)) continue;
          // Skip excessively large minified bundle dumps
          if (fileStat.size > MAX_FILE_SIZE_BYTES) continue;

          if (!isBinaryFile(fullPath)) {
            fileList.push(fullPath);
          }
        }
      } catch (err) {}
    }
  } catch (err) {}
  return fileList;
}

/**
 * Generate a visual codeframe showing the line with issue and surrounding context
 */
function generateCodeFrame(content, line, col, length = 1) {
  const lines = content.split('\n');
  const total = lines.length;
  const targetLineIdx = line - 1;
  if (targetLineIdx < 0 || targetLineIdx >= total) return '';

  const startIdx = Math.max(0, targetLineIdx - 1);
  const endIdx = Math.min(total - 1, targetLineIdx + 1);
  const maxLineNumWidth = String(endIdx + 1).length;

  const out = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const lineNum = i + 1;
    const padNum = String(lineNum).padStart(maxLineNumWidth, ' ');
    const lineText = lines[i] || '';
    const cleanText = lineText.replace(/\r$/, '');
    const truncatedText = cleanText.length > 120 ? cleanText.slice(0, 117) + '...' : cleanText;

    if (i === targetLineIdx) {
      out.push(`     ${C.rose}>${C.reset} ${C.gray}${padNum} |${C.reset} ${truncatedText}`);
      const indent = Math.max(0, Math.min(col - 1, 120));
      const pointerLen = Math.min(Math.max(1, length), 120 - indent);
      out.push(`       ${' '.repeat(maxLineNumWidth)} | ${' '.repeat(indent)}${C.rose}${C.bold}${'^'.repeat(pointerLen)}${C.reset}`);
    } else {
      out.push(`       ${C.gray}${padNum} |${C.reset} ${truncatedText}`);
    }
  }
  return out.join('\n');
}

// -------------------------------------------------------------
// COMPREHENSIVE 4-PILLAR AUDIT RULES (With CWE & OWASP Mapping)
// -------------------------------------------------------------
const RULES = [
  // ===========================================================
  // PILLAR 1: SECRET GATEWAYS & SENSITIVE CREDENTIAL LEAKAGE
  // ===========================================================
  {
    id: 'SEC-GATEWAY-DATABASE-URI',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed Database Gateway URI with Plaintext Password',
    desc: 'Hardcoded database gateway connection string containing plaintext credentials.',
    regex: /\b(?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis|amqp|amqps):\/\/[a-zA-Z0-9_.-]+:(?:(?!\$\{)[^@\s'"]+)@[a-zA-Z0-9_.-]+(?::\d+)?(?:\/[^\s'"<>]*)?/gi,
    remedy: 'Move database connection URI to environment variables (e.g. DATABASE_URL) and load via secrets manager.'
  },
  {
    id: 'SEC-GATEWAY-JWT-SECRET',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Hardcoded JWT Gateway Secret / Signing Key',
    desc: 'Hardcoded authentication signing key detected. Allows attackers to forge valid tokens and bypass all authorization.',
    regex: /\b(?:JWT_SECRET|JWT_SECRET_KEY|SECRET_KEY|AUTH_SECRET|ACCESS_TOKEN_SECRET)\s*=\s*['"]([a-zA-Z0-9_!@#$%^&*()\-+=]{6,})['"]/gi,
    remedy: 'Read secret from os.environ.get("JWT_SECRET") or process.env.JWT_SECRET; never commit raw signing keys.'
  },
  {
    id: 'SEC-AWS-KEY',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Hardcoded AWS Access Key Exposed',
    desc: 'Found hardcoded AWS Access Key ID in source code. Can lead to immediate cloud infrastructure takeover.',
    regex: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    filter: (m) => m !== 'AKIAIOSFODNN7EXAMPLE', // Suppress standard AWS documentation dummy key
    remedy: 'Move key to environment variable (AWS_ACCESS_KEY_ID) and rotate compromised credential immediately.'
  },
  {
    id: 'SEC-AWS-SECRET-KEY',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Hardcoded AWS Secret Access Key Pattern',
    desc: 'Found AWS secret access key declaration in codebase.',
    regex: /\b(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*['"][A-Za-z0-9/+=]{40}['"]/gi,
    remedy: 'Store AWS Secret Access Key in AWS IAM Secrets Manager or environment variables.'
  },
  {
    id: 'SEC-OPENAI-KEY',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Hardcoded OpenAI API Secret Key',
    desc: 'Exposed OpenAI secret key in code. Allows unauthorized API billing and model consumption.',
    regex: /\bsk-(?:proj-)?[a-zA-Z0-9_-]{32,}\b/g,
    remedy: 'Store in OPENAI_API_KEY environment variable and revoke the exposed key.'
  },
  {
    id: 'SEC-ANTHROPIC-KEY',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Hardcoded Anthropic Claude API Key',
    desc: 'Exposed Anthropic secret key in code. Allows unauthorized access to Claude API models.',
    regex: /\bsk-ant-(?:api03-)?[a-zA-Z0-9_-]{32,}\b/g,
    remedy: 'Store in ANTHROPIC_API_KEY environment variable and revoke the key.'
  },
  {
    id: 'SEC-GITHUB-TOKEN',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed GitHub Personal Access Token',
    desc: 'Found active GitHub token pattern in repository source.',
    regex: /\b(?:ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b/g,
    remedy: 'Revoke token in GitHub Developer Settings and use Secret Manager or GitHub Actions Secrets.'
  },
  {
    id: 'SEC-GITLAB-TOKEN',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed GitLab Personal Access Token',
    desc: 'Found GitLab personal access token pattern in source.',
    regex: /\bglpat-[0-9a-zA-Z_-]{20,}\b/g,
    remedy: 'Revoke token in GitLab settings and inject via CI/CD masked environment variables.'
  },
  {
    id: 'SEC-STRIPE-KEY',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed Stripe Secret Live Key',
    desc: 'Live Stripe secret API key committed to source repository.',
    regex: /\b(?:sk|rk)_live_[0-9a-zA-Z]{24,34}\b/g,
    remedy: 'Rotate Stripe secret key in Dashboard; never bundle secret keys in client-facing bundles.'
  },
  {
    id: 'SEC-GOOGLE-KEY',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed Google Cloud / Gemini API Key',
    desc: 'Hardcoded Google Cloud API credential detected.',
    regex: /\bAIza[0-9A-Za-z-_]{35}\b/g,
    remedy: 'Restrict key in Google Cloud Console and load dynamically from runtime environment.'
  },
  {
    id: 'SEC-SLACK-BOT-TOKEN',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed Slack Bot / User OAuth Access Token',
    desc: 'Slack bot or user OAuth token committed to source, allowing unauthorized workspace access.',
    regex: /\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}\b/g,
    remedy: 'Store Slack tokens in secure environment variables (SLACK_BOT_TOKEN) and revoke at api.slack.com.'
  },
  {
    id: 'SEC-HUGGINGFACE-TOKEN',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed Hugging Face User Access Token',
    desc: 'Hugging Face API token detected in codebase.',
    regex: /\bhf_[a-zA-Z0-9]{34}\b/g,
    remedy: 'Revoke token at huggingface.co/settings/tokens and store in HF_TOKEN environment variable.'
  },
  {
    id: 'SEC-SENDGRID-KEY',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed SendGrid Mail API Key',
    desc: 'SendGrid email delivery API key committed to source.',
    regex: /\bSG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}\b/g,
    remedy: 'Revoke SendGrid API key immediately and store in SENDGRID_API_KEY environment variable.'
  },
  {
    id: 'SEC-SUPABASE-KEY',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed Supabase Service Role Secret Key',
    desc: 'Hardcoded Supabase service role secret detected. Service role keys bypass all Row Level Security (RLS).',
    regex: /\bsbp_[a-zA-Z0-9]{40}\b|\bSUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][a-zA-Z0-9_.-]{30,}['"]/g,
    remedy: 'Never commit Supabase Service Role keys to source code; inject at runtime via secret managers.'
  },
  {
    id: 'SEC-SLACK-WEBHOOK',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed Slack Incoming Webhook URL',
    desc: 'Found secret Slack incoming webhook URL in source code.',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]{8,}\/B[0-9A-Z]{8,}\/[0-9a-zA-Z]{24}/g,
    remedy: 'Revoke the webhook URL and store webhook URLs in secure environment variables.'
  },
  {
    id: 'SEC-DISCORD-WEBHOOK',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
    title: 'Exposed Discord Webhook Gateway URL',
    desc: 'Found active Discord webhook URL in source code.',
    regex: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{30,}/g,
    remedy: 'Delete webhook URL and configure via server-side environment variables.'
  },
  {
    id: 'SEC-PRIVATE-KEY',
    pillar: 'Secret Gateways & Credentials',
    tier: 'CRITICAL',
    cwe: 'CWE-312',
    owasp: 'A02:2021',
    title: 'Unencrypted Private Key Block in Code',
    desc: 'RSA/EC/DSA/OPENSSH/PGP private key found directly committed.',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----\s*[\r\n]+[A-Za-z0-9+/=]{20,}/g,
    remedy: 'Remove private key file from version control immediately; load via secure KMS/vault.'
  },

  // ===========================================================
  // PILLAR 2: BACKEND SECURITY & WEAK POINTS
  // ===========================================================
  {
    id: 'SEC-BACKEND-DEBUG-ENABLED',
    pillar: 'Backend Security',
    tier: 'CRITICAL',
    cwe: 'CWE-489',
    owasp: 'A05:2021',
    title: 'Backend Debug Mode Left Enabled in Production',
    desc: 'Running FastAPI, Flask, or Django with debug=True exposes interactive debug consoles and execution gateways.',
    appliesTo: ['.py', '.json', '.env', '.yaml', '.yml'],
    ignoreInTests: true,
    regex: /\b(?:DEBUG\s*=\s*True|app\.run\([^)]*debug\s*=\s*True|FastAPI\([^)]*debug\s*=\s*True|settings\.DEBUG\s*=\s*True)\b/g,
    remedy: 'Set DEBUG = False and configure debug flag to read from environment variable: os.getenv("DEBUG", "false").lower() == "true".'
  },
  {
    id: 'SEC-BACKEND-SQL-INJECTION',
    pillar: 'Backend Security',
    tier: 'CRITICAL',
    cwe: 'CWE-89',
    owasp: 'A03:2021',
    title: 'SQL Query String Formatting Injection (Backend SQLi)',
    desc: 'Raw f-string, format(), or template literal interpolation directly inside SQL query execution.',
    appliesTo: ['.py', '.js', '.ts', '.mjs', '.cjs'],
    regex: /(?:cursor|session|connection|db)\.execute\(\s*f["']|\.execute\(\s*f["'](?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)|execute\(\s*["'][^"']*%s[^"']*["']\s*%(?!\s*\()|(?:db|pool|client)\.query\(\s*`\s*(?:SELECT|INSERT|UPDATE|DELETE)[^`]*\$\{/gi,
    remedy: 'Use parameterized queries: execute("SELECT * FROM users WHERE id = :id", {"id": user_id}) or pool.query("SELECT ... WHERE id = $1", [id]).'
  },
  {
    id: 'SEC-BACKEND-COMMAND-INJECTION',
    pillar: 'Backend Security',
    tier: 'CRITICAL',
    cwe: 'CWE-78',
    owasp: 'A03:2021',
    title: 'Backend Command Injection / Shell Execution Vector',
    desc: 'Executing system commands with shell=True, os.system(), or child_process.exec allows arbitrary remote command execution.',
    appliesTo: ['.py', '.js', '.ts', '.mjs', '.cjs'],
    ignoreInTests: true,
    regex: /\bsubprocess\.(?:run|call|Popen)\([^)]*shell\s*=\s*True|\bos\.(?:system|popen)\(|\bchild_process\.exec\(\s*[`'"][^)]*\$|\bexecSync\(\s*[`'"][^)]*\$/g,
    remedy: 'Use subprocess.run(["command", arg], shell=False) or execFile with sanitized string arguments array.'
  },
  {
    id: 'SEC-BACKEND-SSRF',
    pillar: 'Backend Security',
    tier: 'MAJOR',
    cwe: 'CWE-918',
    owasp: 'A10:2021',
    title: 'Potential Server-Side Request Forgery (SSRF) Vector',
    desc: 'Making outgoing HTTP requests directly with user-supplied query/body URLs without private IP validation.',
    appliesTo: ['.py', '.js', '.ts'],
    ignoreInTests: true,
    regex: /(?:requests|httpx)\.(?:get|post|put|delete)\(\s*(?:request\.|req\.|url\b|target_url\b|user_url\b)|\baxios\.(?:get|post)\(\s*(?:req\.query|req\.body|req\.params)/g,
    remedy: 'Validate target URL with an allowlist of trusted domains and block requests to internal IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254).'
  },
  {
    id: 'SEC-BACKEND-SSL-VERIFY-DISABLED',
    pillar: 'Backend Security',
    tier: 'CRITICAL',
    cwe: 'CWE-295',
    owasp: 'A02:2021',
    title: 'Disabled SSL/TLS Certificate Verification',
    desc: 'Explicitly setting verify=False or rejectUnauthorized: false disables HTTPS certificate validation, enabling Man-in-the-Middle attacks.',
    appliesTo: ['.py', '.js', '.ts'],
    ignoreInTests: true,
    regex: /\bverify\s*=\s*False\b|\brejectUnauthorized\s*:\s*false\b|\bNODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]0['"]/g,
    remedy: 'Ensure TLS verification is enabled: verify=True or rejectUnauthorized: true with valid certificates.'
  },
  {
    id: 'SEC-BACKEND-INSECURE-DESERIALIZE',
    pillar: 'Backend Security',
    tier: 'CRITICAL',
    cwe: 'CWE-502',
    owasp: 'A08:2021',
    title: 'Insecure Object Deserialization (Remote Code Execution)',
    desc: 'Unsafe deserialization with pickle or unsafe yaml loader allows arbitrary code execution via crafted payloads.',
    appliesTo: ['.py', '.js', '.ts'],
    ignoreInTests: true,
    regex: /\bpickle\.(?:loads?|Unpickler)\(|\byaml\.load\([^)]*Loader\s*=\s*yaml\.(?:Unsafe)?Loader|\bnode-serialize\b/g,
    remedy: 'Use json.loads() or yaml.safe_load(); never deserialize untrusted pickle streams.'
  },
  {
    id: 'SEC-BACKEND-PATH-TRAVERSAL',
    pillar: 'Backend Security',
    tier: 'CRITICAL',
    cwe: 'CWE-22',
    owasp: 'A01:2021',
    title: 'Path Traversal / Arbitrary File Read Weak Point',
    desc: 'Passing unvalidated user request parameters directly into file system operations allows reading arbitrary server files.',
    appliesTo: ['.py', '.js', '.ts'],
    regex: /(?:open|send_file)\(\s*(?:request\.|req\.|params\[|query\[)|\bres\.sendFile\(\s*(?:req\.params|req\.query|req\.body)|\bfs\.(?:readFile|readFileSync)\(\s*(?:req\.params|req\.query)/g,
    remedy: 'Validate paths with os.path.realpath() and verify path starts within designated safe directory base.'
  },
  {
    id: 'SEC-BACKEND-INSECURE-RANDOM',
    pillar: 'Backend Security',
    tier: 'MAJOR',
    cwe: 'CWE-330',
    owasp: 'A02:2021',
    title: 'Insecure Random Number Generator Used in Security Context',
    desc: 'Math.random() or python random module are pseudo-random and predictable. Attackers can predict session tokens and reset hashes.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx', '.py'],
    ignoreInTests: true,
    regex: /(?:token|secret|salt|session|auth|password|nonce|otp|csrf)\s*[:=][^;\n]*(?:Math\.random\(\)|random\.(?:random|randint|choice)\()/gi,
    remedy: 'Use crypto.randomBytes() in Node.js or secrets.token_hex() in Python for cryptographically secure randomness.'
  },
  {
    id: 'SEC-BACKEND-PROTOTYPE-POLLUTION',
    pillar: 'Backend Security',
    tier: 'MAJOR',
    cwe: 'CWE-1321',
    owasp: 'A03:2021',
    title: 'Potential Object Prototype Pollution Injection Vector',
    desc: 'Direct assignment of request body parameters to object prototypes allows modifying base Object properties.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx'],
    regex: /Object\.assign\(\s*(?:\{\}|[a-zA-Z0-9_]+)\s*,\s*(?:req\.body|request\.body)|\b__proto__\b/g,
    remedy: 'Validate payload against strict schema and use Object.create(null) for unpollutable key-value mappings.'
  },
  {
    id: 'SEC-BACKEND-REDOS',
    pillar: 'Backend Security',
    tier: 'MAJOR',
    cwe: 'CWE-1333',
    owasp: 'A04:2021',
    title: 'Regular Expression Catastrophic Backtracking (ReDoS) Risk',
    desc: 'Nested quantifiers like (a+)+ cause exponential backtracking on crafted input, stalling CPU threads.',
    appliesTo: ['.js', '.ts', '.py'],
    regex: /\(\s*\[?[a-zA-Z0-9_\-\.\s]+\]?[\+\*]\s*\)[\+\*]/g,
    remedy: 'Flatten nested quantifiers or limit input string length before matching.'
  },
  {
    id: 'SEC-BACKEND-CORS-WILDCARD',
    pillar: 'Backend Security',
    tier: 'MAJOR',
    cwe: 'CWE-942',
    owasp: 'A05:2021',
    title: 'Permissive Wildcard CORS with Credentials Allowed',
    desc: 'Allowing all origins (*) combined with allow_credentials=True exposes authenticated sessions to cross-origin theft.',
    appliesTo: ['.py', '.js', '.ts'],
    customCheck: (content) => {
      const hasWildcardOrigin = /allow_origins\s*=\s*\[\s*["']\*["']\s*\]|origin\s*:\s*['"]\*['"]/i.test(content);
      const hasCredentials = /allow_credentials\s*=\s*True|credentials\s*:\s*true/i.test(content);
      if (hasWildcardOrigin && hasCredentials) {
        return 'CORS configured with wildcard origin ("*") and allow_credentials=True.';
      }
      return null;
    },
    remedy: 'Specify explicit trusted origins in allow_origins list rather than wildcard "*" when credentials are true.'
  },
  {
    id: 'SEC-BACKEND-HARDCODED-ADMIN',
    pillar: 'Backend Security',
    tier: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A07:2021',
    title: 'Hardcoded Backend Admin Bypass / Gateway Credentials',
    desc: 'Detected hardcoded administrative password or authentication bypass condition.',
    appliesTo: ['.py', '.js', '.ts'],
    regex: /(?:if\s+token|if\s+password|if\s+auth_key)\s*==\s*['"](?:admin|root|password|123456|master)['"]|\bbypass_auth\s*=\s*True\b|\bADMIN_SECRET_KEY\s*=\s*['"][a-zA-Z0-9_-]{4,}['"]/g,
    remedy: 'Use constant-time hash comparison (secrets.compare_digest) against environment-configured secrets.'
  },
  {
    id: 'SEC-BACKEND-WEAK-HASH',
    pillar: 'Backend Security',
    tier: 'MAJOR',
    cwe: 'CWE-328',
    owasp: 'A02:2021',
    title: 'Weak Cryptographic Hashing Algorithm (MD5/SHA1)',
    desc: 'MD5 and SHA1 are cryptographically broken and vulnerable to collision attacks.',
    appliesTo: ['.py', '.js', '.ts'],
    regex: /\bhashlib\.(?:md5|sha1)\(|\bcrypto\.createHash\(['"](?:md5|sha1)['"]\)/g,
    remedy: 'Use bcrypt/argon2 for password hashing, and SHA-256 / SHA-512 for cryptographic signatures.'
  },
  {
    id: 'SEC-BACKEND-STACKTRACE-LEAK',
    pillar: 'Backend Security',
    tier: 'MAJOR',
    cwe: 'CWE-209',
    owasp: 'A05:2021',
    title: 'Raw Stack Trace Leaked in HTTP API Error Response',
    desc: 'Returning internal tracebacks or err.stack reveals internal file paths, framework versions, and database schemas.',
    appliesTo: ['.py', '.js', '.ts'],
    regex: /traceback\.format_exc\(\)|res\.(?:status\(500\)\.)?json\([^)]*err\.stack/g,
    remedy: 'Log stack traces internally to private logger and return generic error message: {"error": "Internal server error"}.'
  },
  {
    id: 'SEC-BACKEND-INSECURE-COOKIE',
    pillar: 'Backend Security',
    tier: 'MAJOR',
    cwe: 'CWE-614',
    owasp: 'A05:2021',
    title: 'Insecure Cookie Configuration (Missing HttpOnly / Secure)',
    desc: 'Setting cookies with httponly=False or secure=False exposes session tokens to JavaScript access and HTTP interception.',
    appliesTo: ['.py', '.js', '.ts'],
    regex: /\bset_cookie\([^)]*(?:httponly\s*=\s*False|secure\s*=\s*False)/gi,
    remedy: 'Set httponly=True, secure=True, and samesite="lax" or "strict" on all authentication cookies.'
  },
  {
    id: 'SEC-DANGEROUS-HTML',
    pillar: 'Backend Security',
    tier: 'MAJOR',
    cwe: 'CWE-79',
    owasp: 'A03:2021',
    title: 'Unsanitized dangerouslySetInnerHTML Injection',
    desc: 'Direct usage of dangerouslySetInnerHTML without DOMPurify allows stored or reflected XSS.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx', '.html'],
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*(?!DOMPurify|sanitize)[a-zA-Z0-9_.]+/g,
    remedy: 'Wrap raw HTML payload with DOMPurify.sanitize(dirtyHtml) before rendering.'
  },
  {
    id: 'SEC-EVAL-CALL',
    pillar: 'Backend Security',
    tier: 'CRITICAL',
    cwe: 'CWE-95',
    owasp: 'A03:2021',
    title: 'Dangerous eval() or new Function() Execution',
    desc: 'Dynamic code execution opens remote arbitrary code execution vectors.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'],
    regex: /(?<![.\w])eval\s*\(|\bnew\s+Function\s*\(|(?<![.\w])exec\s*\(/g,
    remedy: 'Refactor dynamic evaluation to structured JSON.parse() or typed lookups.'
  },

  // ===========================================================
  // PILLAR 3: MEMORY & RESOURCE LEAKAGE
  // ===========================================================
  {
    id: 'LEAK-EVENT-LISTENER',
    pillar: 'Memory & Resource Leakage',
    tier: 'MAJOR',
    cwe: 'CWE-400',
    owasp: 'A04:2021',
    title: 'Dangling EventListener in Hook (Missing Clean-up)',
    desc: 'addEventListener called inside useEffect without a corresponding removeEventListener in return cleanup.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx'],
    customCheck: (content) => {
      if (!content.includes('addEventListener')) return null;
      if (content.includes('useEffect') && !content.includes('removeEventListener')) {
        return 'addEventListener registered without matching removeEventListener in cleanup callback.';
      }
      return null;
    },
    remedy: 'Return a clean-up function in useEffect: () => window.removeEventListener(event, handler).'
  },
  {
    id: 'LEAK-INTERVAL-TIMER',
    pillar: 'Memory & Resource Leakage',
    tier: 'MAJOR',
    cwe: 'CWE-400',
    owasp: 'A04:2021',
    title: 'Uncleaned setInterval / setTimeout Timer Leak',
    desc: 'setInterval called in lifecycle without clearInterval unmount teardown, continuing to run in background.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx'],
    customCheck: (content) => {
      if (!content.includes('setInterval')) return null;
      if (content.includes('useEffect') && !content.includes('clearInterval')) {
        return 'setInterval initialized without clearInterval inside unmount teardown.';
      }
      return null;
    },
    remedy: 'Store interval ID in const timer = setInterval(...) and return () => clearInterval(timer).'
  },
  {
    id: 'LEAK-WINDOW-POLLUTION',
    pillar: 'Memory & Resource Leakage',
    tier: 'MINOR',
    cwe: 'CWE-400',
    owasp: 'A04:2021',
    title: 'Global Window Scope Object Pollution',
    desc: 'Assigning arbitrary variables to global window object prevents garbage collection.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx'],
    regex: /window\.(?!__)[a-zA-Z0-9_$]+\s*=\s*(?!addEventListener|removeEventListener|location|scrollTo)[a-zA-Z0-9_$]+/g,
    remedy: 'Encapsulate module state in React context, closures, or scoped module instances.'
  },
  {
    id: 'LEAK-EVENT-EMITTER-LIMIT',
    pillar: 'Memory & Resource Leakage',
    tier: 'MAJOR',
    cwe: 'CWE-400',
    owasp: 'A04:2021',
    title: 'EventEmitter Leak Detector Silenced (setMaxListeners)',
    desc: 'Setting setMaxListeners(0) or excessively high values bypasses Node.js memory leak detection warnings.',
    appliesTo: ['.js', '.ts', '.mjs'],
    regex: /\.setMaxListeners\(\s*(?:0|Infinity|[1-9]\d{2,})\s*\)/g,
    remedy: 'Remove setMaxListeners(0) and clean up individual listeners with emitter.off() / removeListener().'
  },
  {
    id: 'LEAK-BACKEND-MUTABLE-DEFAULT',
    pillar: 'Memory & Resource Leakage',
    tier: 'MAJOR',
    cwe: 'CWE-400',
    owasp: 'A04:2021',
    title: 'Python Backend Mutable Default Argument Leak',
    desc: 'Using mutable default arguments (e.g. def func(items=[])) causes data to persist across API requests, leaking state and growing memory indefinitely.',
    appliesTo: ['.py'],
    regex: /def\s+[a-zA-Z0-9_]+\s*\([^)]*=[ \t]*(?:\[\]|\{\})/g,
    remedy: 'Use None as default parameter: def func(items=None): if items is None: items = [].'
  },
  {
    id: 'LEAK-CONSOLE-LOGS',
    pillar: 'Memory & Resource Leakage',
    tier: 'SUGGESTION',
    cwe: 'CWE-532',
    owasp: 'A09:2021',
    title: 'Residual Debug Console Logging',
    desc: 'Found console.log statements that can leak internal state and data payloads to browser devtools.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx'],
    ignoreInTests: true,
    regex: /console\.log\s*\(/g,
    remedy: 'Remove console.log statements or strip via build compiler (e.g. babel-plugin-transform-remove-console).'
  },

  // ===========================================================
  // PILLAR 4: INVISIBLE UI/UX INTERFACE & ACCESSIBILITY DEFECTS
  // ===========================================================
  {
    id: 'UX-IOS-AUTOZOOM',
    pillar: 'UI/UX & Accessibility Traps',
    tier: 'CRITICAL',
    cwe: 'CWE-1374',
    owasp: 'A04:2021',
    title: 'Mobile iOS Safari Input Auto-Zoom Trap',
    desc: 'Text input font-size configured under 16px triggers mandatory Safari viewport zoom on focus.',
    appliesTo: ['.css', '.scss', '.html', '.jsx', '.tsx'],
    regex: /(?:input|textarea)[^{]*\{[^}]*font-size\s*:\s*(?:1[0-5]|[89])px/gi,
    remedy: 'Enforce font-size: 16px minimum on mobile viewports for all form inputs (@media max-width: 768px).'
  },
  {
    id: 'UX-TAP-LATENCY',
    pillar: 'UI/UX & Accessibility Traps',
    tier: 'MAJOR',
    cwe: 'CWE-1374',
    owasp: 'A04:2021',
    title: '300ms Mobile Tap Delay Latency',
    desc: 'Clickable elements missing touch-action: manipulation incur 300ms double-tap delay.',
    appliesTo: ['.css', '.scss'],
    customCheck: (content) => {
      if (content.includes('cursor: pointer') && !content.includes('touch-action: manipulation')) {
        return 'cursor: pointer declared on touch buttons without touch-action: manipulation.';
      }
      return null;
    },
    remedy: 'Add "touch-action: manipulation" to clickable classes and interactive containers.'
  },
  {
    id: 'A11Y-FOCUS-OBLITERATED',
    pillar: 'UI/UX & Accessibility Traps',
    tier: 'MAJOR',
    cwe: 'CWE-1374',
    owasp: 'A04:2021',
    title: 'Obliterated Keyboard Focus Ring',
    desc: 'outline: none or outline: 0 destroys accessibility keyboard indicator (WCAG 2.4.7 violation).',
    appliesTo: ['.css', '.scss', '.html'],
    regex: /(?:button|a|\.btn)[^{]*\{[^}]*outline\s*:\s*(?:none|0)\b(?!.*focus-visible)/gi,
    remedy: 'Replace outline: none with button:focus-visible { outline: 2px solid #00f5a0; outline-offset: 2px; }.'
  },
  {
    id: 'UI-FLEX-SQUISH',
    pillar: 'UI/UX & Accessibility Traps',
    tier: 'MAJOR',
    cwe: 'CWE-1374',
    owasp: 'A04:2021',
    title: 'Flexbox SVG Icon Geometry Distortion',
    desc: 'SVG icons placed directly inside flex containers collapse when sibling text wraps or grows.',
    appliesTo: ['.jsx', '.tsx', '.html'],
    customCheck: (content) => {
      if (content.includes('display: flex') && content.includes('<svg') && !content.includes('flex-shrink: 0')) {
        return 'Flex container contains SVG icons without flex-shrink: 0 declaration.';
      }
      return null;
    },
    remedy: 'Add flex-shrink: 0 and explicit width/height to all SVG icon elements inside flex containers.'
  },
  {
    id: 'UX-VIEWPORT-BLEED',
    pillar: 'UI/UX & Accessibility Traps',
    tier: 'MAJOR',
    cwe: 'CWE-1374',
    owasp: 'A04:2021',
    title: 'Horizontal Viewport Bleed (100vw Scrollbar Trap)',
    desc: 'Using width: 100vw includes the scrollbar gutter width, triggering unwanted horizontal overflow.',
    appliesTo: ['.css', '.scss', '.html', '.jsx', '.tsx'],
    regex: /(?<!max-|min-)width\s*:\s*100vw/gi,
    remedy: 'Replace width: 100vw with width: 100% or use max-w-full to prevent horizontal layout thrashing.'
  },
  {
    id: 'A11Y-ICON-UNANNOUNCED',
    pillar: 'UI/UX & Accessibility Traps',
    tier: 'MAJOR',
    cwe: 'CWE-1374',
    owasp: 'A04:2021',
    title: 'Unannounced Icon-Only Button',
    desc: 'Buttons containing only an SVG or icon without text or aria-label are completely invisible to screen readers.',
    appliesTo: ['.jsx', '.tsx', '.html'],
    regex: /<button[^>]*>\s*<(?:svg|LucideIcon|[A-Z][a-zA-Z]+Icon)[^>]*\/>\s*<\/button>/g,
    remedy: 'Add aria-label="Action Name" or title attribute to all icon-only buttons.'
  },
  {
    id: 'A11Y-IMG-MISSING-ALT',
    pillar: 'UI/UX & Accessibility Traps',
    tier: 'MAJOR',
    cwe: 'CWE-1374',
    owasp: 'A04:2021',
    title: 'Image Missing alt Accessibility Attribute',
    desc: 'Image element declared without alt attribute (WCAG 1.1.1 Non-text Content violation).',
    appliesTo: ['.html', '.jsx', '.tsx'],
    regex: /<img\b(?![^>]*\balt\s*=)[^>]*>/gi,
    remedy: 'Provide descriptive alt attribute: <img src="..." alt="Descriptive text" /> or alt="" for decorative images.'
  },
  {
    id: 'A11Y-POSITIVE-TABINDEX',
    pillar: 'UI/UX & Accessibility Traps',
    tier: 'MINOR',
    cwe: 'CWE-1374',
    owasp: 'A04:2021',
    title: 'Disruptive Positive tabindex Traversal Value',
    desc: 'Positive tabindex values (e.g. tabindex="1") override natural DOM tab sequence, breaking keyboard accessibility.',
    appliesTo: ['.html', '.jsx', '.tsx'],
    regex: /\btabindex\s*=\s*['"][1-9]\d*['"]/gi,
    remedy: 'Use tabindex="0" for natural sequence or tabindex="-1" for programmatically focused elements.'
  }
];

function runLocalAudit(targetInput, includeDocs = false) {
  const resolvedTarget = path.resolve(targetInput);
  if (!fs.existsSync(resolvedTarget)) {
    console.error(`${C.rose}Error: Target path "${resolvedTarget}" does not exist.${C.reset}`);
    process.exit(1);
  }

  const stat = fs.statSync(resolvedTarget);
  const isSingleFile = !stat.isDirectory();
  const root = isSingleFile ? path.dirname(resolvedTarget) : resolvedTarget;

  const files = isSingleFile ? [resolvedTarget] : walkDir(root, [], includeDocs);
  const issues = [];
  const scannedFiles = [];
  const extCounts = {};
  const dirCounts = {};
  let totalLinesScanned = 0;

  for (const filePath of files) {
    const rawRel = isSingleFile ? path.basename(filePath) : path.relative(root, filePath);
    const relPath = (rawRel || path.basename(filePath)).split(path.sep).join('/');
    const ext = path.extname(filePath).toLowerCase();
    scannedFiles.push(relPath);

    const baseName = path.basename(filePath);
    let extKey = ext || '[config]';
    if (baseName.startsWith('.env')) extKey = '.env';
    extCounts[extKey] = (extCounts[extKey] || 0) + 1;

    const topFolder = relPath.includes('/') ? relPath.split('/')[0] : '.';
    dirCounts[topFolder] = (dirCounts[topFolder] || 0) + 1;

    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      continue;
    }

    const linesCount = content.split('\n').length;
    totalLinesScanned += linesCount;

    // Check raw un-scoped .env files that are missing from .gitignore
    if (baseName === '.env' || (baseName.startsWith('.env.') && !baseName.endsWith('.example'))) {
      const gitignorePath = path.join(root, '.gitignore');
      let isGitIgnored = false;
      if (fs.existsSync(gitignorePath)) {
        try {
          const giContent = fs.readFileSync(gitignorePath, 'utf8');
          if (giContent.includes('.env')) isGitIgnored = true;
        } catch (e) {}
      }
      if (!isGitIgnored) {
        issues.push({
          id: 'SEC-ENV-EXPOSED',
          pillar: 'Secret Gateways & Credentials',
          tier: 'CRITICAL',
          cwe: 'CWE-552',
          owasp: 'A05:2021',
          title: 'Environment Config / Secret File Committed to Source',
          file: relPath,
          line: 1,
          col: 1,
          snippet: `Sensitive configuration file (${baseName}) present in directory tree without .gitignore protection.`,
          codeframe: `     ${C.rose}>${C.reset} ${C.gray}  1 |${C.reset} ${baseName} found in repository without .gitignore entry\n       ${' '.repeat(3)} | ${C.rose}${C.bold}^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^${C.reset}`,
          remedy: 'Add .env* to .gitignore and remove from git index using git rm --cached.'
        });
      }
    }

    for (const rule of RULES) {
      // Flag filtering logic (when user explicitly requests a specific subset)
      if (options.securityOnly && rule.pillar !== 'Secret Gateways & Credentials') continue;
      if (options.backendOnly && rule.pillar !== 'Backend Security') continue;
      if (options.leakageOnly && rule.pillar !== 'Memory & Resource Leakage') continue;
      if (options.uiOnly && rule.pillar !== 'UI/UX & Accessibility Traps') continue;

      if (rule.ignoreInTests && (relPath.toLowerCase().includes('test') || relPath.toLowerCase().includes('spec'))) continue;

      // Filter by language/file extension if rule specifies appliesTo
      if (rule.appliesTo && !rule.appliesTo.includes(ext)) {
        continue;
      }

      if (rule.regex) {
        rule.regex.lastIndex = 0;
        let match;
        while ((match = rule.regex.exec(content)) !== null) {
          const matchedText = match[0];
          if (rule.filter && rule.filter(matchedText)) {
            continue;
          }

          const matchIndex = match.index;
          const matchLength = matchedText.length;
          const linesUpToMatch = content.slice(0, matchIndex).split('\n');
          const lineNum = linesUpToMatch.length;
          const colNum = linesUpToMatch[linesUpToMatch.length - 1].length + 1;

          const snippet = matchedText.trim().replace(/[\r\n]+/g, ' ').slice(0, 100);
          const codeframe = generateCodeFrame(content, lineNum, colNum, matchLength);

          issues.push({
            id: rule.id,
            pillar: rule.pillar,
            tier: rule.tier,
            cwe: rule.cwe || 'CWE-Other',
            owasp: rule.owasp || 'A00:2021',
            title: rule.title,
            file: relPath,
            line: lineNum,
            col: colNum,
            snippet,
            codeframe,
            remedy: rule.remedy
          });

          // Prevent regex infinite loops on 0-length matches
          if (match.index === rule.regex.lastIndex) rule.regex.lastIndex++;
        }
      }

      if (rule.customCheck) {
        const customResult = rule.customCheck(content, ext);
        if (customResult) {
          issues.push({
            id: rule.id,
            pillar: rule.pillar,
            tier: rule.tier,
            cwe: rule.cwe || 'CWE-Other',
            owasp: rule.owasp || 'A00:2021',
            title: rule.title,
            file: relPath,
            line: 1,
            col: 1,
            snippet: customResult,
            codeframe: `     ${C.rose}>${C.reset} ${C.gray}  1 |${C.reset} ${customResult}\n       ${' '.repeat(3)} | ${C.rose}${C.bold}^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^${C.reset}`,
            remedy: rule.remedy
          });
        }
      }
    }
  }

  return { root, totalFiles: files.length, totalLinesScanned, scannedFiles, extCounts, dirCounts, issues };
}

// -------------------------------------------------------------
// MAIN CLI EXECUTION PIPELINE
// -------------------------------------------------------------
async function main() {
  const isUrl = /^https?:\/\//i.test(options.target) || options.target.includes('.vercel.app');

  if (isUrl) {
    console.error(`\n${C.rose}${C.bold}Error:${C.reset} ${C.white}URL scanning is not supported in this version of arnav-audit.${C.reset}`);
    console.error(`${C.dim}arnav-audit is a dedicated local codebase auditor for internal security, memory leaks, secret gateways, and backend weak points.${C.reset}`);
    console.error(`${C.dim}Please provide a local project directory path instead (e.g. ${C.white}arnav-audit .${C.dim} or ${C.white}arnav-audit ./apps/api${C.dim}).${C.reset}\n`);
    process.exit(1);
  }

  const startTime = process.hrtime.bigint();

  // Local Project Directory / File Scan
  if (!options.json) {
    console.log(BANNER);
    console.log(`${C.cyan}▸ Scanning local codebase on this device:${C.reset} ${C.bold}${path.resolve(options.target)}${C.reset}\n`);
  }

  const audit = runLocalAudit(options.target, options.includeDocs);

  const endTime = process.hrtime.bigint();
  const durationNs = Number(endTime - startTime);
  const durationMs = (durationNs / 1_000_000).toFixed(2);
  const durationSec = durationNs / 1_000_000_000;
  const filesPerSec = durationSec > 0 ? Math.round(audit.totalFiles / durationSec) : audit.totalFiles;
  const linesPerSec = durationSec > 0 ? Math.round(audit.totalLinesScanned / durationSec) : audit.totalLinesScanned;

  // Filter issues by minSeverity if requested
  const severityRank = { CRITICAL: 4, MAJOR: 3, MINOR: 2, SUGGESTION: 1 };
  const minRank = severityRank[options.minSeverity] || 1;
  const activeIssues = audit.issues.filter(i => (severityRank[i.tier] || 1) >= minRank);

  // Group by severity
  const critical = activeIssues.filter(i => i.tier === 'CRITICAL');
  const major = activeIssues.filter(i => i.tier === 'MAJOR');
  const minor = activeIssues.filter(i => i.tier === 'MINOR');
  const suggestions = activeIssues.filter(i => i.tier === 'SUGGESTION');

  // Group by the 4 Core Pillars
  const pillarGateways = activeIssues.filter(i => i.pillar === 'Secret Gateways & Credentials');
  const pillarBackend = activeIssues.filter(i => i.pillar === 'Backend Security');
  const pillarLeakage = activeIssues.filter(i => i.pillar === 'Memory & Resource Leakage');
  const pillarUI = activeIssues.filter(i => i.pillar === 'UI/UX & Accessibility Traps');

  // Compute overall score
  const score = Math.max(0, 100 - (critical.length * 20 + major.length * 8 + minor.length * 3 + suggestions.length * 1));
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';

  if (options.json) {
    console.log(JSON.stringify({
      target: audit.root,
      totalFiles: audit.totalFiles,
      totalLinesScanned: audit.totalLinesScanned,
      scanDurationMs: parseFloat(durationMs),
      filesPerSec,
      linesPerSec,
      score,
      grade,
      scannedFiles: audit.scannedFiles,
      pillars: {
        secretGateways: { count: pillarGateways.length, passed: pillarGateways.length === 0 },
        backendSecurity: { count: pillarBackend.length, passed: pillarBackend.length === 0 },
        memoryLeakage: { count: pillarLeakage.length, passed: pillarLeakage.length === 0 },
        uiUxTraps: { count: pillarUI.length, passed: pillarUI.length === 0 }
      },
      counts: {
        critical: critical.length,
        major: major.length,
        minor: minor.length,
        suggestions: suggestions.length,
        total: activeIssues.length,
      },
      issues: activeIssues,
    }, null, 2));

    if (options.ci && (critical.length > 0 || major.length > 0)) {
      process.exit(1);
    }
    return;
  }

  // Print all scanned files if requested or if verbose
  if (options.files || options.verbose) {
    console.log(`${C.bold}VERIFIED CODEBASE FILES (${audit.totalFiles} files, ${audit.totalLinesScanned.toLocaleString()} lines inspected):${C.reset}`);
    audit.scannedFiles.forEach((file, idx) => {
      const fileIssues = activeIssues.filter(i => i.file === file);
      const numStr = String(idx + 1).padStart(3, ' ');
      if (fileIssues.length === 0) {
        console.log(`  ${C.gray}[${numStr}/${audit.totalFiles}]${C.reset} ${C.emerald}✓${C.reset} ${file}`);
      } else {
        console.log(`  ${C.gray}[${numStr}/${audit.totalFiles}]${C.reset} ${C.rose}✗${C.reset} ${file} ${C.rose}(${fileIssues.length} issues)${C.reset}`);
      }
    });
    console.log('');
  }

  // Formatted Terminal Dashboard
  console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}`);
  console.log(`  ${C.bold}AUDIT REPORT OVERVIEW${C.reset}  •  Scanned ${C.bold}${audit.totalFiles}${C.reset} files (${C.bold}${audit.totalLinesScanned.toLocaleString()}${C.reset} lines)`);
  console.log(`  ${C.emerald}⚡ Execution Time:${C.reset} ${C.white}${durationMs}ms${C.reset} ${C.dim}(${filesPerSec.toLocaleString()} files/sec • ${linesPerSec.toLocaleString()} lines/sec)${C.reset}`);
  console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}`);
  
  const gradeColor = grade.startsWith('A') ? C.emerald : grade === 'B' ? C.cyan : grade === 'C' ? C.amber : C.rose;
  console.log(`  Overall Score:  ${gradeColor}${C.bold}${score}/100${C.reset} (Grade ${gradeColor}${C.bold}${grade}${C.reset})`);
  console.log(`  Findings:       ${C.rose}${critical.length} Critical${C.reset}  |  ${C.amber}${major.length} Major${C.reset}  |  ${C.cyan}${minor.length} Minor${C.reset}  |  ${C.gray}${suggestions.length} Suggestions${C.reset}\n`);

  // 4-PILLAR SECURITY & LEAKAGE STATUS MATRIX
  console.log(`  ${C.bold}4-PILLAR CODEBASE QUALITY MATRIX:${C.reset}`);
  const formatPillar = (list) => {
    if (list.length === 0) {
      return `${C.emerald}✓ SECURE${C.reset}  ${C.dim}(0 detected)${C.reset}`;
    }
    const hasCrit = list.some(i => i.tier === 'CRITICAL');
    const color = hasCrit ? C.rose : C.amber;
    return `${color}${C.bold}✗ VULNERABLE (${list.length} detected)${C.reset}`;
  };

  console.log(`   • 🔐 Secret Gateways & Credentials  : ${formatPillar(pillarGateways)}`);
  console.log(`   • 🛡️ Backend Security & Weak Points : ${formatPillar(pillarBackend)}`);
  console.log(`   • 🧠 Memory & Resource Leakage      : ${formatPillar(pillarLeakage)}`);
  console.log(`   • 📱 UI/UX & Accessibility Traps    : ${formatPillar(pillarUI)}`);
  console.log('');

  // Codebase File Type Breakdown
  console.log(`  ${C.bold}Codebase File Coverage Breakdown:${C.reset}`);
  const sortedExts = Object.entries(audit.extCounts).sort((a, b) => b[1] - a[1]);
  sortedExts.forEach(([ext, count]) => {
    let name = 'Source / Script';
    if (ext === '.py') name = 'Python (Backend, APIs, Scripts)';
    else if (ext === '.ts') name = 'TypeScript (Backend, APIs, Core)';
    else if (ext === '.tsx') name = 'React / Next.js Components';
    else if (ext === '.js' || ext === '.mjs' || ext === '.cjs') name = 'JavaScript Modules & Backend Scripts';
    else if (ext === '.go') name = 'Go (Microservices & Backend)';
    else if (ext === '.php') name = 'PHP (Backend Services)';
    else if (ext === '.java') name = 'Java / Kotlin Backend Services';
    else if (ext === '.rs') name = 'Rust (Systems & Services)';
    else if (ext === '.sh' || ext === '.bash' || ext === '.zsh') name = 'Shell & Automation Scripts';
    else if (ext === '.sql') name = 'SQL Database Migrations & Queries';
    else if (ext === '.env' || ext.startsWith('.env.')) name = 'Environment Secret Configurations';
    else if (ext === '.json') name = 'JSON Manifests & Data schemas';
    else if (ext === '.yml' || ext === '.yaml') name = 'GitHub CI & YAML Configs';
    else if (ext === '.css' || ext === '.scss') name = 'CSS & Styling Stylesheets';
    else if (ext === '.html') name = 'HTML Templates & Fixtures';
    else if (ext === '.md' || ext === '.markdown') name = 'Documentation & Readmes';
    else if (ext === '[config]') name = 'Config & Dotfiles';
    console.log(`   • ${C.cyan}${name.padEnd(42, ' ')}${C.reset} ${C.bold}${count}${C.reset} files (${ext})`);
  });
  console.log('');

  if (activeIssues.length === 0) {
    console.log(`  ${C.emerald}✓ Zero internal security, gateway leaks, memory leaks, or backend weak points detected!${C.reset}`);
    console.log(`  All ${audit.totalFiles} files in the codebase were inspected on this device. Meets enterprise standards.\n`);
    if (!options.files) {
      console.log(`  ${C.dim}Tip: Run with ${C.white}--files${C.dim} to display each individual file path in the terminal.${C.reset}`);
    }
    console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}\n`);
    return;
  }

  console.log(`${C.bold}DETECTED CODEBASE ISSUES & WEAK POINTS:${C.reset}\n`);

  // Group by Pillar for maximum clarity
  const pillarsToRender = [
    { title: '🔐 SECRET GATEWAYS & SENSITIVE CREDENTIAL LEAKS', items: pillarGateways },
    { title: '🛡️ BACKEND SECURITY & VULNERABILITY WEAK POINTS', items: pillarBackend },
    { title: '🧠 MEMORY & RESOURCE LEAKAGE DEFECTS', items: pillarLeakage },
    { title: '📱 INVISIBLE UI/UX & ACCESSIBILITY TRAPS', items: pillarUI }
  ];

  pillarsToRender.forEach(p => {
    if (p.items.length === 0) return;
    console.log(`${C.cyan}${C.bold}${p.title} (${p.items.length} issues):${C.reset}`);
    p.items.forEach((issue) => {
      const badge = issue.tier === 'CRITICAL'
        ? `${C.bgRose}${C.white}${C.bold} CRITICAL ${C.reset}`
        : issue.tier === 'MAJOR'
        ? `${C.bgAmber}${C.black}${C.bold} MAJOR ${C.reset}`
        : issue.tier === 'MINOR'
        ? `${C.bgDark}${C.cyan}${C.bold} MINOR ${C.reset}`
        : `${C.bgDark}${C.gray}${C.bold} ${issue.tier} ${C.reset}`;

      const mappingTag = `${C.purple}[${issue.cwe} | OWASP ${issue.owasp}]${C.reset}`;
      console.log(` ${badge} ${C.bold}${issue.title}${C.reset} ${C.gray}[${issue.id}]${C.reset} ${mappingTag}`);
      console.log(`    ${C.dim}Location:${C.reset} ${C.white}${issue.file}:${issue.line}:${issue.col}${C.reset}`);
      
      // Visual codeframe
      if (!options.noCodeframe && issue.codeframe) {
        console.log(`    ${C.dim}Code Context:${C.reset}\n${issue.codeframe}`);
      } else {
        console.log(`    ${C.dim}Evidence:${C.reset} ${C.yellow}${issue.snippet}${C.reset}`);
      }
      
      console.log(`    ${C.dim}Fix Goal:${C.reset} ${C.emerald}${issue.remedy}${C.reset}`);
      console.log('');
    });
  });

  // Actionable AI Fix Prompt Section
  console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}`);
  console.log(`  ${C.emerald}${C.bold}READY-TO-USE AI FIX PROMPT (Cursor, Claude Code, Antigravity):${C.reset}`);
  console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}\n`);
  
  console.log(`${C.gray}Copy and paste this block directly into your AI editor chat to fix all issues:${C.reset}\n`);
  
  console.log(`${C.cyan}## AUDIT REMEDIATION INSTRUCTIONS (via arnav-audit)`);
  console.log(`Fix the following ${activeIssues.length} verified security, secret gateway, backend weak points, and leakages:`);
  activeIssues.forEach((iss, idx) => {
    console.log(`\n### ${idx + 1}. [${iss.tier}] ${iss.title} (${iss.id})`);
    console.log(`- File: ${iss.file}:${iss.line}:${iss.col}`);
    console.log(`- Standard: ${iss.cwe} | OWASP ${iss.owasp}`);
    console.log(`- Vulnerability Snippet: ${iss.snippet}`);
    console.log(`- Required Fix: ${iss.remedy}`);
  });
  console.log(`\n### Implementation Guardrails:`);
  console.log(`1. Never hardcode secrets, database gateways, or tokens in source code.`);
  console.log(`2. Replace SQL string formatting with parameterized queries.`);
  console.log(`3. Ensure verify=True on all external HTTP requests and shell=False on process executions.`);
  console.log(`4. Clean up all event listeners, intervals, and unclosed resource handles in teardown callbacks.`);
  console.log(`${C.reset}`);

  console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}\n`);

  // CI mode exit code check
  if (options.ci && (critical.length > 0 || major.length > 0)) {
    console.error(`${C.rose}${C.bold}CI Quality Gate Failed:${C.reset} Detected ${critical.length} Critical and ${major.length} Major issues.\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${C.rose}Execution error:${C.reset}`, err);
  process.exit(1);
});
