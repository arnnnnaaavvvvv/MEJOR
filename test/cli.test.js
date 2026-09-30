const assert = require('assert');
const { execSync } = require('child_process');
const path = require('path');

const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');

console.log('Running test suite for arnav-audit CLI...\n');

// Test 1: --help returns help text with banner and usage
{
  const output = execSync(`node "${cliPath}" --help`).toString();
  assert(output.includes('USAGE:'), 'Help output must include USAGE:');
  assert(output.includes('arnav-audit'), 'Help output must include arnav-audit');
  assert(!output.includes('https://mejor-iota.vercel.app'), 'Help output must NOT include live web URL');
  assert(!output.includes('[https://url]'), 'Help output must NOT mention URL scanning');
  console.log('✓ Test 1: --help flag displays clean, URL-free documentation');
}

// Test 2: --version returns package version
{
  const output = execSync(`node "${cliPath}" --version`).toString().trim();
  assert(output.startsWith('arnav-audit v'), 'Version output must start with arnav-audit v');
  console.log('✓ Test 2: --version flag works correctly');
}

// Test 3: Reject URL targets with clean informative error
{
  let failed = false;
  try {
    execSync(`node "${cliPath}" https://example.com`, { stdio: 'pipe' });
  } catch (err) {
    failed = true;
    const stderr = err.stderr.toString();
    assert(stderr.includes('URL scanning is not supported'), 'Must mention URL scanning is not supported');
    assert(err.status === 1, 'Process must exit with code 1');
  }
  assert(failed, 'Should throw error when target is a URL');
  console.log('✓ Test 3: Correctly rejects URL input with descriptive guidance');
}

// Test 4: --json outputs valid JSON
{
  const output = execSync(`node "${cliPath}" "${__dirname}" --json`).toString();
  const parsed = JSON.parse(output);
  assert(typeof parsed.score === 'number', 'JSON report must have numeric score');
  assert(Array.isArray(parsed.issues), 'JSON report must have issues array');
  assert(typeof parsed.totalFiles === 'number', 'JSON report must have totalFiles');
  console.log('✓ Test 4: --json flag outputs valid machine-readable JSON');
}

// Test 5: Local scan works
{
  const output = execSync(`node "${cliPath}" "${__dirname}"`).toString();
  assert(output.includes('AUDIT REPORT OVERVIEW'), 'Must include audit report overview');
  assert(!output.includes('Interactive Web Dashboard'), 'Must NOT mention interactive web dashboard');
  console.log('✓ Test 5: Local audit scan executes cleanly');
}

// Test 6: Detects secret gateway leaks (Database URIs and JWT secrets)
{
  const fs = require('fs');
  const tmpDir = path.join(__dirname, 'tmp_secret_test');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const testFile = path.join(tmpDir, 'gateway.config.js');
  // Base64-encoded fixture payload to keep test runner source file clean
  const fixture = Buffer.from(
    'Y29uc3QgREFUQUJBU0VfVVJMID0gInBvc3RncmVzcWw6Ly9kYnVzZXI6c3VwZXJzZWNyZXRwYXNzQGRiLmV4YW1wbGUuaW50ZXJuYWw6NTQzMi9wcm9kdWN0aW9uIjsKICAgIGNvbnN0IEpXVF9TRUNSRVQgPSAibXlfaGFyZGNvZGVkX2p3dF9zZWNyZXRfdG9rZW5fMTIzNDUiOw==',
    'base64'
  ).toString('utf8');
  fs.writeFileSync(testFile, fixture);

  try {
    const output = execSync(`node "${cliPath}" "${tmpDir}" --json`).toString();
    const parsed = JSON.parse(output);
    const ids = parsed.issues.map(i => i.id);
    assert(ids.includes('SEC-GATEWAY-DATABASE-URI'), 'Should detect hardcoded DB gateway URI');
    assert(ids.includes('SEC-GATEWAY-JWT-SECRET'), 'Should detect hardcoded JWT secret');
    assert(parsed.score < 100, 'Score should reflect detected critical gateway leaks');
    console.log('✓ Test 6: Correctly detects secret gateway & database credential leaks');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// Test 7: Detects backend weak points in Python (SQLi, debug mode, SSL verify disabled, pickle deserialization)
{
  const fs = require('fs');
  const tmpDir = path.join(__dirname, 'tmp_backend_test');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const testPyFile = path.join(tmpDir, 'service.py');
  // Base64-encoded fixture payload to keep test runner source file clean
  const fixture = Buffer.from(
    'aW1wb3J0IHBpY2tsZQppbXBvcnQgcmVxdWVzdHMKCkRFQlVHID0gVHJ1ZQoKZGVmIGdldF91c2VyKGRiLCB1c2VyX2lkKToKICAgIHF1ZXJ5ID0gZiJTRUxFQ1QgKiBGUk9NIHVzZXJzIFdIRVJFIGlkID0ge3VzZXJfaWR9IgogICAgcmV0dXJuIGRiLmV4ZWN1dGUoZiJTRUxFQ1QgKiBGUk9NIHVzZXJzIFdIRVJFIGlkID0ge3VzZXJfaWR9IikKCmRlZiBmZXRjaF9kYXRhKHVybCk6CiAgICByZXNwb25zZSA9IHJlcXVlc3RzLmdldCh1cmwsIHZlcmlmeT1GYWxzZSkKICAgIHJldHVybiBwaWNrbGUubG9hZHMocmVzcG9uc2UuY29udGVudCkK',
    'base64'
  ).toString('utf8');
  fs.writeFileSync(testPyFile, fixture);

  try {
    const output = execSync(`node "${cliPath}" "${tmpDir}" --json`).toString();
    const parsed = JSON.parse(output);
    const ids = parsed.issues.map(i => i.id);
    assert(ids.includes('SEC-BACKEND-DEBUG-ENABLED'), 'Should detect DEBUG = True in backend');
    assert(ids.includes('SEC-BACKEND-SQL-INJECTION'), 'Should detect Python SQL injection f-string');
    assert(ids.includes('SEC-BACKEND-SSL-VERIFY-DISABLED'), 'Should detect verify=False in requests');
    assert(ids.includes('SEC-BACKEND-INSECURE-DESERIALIZE'), 'Should detect unsafe pickle deserialization');
    console.log('✓ Test 7: Correctly detects backend weak points in Python services');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// Test 8: Single file auditing works seamlessly
{
  const targetFile = path.resolve(__dirname, '..', 'package.json');
  const output = execSync(`node "${cliPath}" "${targetFile}" --json`).toString();
  const parsed = JSON.parse(output);
  assert(parsed.totalFiles === 1, 'Should scan exactly 1 file when single file passed');
  assert(parsed.scannedFiles[0] === 'package.json', 'Scanned file should match package.json');
  console.log('✓ Test 8: Single file target auditing works seamlessly');
}

// Test 9: --backend-only flag filters out non-backend rules
{
  const fs = require('fs');
  const tmpDir = path.join(__dirname, 'tmp_flag_test');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const htmlFile = path.join(tmpDir, 'page.html');
  const pyFile = path.join(tmpDir, 'app.py');
  fs.writeFileSync(htmlFile, '<button><svg /></button>'); // UI trap
  fs.writeFileSync(pyFile, Buffer.from('REVCVUcgPSBUcnVlCg==', 'base64').toString('utf8')); // Backend trap

  try {
    const output = execSync(`node "${cliPath}" "${tmpDir}" --backend-only --json`).toString();
    const parsed = JSON.parse(output);
    const ids = parsed.issues.map(i => i.id);
    assert(ids.includes('SEC-BACKEND-DEBUG-ENABLED'), 'Should include backend debug issue');
    assert(!ids.includes('A11Y-ICON-UNANNOUNCED'), 'Should NOT include UI/accessibility issue with --backend-only');
    console.log('✓ Test 9: --backend-only flag successfully isolates backend vulnerabilities');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// Test 10: --prompts generates actionable AI copilot fix prompts
{
  const fs = require('fs');
  const tmpDir = path.join(__dirname, 'tmp_prompt_test');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const testFile = path.join(tmpDir, 'config.py');
  fs.writeFileSync(testFile, Buffer.from('REVCVUcgPSBUcnVlCg==', 'base64').toString('utf8'));

  try {
    const output = execSync(`node "${cliPath}" "${tmpDir}" --prompts`).toString();
    assert(output.includes('READY-TO-USE AI FIX PROMPT'), 'Must output prompt header');
    assert(output.includes('AUDIT REMEDIATION INSTRUCTIONS'), 'Must include remediation title');
    assert(output.includes('Required Fix:'), 'Must include required fix');
    console.log('✓ Test 10: --prompts generates high-quality AI copilot instructions');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

console.log('\nAll 10 tests passed successfully with 100% verification!');

