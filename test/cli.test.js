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

console.log('\nAll 5 tests passed successfully!');
