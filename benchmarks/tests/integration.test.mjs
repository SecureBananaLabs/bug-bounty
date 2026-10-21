import test from 'node:test';
import assert from 'node:assert/strict';
import { requestOnce, runLoad, evaluateEndpoint, validateCoverage } from '../core.mjs';

const integration = await import('../server.mjs').catch(() => ({}));
const manifest = await import('../scenarios.mjs').catch(() => ({}));
const { startServer, prepareScenario, checkDefaultLimiter } = integration;

test('isolated benchmark server is implemented', () => {
  assert.equal(typeof startServer, 'function');
  assert.equal(typeof prepareScenario, 'function');
  assert.equal(typeof checkDefaultLimiter, 'function');
});

test('all 20 real API operations pass semantic preflight in fresh processes', async () => {
  assert.equal(manifest.scenarios?.length, 20);
  for (const scenario of manifest.scenarios) {
    const server = await startServer();
    try {
      const thresholds = Object.fromEntries(manifest.scenarios.map((item) => [item.id, { p99Ms: 500, maxErrorRatePct: 0, minSamples: 1 }]));
      validateCoverage(server.routes, manifest.scenarios, thresholds);
      const context = await prepareScenario(server, scenario, { warmup: 0, timeoutMs: 1000 });
      const sample = await requestOnce({ url: server.url, scenario, context, timeoutMs: 1000 });
      assert.equal(sample.ok, true, `${scenario.id}: ${JSON.stringify(sample)}`);
    } finally { await server.stop(); }
  }
});

test('the four required scenarios produce real measurements after preflight', async () => {
  for (const id of ['jobs-list', 'admin-metrics', 'jobs-create', 'uploads-create']) {
    const scenario = manifest.scenarios.find((item) => item.id === id);
    const server = await startServer();
    try {
      const context = await prepareScenario(server, scenario, { warmup: 1, timeoutMs: 1000 });
      const result = await runLoad({ url: server.url, scenario, context, timeoutMs: 1000, requests: 10, concurrency: 2, rate: 0 });
      assert.equal(result.samples, 10, id);
      assert.equal(result.errorRatePct, 0, id);
      assert.equal(result.ttfbMs.samples, 10, id);
      assert.equal(evaluateEndpoint(result, { p99Ms: 1000, maxErrorRatePct: 0, minSamples: 10 }, 10).passed, true, id);
    } finally { await server.stop(); }
  }
});

test('an incorrect JWT really returns 401 and cannot pass', async () => {
  const server = await startServer();
  try {
    const scenario = manifest.scenarios.find((item) => item.id === 'admin-metrics');
    const sample = await requestOnce({ url: server.url, scenario, context: { token: 'invalid.jwt.signature' }, timeoutMs: 1000 });
    assert.equal(sample.statusCode, 401);
    assert.equal(sample.ok, false);
  } finally { await server.stop(); }
});

test('a fresh process clears module singleton records; createApp alone is not relied on', async () => {
  const first = await startServer();
  const create = manifest.scenarios.find((item) => item.id === 'jobs-create');
  const list = manifest.scenarios.find((item) => item.id === 'jobs-list');
  try {
    await prepareScenario(first, create, { warmup: 0, timeoutMs: 1000 });
    const sample = await requestOnce({ url: first.url, scenario: list, context: {}, timeoutMs: 1000 });
    assert.equal(sample.ok, true);
  } finally { await first.stop(); }
  const second = await startServer();
  try {
    const sample = await requestOnce({
      url: second.url, scenario: { ...list, validate: (data) => Array.isArray(data) && data.length === 0 }, context: {}, timeoutMs: 1000
    });
    assert.equal(sample.ok, true);
  } finally { await second.stop(); }
});

test('production default remains 200 requests per 900 seconds and blocks request 201', async () => {
  const result = await checkDefaultLimiter();
  assert.deepEqual(result, { passed: true, allowed: 200, blockedStatus: 429, policy: '200;w=900' });
});

test('benchmark mode permits the bounded workload beyond request 200', async () => {
  const server = await startServer();
  try {
    const scenario = manifest.scenarios.find((item) => item.id === 'admin-metrics');
    const result = await runLoad({ url: server.url, scenario, context: { token: server.token }, timeoutMs: 1000, requests: 205, concurrency: 2, rate: 0 });
    assert.equal(result.samples, 205);
    assert.equal(result.errorCount, 0);
  } finally { await server.stop(); }
});

test('server launcher rejects remote binds and invalid modes', async () => {
  await assert.rejects(startServer({ host: '0.0.0.0' }), /loopback/);
  await assert.rejects(startServer({ mode: 'production-disabled-limiter' }), /mode/);
});
