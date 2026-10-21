import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { scenarios } from '../scenarios.mjs';

const runner = fileURLToPath(new URL('../run.mjs', import.meta.url));

async function invoke(t, extra = [], endpointThresholds, secretProbe = false) {
  const directory = await mkdtemp(path.join(tmpdir(), 'api-benchmark-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const thresholds = path.join(directory, 'thresholds.json');
  await writeFile(thresholds, JSON.stringify({ version: 1, endpoints: endpointThresholds ?? Object.fromEntries(scenarios.map((scenario) => [scenario.id, { p99Ms: 1000, maxErrorRatePct: 0, minSamples: 1 }])) }));
  const child = spawn(process.execPath, [runner, '--smoke', '--requests', '1', '--rate', '0', '--warmup', '0', '--thresholds', thresholds, '--output', directory, ...extra], {
    env: { ...process.env, ...(secretProbe ? { JWT_SECRET: 'DO_NOT_REPORT_JWT_91827', DATABASE_URL: 'DO_NOT_REPORT_DB_91827', STRIPE_SECRET_KEY: 'DO_NOT_REPORT_STRIPE_91827' } : {}) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  const deadline = setTimeout(() => child.kill('SIGKILL'), 30000);
  t.after(() => { clearTimeout(deadline); if (child.exitCode === null) child.kill('SIGKILL'); });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  clearTimeout(deadline);
  return { code, output, directory };
}

test('CLI rejects a remote target before traffic and exits 2', async (t) => {
  const result = await invoke(t, ['--host', 'example.com']);
  assert.equal(result.code, 2, result.output);
  assert.match(result.output, /loopback/);
});

test('missing thresholds produce a failed JSON/Markdown report and exit 1', async (t) => {
  const result = await invoke(t, [], {});
  assert.equal(result.code, 1, result.output);
  const json = JSON.parse(await readFile(path.join(result.directory, 'latest.json'), 'utf8'));
  assert.equal(json.passed, false);
  assert.ok(json.failures.some((message) => /threshold/.test(message)));
  assert.match(await readFile(path.join(result.directory, 'latest.md'), 'utf8'), /Result: FAIL/);
});

test('all endpoint results are present and reports never include inherited credentials', async (t) => {
  const result = await invoke(t, [], undefined, true);
  assert.equal(result.code, 0, result.output);
  const text = await readFile(path.join(result.directory, 'latest.json'), 'utf8');
  const markdown = await readFile(path.join(result.directory, 'latest.md'), 'utf8');
  assert.equal((text + markdown + result.output).includes('DO_NOT_REPORT_'), false);
  assert.equal(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text + markdown + result.output), false);
  const report = JSON.parse(text);
  assert.equal(report.passed, true);
  assert.equal(report.endpoints.length, 20);
  assert.equal(new Set(report.endpoints.map((endpoint) => endpoint.id)).size, 20);
  assert.ok(report.endpoints.every((endpoint) => endpoint.samples === 1 && endpoint.ttfbMs.samples === 1));
  assert.equal(report.source.digest.length, 64);
});

test('a failing p99 threshold propagates through the CLI exit code and both report formats', async (t) => {
  const thresholds = Object.fromEntries(scenarios.map((scenario) => [scenario.id, { p99Ms: 0.000001, maxErrorRatePct: 0, minSamples: 1 }]));
  const result = await invoke(t, [], thresholds);
  assert.equal(result.code, 1, result.output);
  const report = JSON.parse(await readFile(path.join(result.directory, 'latest.json'), 'utf8'));
  assert.equal(report.passed, false);
  assert.equal(report.endpoints.length, 20);
  assert.ok(report.endpoints.every((endpoint) => endpoint.gate.passed === false));
  assert.match(await readFile(path.join(result.directory, 'latest.md'), 'utf8'), /p99 exceeds/);
});
