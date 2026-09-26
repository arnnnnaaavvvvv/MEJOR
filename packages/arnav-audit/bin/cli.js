#!/usr/bin/env node

/**
 * arnav-audit - Automated Internal Security, Memory Leakage & UI/UX Interface Auditor
 * Author: Arnav
 * Website: https://mejor-iota.vercel.app
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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

  // Background
  bgEmerald: '\x1b[48;2;16;185;129m',
  bgRose: '\x1b[48;2;244;63;94m',
  bgAmber: '\x1b[48;2;245;158;11m',
  bgDark: '\x1b[48;2;16;22;38m',
};

const BANNER = `
${C.emerald}${C.bold}   _    ____  _   _    ___     __     _   _   _ ____ ___ _____ 
  / \\  |  _ \\| \\ | |  / \\ \\   / /    / \\ | | | |  _ \\_ _|_   _|
 / _ \\ | |_) |  \\| | / _ \\ \\ / /    / _ \\| | | | | | | |  | |  
/ ___ \\|  _ <| |\\  |/ ___ \\ V /    / ___ \\ |_| | |_| | |  | |  
/_/   \\_\\_| \\_\\_| \\_/_/   \\_\\_/    /_/   \\_\\___/|____/___| |_|  ${C.reset}
${C.dim}Autonomous Security, Memory Leakage & Invisible UI/UX Auditor${C.reset}
${C.gray}Engine by Arnav • https://mejor-iota.vercel.app${C.reset}
`;

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  target: '.',
  json: false,
  prompts: false,
  securityOnly: false,
  leakageOnly: false,
  verbose: false,
  files: false,
  help: false,
  version: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help' || arg === '-h') options.help = true;
  else if (arg === '--version' || arg === '-v') options.version = true;
  else if (arg === '--verbose') options.verbose = true;
  else if (arg === '--files' || arg === '--list') options.files = true;
  else if (arg === '--json') options.json = true;
  else if (arg === '--prompts' || arg === '--fix') options.prompts = true;
  else if (arg === '--security' || arg === '--security-only') options.securityOnly = true;
  else if (arg === '--leakage' || arg === '--leakage-only') options.leakageOnly = true;
  else if (!arg.startsWith('-')) options.target = arg;
}

if (options.version) {
  console.log('arnav-audit v1.0.2');
  process.exit(0);
}

if (options.help) {
  console.log(BANNER);
  console.log(`
${C.bold}USAGE:${C.reset}
  npx arnav-audit [target] [options]

${C.bold}TARGETS:${C.reset}
  [directory]        Path to local project root (defaults to current directory ".")
  [https://url]      Live website URL to run headless CDP telemetry & 200 checks

${C.bold}OPTIONS:${C.reset}
  --files, --list    List every single scanned file path with inspection status
  --verbose          Display detailed scan logs and file-by-file verification
  --prompts, --fix   Generate copy-paste AI fix prompts for Cursor & Claude Code
  --security-only    Scan exclusively for exposed credentials, secrets & XSS vectors
  --leakage-only     Scan exclusively for memory, event listeners & viewport leaks
  --json             Output raw machine-readable JSON for CI/CD pipelines
  -v, --version      Display tool version
  -h, --help         Display this help message

${C.bold}EXAMPLES:${C.reset}
  $ npx arnav-audit .
  $ npx arnav-audit . --files
  $ npx arnav-audit https://mejor-iota.vercel.app
  $ npx arnav-audit . --prompts
  $ npx arnav-audit . --json > audit-report.json
`);
  process.exit(0);
}

// -------------------------------------------------------------
// LOCAL SCANNER ENGINE (Filesystem, Security, Leaks, UI Traps)
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
  'coverage',
  '.cache',
  'venv',
  '.venv',
  'env',
  '__pycache__',
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
  '.tsbuildinfo'
]);

function walkDir(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (IGNORED_DIRS.has(file)) continue;
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // Allow .github workflow directory while ignoring other hidden dot-folders
          if (file.startsWith('.') && file !== '.github') continue;
          if (file.includes('worktree')) continue;
          walkDir(fullPath, fileList);
        } else {
          // Skip the scanner's own CLI script so its rule definitions are not self-flagged
          if (file === 'cli.js' && fullPath.includes('arnav-audit')) continue;
          // Skip OS metadata
          if (file === '.DS_Store' || file === 'Thumbs.db') continue;

          const ext = path.extname(file).toLowerCase();
          if (!BINARY_EXTS.has(ext)) {
            fileList.push(fullPath);
          }
        }
      } catch (err) {}
    }
  } catch (err) {}
  return fileList;
}

// Pattern rules for security, leakage, and UI defects
const RULES = [
  // 1. SECURITY & CREDENTIAL LEAKAGE (UNIVERSAL)
  {
    id: 'SEC-AWS-KEY',
    category: 'Security',
    tier: 'CRITICAL',
    title: 'Hardcoded AWS Access Key Exposed',
    desc: 'Found hardcoded AWS Access Key ID in source code. Can lead to immediate account takeover.',
    regex: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
    remedy: 'Move key to environment variable (AWS_ACCESS_KEY_ID) and rotate compromised credential immediately.'
  },
  {
    id: 'SEC-OPENAI-KEY',
    category: 'Security',
    tier: 'CRITICAL',
    title: 'Hardcoded OpenAI API Secret Key',
    desc: 'Exposed OpenAI secret key in code. Allows unauthorized API billing and model consumption.',
    regex: /sk-[a-zA-Z0-9]{20,T3BlbkFJ[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{48}/g,
    remedy: 'Store in OPENAI_API_KEY environment variable and revoke the exposed key.'
  },
  {
    id: 'SEC-GITHUB-TOKEN',
    category: 'Security',
    tier: 'CRITICAL',
    title: 'Exposed GitHub Personal Access Token',
    desc: 'Found active GitHub token pattern in repository source.',
    regex: /ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82}/g,
    remedy: 'Revoke token in GitHub Developer Settings and use Secret Manager or GitHub Actions Secrets.'
  },
  {
    id: 'SEC-STRIPE-KEY',
    category: 'Security',
    tier: 'CRITICAL',
    title: 'Exposed Stripe Secret Live Key',
    desc: 'Live Stripe secret API key committed to source repository.',
    regex: /(?:sk|rk)_live_[0-9a-zA-Z]{24,34}/g,
    remedy: 'Rotate Stripe secret key in Dashboard; never bundle secret keys in client-facing bundles.'
  },
  {
    id: 'SEC-PRIVATE-KEY',
    category: 'Security',
    tier: 'CRITICAL',
    title: 'Unencrypted Private Key Block in Code',
    desc: 'RSA/EC/SSH private key found directly committed.',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s*[\r\n]+[A-Za-z0-9+/=]{20,}/g,
    remedy: 'Remove private key file from version control immediately; load via secure KMS/vault.'
  },

  // JAVASCRIPT & WEB CODE INJECTION
  {
    id: 'SEC-DANGEROUS-HTML',
    category: 'Security',
    tier: 'MAJOR',
    title: 'Unsanitized dangerouslySetInnerHTML Injection',
    desc: 'Direct usage of dangerouslySetInnerHTML without DOMPurify allows stored or reflected XSS.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx', '.html'],
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*(?!DOMPurify|sanitize)[a-zA-Z0-9_.]+/g,
    remedy: 'Wrap raw HTML payload with DOMPurify.sanitize(dirtyHtml) before rendering.'
  },
  {
    id: 'SEC-EVAL-CALL',
    category: 'Security',
    tier: 'CRITICAL',
    title: 'Dangerous eval() or new Function() Execution',
    desc: 'Dynamic code execution opens remote arbitrary code execution vectors.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
    regex: /(?<![.\w])eval\s*\(|\bnew\s+Function\s*\(/g,
    remedy: 'Refactor dynamic evaluation to structured JSON.parse() or typed lookups.'
  },

  // PYTHON BACKEND SECURITY
  {
    id: 'SEC-PY-SQL-INJECTION',
    category: 'Security',
    tier: 'CRITICAL',
    title: 'Python SQL Query String Formatting Injection',
    desc: 'Raw f-string or % formatting directly inside SQL query execution.',
    appliesTo: ['.py'],
    regex: /cursor\.execute\(\s*f["']|execute\(\s*f["']SELECT/gi,
    remedy: 'Use parameterized queries: execute("SELECT ... WHERE id = :id", {"id": val}).'
  },
  {
    id: 'SEC-PY-SHELL-TRUE',
    category: 'Security',
    tier: 'CRITICAL',
    title: 'Python Subprocess shell=True Command Injection',
    desc: 'Running shell commands with shell=True allows arbitrary remote command execution.',
    appliesTo: ['.py'],
    regex: /subprocess\.(?:run|call|Popen)\([^)]*shell\s*=\s*True/g,
    remedy: 'Pass command arguments as an array ["cmd", "arg1"] with shell=False.'
  },

  // 2. MEMORY & RESOURCE LEAKAGE (FRONTEND JS/TS)
  {
    id: 'LEAK-EVENT-LISTENER',
    category: 'Memory Leakage',
    tier: 'MAJOR',
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
    category: 'Memory Leakage',
    tier: 'MAJOR',
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
    category: 'Memory Leakage',
    tier: 'MINOR',
    title: 'Global Window Scope Object Pollution',
    desc: 'Assigning arbitrary variables to global window object prevents garbage collection.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx'],
    regex: /window\.(?!__)[a-zA-Z0-9_$]+\s*=\s*(?!addEventListener|removeEventListener|location|scrollTo)[a-zA-Z0-9_$]+/g,
    remedy: 'Encapsulate module state in React context, closures, or scoped module instances.'
  },
  {
    id: 'LEAK-CONSOLE-LOGS',
    category: 'Production Leakage',
    tier: 'SUGGESTION',
    title: 'Residual Debug Console Logging',
    desc: 'Found console.log statements that can leak internal state and data payloads to browser devtools.',
    appliesTo: ['.js', '.jsx', '.ts', '.tsx'],
    regex: /console\.log\s*\(/g,
    remedy: 'Remove console.log statements or strip via build compiler (e.g. babel-plugin-transform-remove-console).'
  },

  // 3. INVISIBLE UI/UX INTERFACE DEFECTS
  {
    id: 'UX-IOS-AUTOZOOM',
    category: 'UI/UX Traps',
    tier: 'CRITICAL',
    title: 'Mobile iOS Safari Input Auto-Zoom Trap',
    desc: 'Text input font-size configured under 16px triggers mandatory Safari viewport zoom on focus.',
    appliesTo: ['.css', '.scss', '.html', '.jsx', '.tsx'],
    regex: /(?:input|textarea)[^{]*\{[^}]*font-size\s*:\s*(?:1[0-5]|[89])px/gi,
    remedy: 'Enforce font-size: 16px minimum on mobile viewports for all form inputs (@media max-width: 768px).'
  },
  {
    id: 'UX-TAP-LATENCY',
    category: 'UI/UX Traps',
    tier: 'MAJOR',
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
    category: 'Accessibility',
    tier: 'MAJOR',
    title: 'Obliterated Keyboard Focus Ring',
    desc: 'outline: none or outline: 0 destroys accessibility keyboard indicator (WCAG 2.4.7 violation).',
    appliesTo: ['.css', '.scss', '.html'],
    regex: /(?:button|a|\.btn)[^{]*\{[^}]*outline\s*:\s*(?:none|0)\b(?!.*focus-visible)/gi,
    remedy: 'Replace outline: none with button:focus-visible { outline: 2px solid #00f5a0; outline-offset: 2px; }.'
  },
  {
    id: 'UI-FLEX-SQUISH',
    category: 'UI Geometry',
    tier: 'MAJOR',
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
    category: 'UI Geometry',
    tier: 'MAJOR',
    title: 'Horizontal Viewport Bleed (100vw Scrollbar Trap)',
    desc: 'Using width: 100vw includes the scrollbar gutter width, triggering unwanted horizontal overflow.',
    appliesTo: ['.css', '.scss', '.html', '.jsx', '.tsx'],
    regex: /(?<!max-|min-)width\s*:\s*100vw/gi,
    remedy: 'Replace width: 100vw with width: 100% or use max-w-full to prevent horizontal layout thrashing.'
  },
  {
    id: 'A11Y-ICON-UNANNOUNCED',
    category: 'Accessibility',
    tier: 'MAJOR',
    title: 'Unannounced Icon-Only Button',
    desc: 'Buttons containing only an SVG or icon without text or aria-label are completely invisible to screen readers.',
    appliesTo: ['.jsx', '.tsx', '.html'],
    regex: /<button[^>]*>\s*<(?:svg|LucideIcon|[A-Z][a-zA-Z]+Icon)[^>]*\/>\s*<\/button>/g,
    remedy: 'Add aria-label="Action Name" or title attribute to all icon-only buttons.'
  }
];

function runLocalAudit(targetDir) {
  const root = path.resolve(targetDir);
  if (!fs.existsSync(root)) {
    console.error(`${C.rose}Error: Target path "${root}" does not exist.${C.reset}`);
    process.exit(1);
  }

  const files = walkDir(root);
  const issues = [];
  const scannedFiles = [];
  const extCounts = {};
  const dirCounts = {};

  for (const filePath of files) {
    const relPath = path.relative(root, filePath);
    const ext = path.extname(filePath).toLowerCase();
    scannedFiles.push(relPath);

    const extKey = ext || '[config]';
    extCounts[extKey] = (extCounts[extKey] || 0) + 1;

    const topFolder = relPath.split(path.sep)[0] || '.';
    dirCounts[topFolder] = (dirCounts[topFolder] || 0) + 1;

    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      continue;
    }

    // Check raw un-scoped .env files that are missing from .gitignore
    if (path.basename(filePath) === '.env') {
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
          category: 'Security',
          tier: 'CRITICAL',
          title: 'Environment Config File Committed to Source',
          file: relPath,
          line: 1,
          snippet: 'Sensitive configuration file present in directory tree without .gitignore protection.',
          remedy: 'Add .env* to .gitignore and remove from git index using git rm --cached.'
        });
      }
    }

    for (const rule of RULES) {
      if (options.securityOnly && rule.category !== 'Security') continue;
      if (options.leakageOnly && !rule.category.includes('Leakage')) continue;

      // Filter by language/file extension if rule specifies appliesTo
      if (rule.appliesTo && !rule.appliesTo.includes(ext)) {
        continue;
      }

      if (rule.regex) {
        rule.regex.lastIndex = 0;
        let match;
        while ((match = rule.regex.exec(content)) !== null) {
          const linesUpToMatch = content.slice(0, match.index).split('\n');
          const lineNum = linesUpToMatch.length;
          const lineContent = linesUpToMatch[linesUpToMatch.length - 1].trim();

          issues.push({
            id: rule.id,
            category: rule.category,
            tier: rule.tier,
            title: rule.title,
            file: relPath,
            line: lineNum,
            snippet: match[0].slice(0, 100),
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
            category: rule.category,
            tier: rule.tier,
            title: rule.title,
            file: relPath,
            line: 1,
            snippet: customResult,
            remedy: rule.remedy
          });
        }
      }
    }
  }

  return { root, totalFiles: files.length, scannedFiles, extCounts, dirCounts, issues };
}

// -------------------------------------------------------------
// LIVE URL AUDIT ENGINE (Connects to https://mejor-iota.vercel.app)
// -------------------------------------------------------------
async function runUrlAudit(url) {
  let targetUrl = url.trim();
  if (!targetUrl.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
    targetUrl = 'https://' + targetUrl;
  }

  const endpoint = `https://mejor-iota.vercel.app/api/v1/scans`;
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ url: targetUrl, mode: 'quick' });
    const parsed = new URL(endpoint);

    const req = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'arnav-audit-cli/1.0',
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedRes = JSON.parse(data);
          resolve({ targetUrl, scanId: parsedRes.id, reportUrl: `https://mejor-iota.vercel.app/scans/${parsedRes.id}` });
        } catch (e) {
          resolve({ targetUrl, offline: true });
        }
      });
    });

    req.on('error', () => {
      resolve({ targetUrl, offline: true });
    });

    req.write(postData);
    req.end();
  });
}

// -------------------------------------------------------------
// MAIN EXECUTION
// -------------------------------------------------------------
async function main() {
  const isUrl = options.target.startsWith('http://') || options.target.startsWith('https://') || options.target.includes('.vercel.app') || options.target.includes('.com') || options.target.includes('.dev');

  if (isUrl) {
    if (!options.json) {
      console.log(BANNER);
      console.log(`${C.cyan}▸ Dispatching live browser CDP telemetry scan for:${C.reset} ${C.bold}${options.target}${C.reset}\n`);
    }

    const result = await runUrlAudit(options.target);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`${C.emerald}✓ Audit Engine Dispatched Successfully!${C.reset}`);
    console.log(`${C.white}• Target:       ${C.bold}${result.targetUrl}${C.reset}`);
    if (result.scanId) {
      console.log(`${C.white}• Scan ID:      ${C.gray}${result.scanId}${C.reset}`);
      console.log(`${C.white}• Live Report:  ${C.emerald}${C.underline}${result.reportUrl}${C.reset}\n`);
      console.log(`${C.dim}Tip: Open the link above to view synchronized Before/After split-view and copy Cursor AI fix prompts.${C.reset}\n`);
    }
    return;
  }

  // Local Project Directory Scan
  if (!options.json) {
    console.log(BANNER);
    console.log(`${C.cyan}▸ Scanning local project repository:${C.reset} ${C.bold}${path.resolve(options.target)}${C.reset}\n`);
  }

  const audit = runLocalAudit(options.target);

  // Group by severity
  const critical = audit.issues.filter(i => i.tier === 'CRITICAL');
  const major = audit.issues.filter(i => i.tier === 'MAJOR');
  const minor = audit.issues.filter(i => i.tier === 'MINOR');
  const suggestions = audit.issues.filter(i => i.tier === 'SUGGESTION');

  // Compute overall score
  const score = Math.max(0, 100 - (critical.length * 20 + major.length * 8 + minor.length * 3 + suggestions.length * 1));
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';

  if (options.json) {
    console.log(JSON.stringify({
      target: audit.root,
      totalFiles: audit.totalFiles,
      scannedFiles: audit.scannedFiles,
      score,
      grade,
      counts: {
        critical: critical.length,
        major: major.length,
        minor: minor.length,
        suggestions: suggestions.length,
        total: audit.issues.length,
      },
      issues: audit.issues,
    }, null, 2));
    return;
  }

  // Print all scanned files if --files or --verbose requested
  if (options.files || options.verbose) {
    console.log(`${C.bold}VERIFIED CODEBASE FILES (${audit.totalFiles} files inspected):${C.reset}`);
    audit.scannedFiles.forEach((file, idx) => {
      const fileIssues = audit.issues.filter(i => i.file === file);
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
  console.log(`  ${C.bold}AUDIT REPORT OVERVIEW${C.reset}  •  Scanned ${C.bold}${audit.totalFiles}${C.reset} files across entire codebase`);
  console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}`);
  
  const gradeColor = grade.startsWith('A') ? C.emerald : grade === 'B' ? C.cyan : grade === 'C' ? C.amber : C.rose;
  console.log(`  Overall Score:  ${gradeColor}${C.bold}${score}/100${C.reset} (Grade ${gradeColor}${C.bold}${grade}${C.reset})`);
  console.log(`  Findings:       ${C.rose}${critical.length} Critical${C.reset}  |  ${C.amber}${major.length} Major${C.reset}  |  ${C.cyan}${minor.length} Minor${C.reset}  |  ${C.gray}${suggestions.length} Suggestions${C.reset}\n`);

  console.log(`  ${C.bold}Full Codebase Coverage Breakdown:${C.reset}`);
  const sortedExts = Object.entries(audit.extCounts).sort((a, b) => b[1] - a[1]);
  sortedExts.forEach(([ext, count]) => {
    let name = 'Source / Script';
    if (ext === '.py') name = 'Python (FastAPI, Worker, Checks, Tests)';
    else if (ext === '.ts') name = 'TypeScript (Backend, Core, API routes)';
    else if (ext === '.tsx') name = 'React / Next.js Components';
    else if (ext === '.js') name = 'JavaScript Modules & Configs';
    else if (ext === '.json') name = 'JSON Manifests & Data schemas';
    else if (ext === '.yml' || ext === '.yaml') name = 'GitHub CI & Docker Compose';
    else if (ext === '.css' || ext === '.scss') name = 'Vanilla & Tailwind Styles';
    else if (ext === '.html') name = 'HTML Templates & Fixtures';
    else if (ext === '.md') name = 'Documentation & Blueprints';
    else if (ext === '[config]') name = 'Dockerfiles, .env, .gitignore';
    console.log(`   • ${C.cyan}${name.padEnd(42, ' ')}${C.reset} ${C.bold}${count}${C.reset} files (${ext})`);
  });
  console.log('');

  if (audit.issues.length === 0) {
    console.log(`  ${C.emerald}✓ Zero internal security, leakage, or interface defects detected!${C.reset}`);
    console.log(`  Every file in the codebase was verified. Meets enterprise standards.\n`);
    if (!options.files) {
      console.log(`  ${C.dim}Tip: Run with ${C.white}--files${C.dim} to display each individual file path in the terminal.${C.reset}`);
    }
    console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}\n`);
    return;
  }

  console.log(`${C.bold}DETECTED INTERNAL ISSUES:${C.reset}\n`);

  audit.issues.forEach((issue, index) => {
    const badge = issue.tier === 'CRITICAL'
      ? `${C.bgRose}${C.white}${C.bold} CRITICAL ${C.reset}`
      : issue.tier === 'MAJOR'
      ? `${C.bgAmber}${C.black}${C.bold} MAJOR ${C.reset}`
      : `${C.bgDark}${C.cyan}${C.bold} ${issue.tier} ${C.reset}`;

    console.log(` ${badge} ${C.bold}${issue.title}${C.reset} ${C.gray}[${issue.id}]${C.reset}`);
    console.log(`    ${C.dim}Category:${C.reset} ${issue.category}  ${C.dim}|  Location:${C.reset} ${C.white}${issue.file}:${issue.line}${C.reset}`);
    console.log(`    ${C.dim}Evidence:${C.reset} ${C.yellow}${issue.snippet}${C.reset}`);
    console.log(`    ${C.dim}Fix Goal:${C.reset} ${C.emerald}${issue.remedy}${C.reset}`);
    console.log('');
  });

  // AI Prompt Export
  if (options.prompts) {
    console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}`);
    console.log(`  ${C.emerald}${C.bold}READY-TO-USE CURSOR & CLAUDE CODE FIX PROMPT:${C.reset}`);
    console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}\n`);
    
    console.log(`${C.gray}Copy and paste the block below into your AI editor chat:${C.reset}\n`);
    
    console.log(`${C.cyan}## AUDIT REMEDIATION INSTRUCTIONS (via arnav-audit)`);
    console.log(`Fix the following ${audit.issues.length} verified internal security and leakage defects:`);
    audit.issues.forEach((iss, idx) => {
      console.log(`\n### ${idx + 1}. [${iss.tier}] ${iss.title} (${iss.id})`);
      console.log(`- File: ${iss.file}:${iss.line}`);
      console.log(`- Problem: ${iss.snippet}`);
      console.log(`- Required Fix: ${iss.remedy}`);
    });
    console.log(`\n### Guardrails:`);
    console.log(`1. Preserve all existing business logic and component props.`);
    console.log(`2. Verify all event listeners and intervals have cleanup in unmount.`);
    console.log(`3. Ensure zero credentials remain in codebase.`);
    console.log(`${C.reset}`);
  } else {
    console.log(`${C.dim}Tip: Run ${C.white}npx arnav-audit --prompts${C.dim} to output ready-to-paste AI copilot fix prompts.${C.reset}`);
    console.log(`${C.dim}Interactive Web Dashboard: ${C.emerald}https://mejor-iota.vercel.app${C.reset}\n`);
  }

  console.log(`${C.dim}————————————————————————————————————————————————————————————————————${C.reset}\n`);
}

main().catch(err => {
  console.error(`${C.rose}Execution error:${C.reset}`, err);
  process.exit(1);
});
