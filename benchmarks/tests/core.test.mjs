import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const core = await import('../core.mjs').catch(() => ({}));
const { requestOnce, runLoad, summarize, validateCoverage, evaluateEndpoint } = core;

async function fixture(t, handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  return `http://127.0.0.1:${server.address().port}`;
}

const scenario = {
  id: 'example', method: 'GET', route: '/api/example', path: '/api/example',
  expectedStatus: 200, build: () => ({}), validate: (data) => data?.ok === true
};
const threshold = { p99Ms: 200, maxErrorRatePct: 0, minSamples: 1 };

test('measurement core exists', () => {
  for (const name of ['requestOnce', 'runLoad', 'summarize', 'validateCoverage', 'evaluateEndpoint']) {
    assert.equal(typeof core[name], 'function', `${name} must be implemented`);
  }
});

test('first byte precedes complete response body; neither is substituted for the other', async (t) => {
  const url = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.flushHeaders();
    setTimeout(() => res.end(JSON.stringify({ success: true, data: { ok: true } })), 100);
  });
  const sample = await requestOnce({ url, scenario, context: {}, timeoutMs: 1000 });
  assert.equal(sample.ok, true);
  assert.ok(sample.durationMs >= 90, JSON.stringify(sample));
  assert.ok(sample.ttfbMs < sample.durationMs - 60, JSON.stringify(sample));
});

for (const status of [401, 429, 500]) {
  test(`HTTP ${status} cannot pass a zero-error gate`, async (t) => {
    const url = await fixture(t, (_req, res) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: false }));
    });
    const sample = await requestOnce({ url, scenario, context: {}, timeoutMs: 500 });
    assert.equal(sample.ok, false);
    assert.equal(sample.statusCode, status);
    const result = summarize([sample], 100);
    assert.equal(result.errorRatePct, 100);
    assert.equal(evaluateEndpoint(result, threshold, 1).passed, false);
  });
}

test('a deadline covers a response that never finishes and counts as an error', async (t) => {
  const url = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.flushHeaders();
    res.write('{');
  });
  const sample = await requestOnce({ url, scenario, context: {}, timeoutMs: 50 });
  assert.equal(sample.ok, false);
  assert.equal(sample.error, 'timeout');
  assert.ok(sample.durationMs >= 40 && sample.durationMs < 500);
  assert.equal(evaluateEndpoint(summarize([sample], 100), threshold, 1).passed, false);
});

test('a successful status with invalid semantics is an error', async (t) => {
  const url = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { ok: false } }));
  });
  const sample = await requestOnce({ url, scenario, context: {}, timeoutMs: 500 });
  assert.equal(sample.error, 'semantic');
  assert.equal(sample.ok, false);
});

test('invalid JSON cannot pass', async (t) => {
  const url = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('not-json');
  });
  const sample = await requestOnce({ url, scenario, context: {}, timeoutMs: 500 });
  assert.equal(sample.ok, false);
  assert.equal(sample.error, 'invalid-json');
});

test('remote destinations and request-path escapes are rejected before any request', async () => {
  await assert.rejects(requestOnce({ url: 'https://example.com', scenario, context: {}, timeoutMs: 50 }), /loopback/);
  await assert.rejects(requestOnce({ url: 'http://127.0.0.1:1', scenario: { ...scenario, path: 'http://example.com/api/example' }, context: {}, timeoutMs: 50 }), /path/);
});

test('artificial server delay triggers a p99 regression', async (t) => {
  const url = await fixture(t, (_req, res) => setTimeout(() => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { ok: true } }));
  }, 80));
  const result = await runLoad({ url, scenario, context: {}, requests: 5, concurrency: 1, rate: 0, timeoutMs: 500 });
  const gate = evaluateEndpoint(result, { ...threshold, p99Ms: 30 }, 5);
  assert.equal(result.errorCount, 0);
  assert.ok(result.latencyMs.p99 >= 70);
  assert.equal(gate.passed, false);
  assert.ok(gate.reasons.some((reason) => reason.includes('p99')));
});

test('percentiles use nearest rank; rates use observed elapsed time and complete one-second windows', () => {
  const samples = Array.from({ length: 100 }, (_, i) => ({
    ok: true, statusCode: 200, durationMs: i + 1, ttfbMs: (i + 1) / 2,
    completedAtMs: i < 80 ? 10 + i * 10 : 1000 + i
  }));
  const result = summarize(samples, 2000);
  assert.deepEqual(result.latencyMs, { p50: 50, p95: 95, p99: 99 });
  assert.equal(result.rps.sustained, 50);
  assert.equal(result.rps.peak, 80);
  assert.equal(result.rps.peakWindowMs, 1000);
  assert.equal(result.ttfbMs.p99, 49.5);
});

test('zero samples, nonfinite metrics and incomplete sample budgets fail closed', () => {
  const empty = summarize([], 100);
  assert.equal(empty.latencyMs.p99, null);
  assert.equal(evaluateEndpoint(empty, threshold, 1).passed, false);
  const valid = summarize([{ ok: true, statusCode: 200, durationMs: 1, ttfbMs: 0.5, completedAtMs: 1 }], 10);
  assert.equal(evaluateEndpoint(valid, threshold, 2).passed, false);
  assert.equal(evaluateEndpoint({ ...valid, latencyMs: { ...valid.latencyMs, p99: NaN } }, threshold, 1).passed, false);
});

test('missing or duplicate routes and missing or malformed thresholds are not accepted', () => {
  const routes = [{ method: 'GET', route: '/api/example' }];
  const thresholds = { example: threshold };
  assert.doesNotThrow(() => validateCoverage(routes, [scenario], thresholds));
  assert.throws(() => validateCoverage([...routes, { method: 'POST', route: '/api/extra' }], [scenario], thresholds), /coverage/);
  assert.throws(() => validateCoverage(routes, [scenario, scenario], thresholds), /duplicate/);
  assert.throws(() => validateCoverage(routes, [scenario], {}), /threshold/);
  assert.throws(() => validateCoverage(routes, [scenario], { example: { ...threshold, p99Ms: null } }), /threshold/);
  assert.throws(() => validateCoverage(routes, [scenario], { example: threshold, unused: threshold }), /threshold/);
});

test('invalid load settings fail before creating traffic', async () => {
  for (const overrides of [{ requests: 0 }, { requests: 10001 }, { concurrency: 0 }, { concurrency: 33 }, { rate: -1 }, { timeoutMs: 0 }]) {
    await assert.rejects(runLoad({ url: 'http://127.0.0.1:1', scenario, context: {}, requests: 5, concurrency: 1, rate: 0, timeoutMs: 50, ...overrides }), /configuration/);
  }
});

test('an overflowing pacing schedule is rejected before any HTTP traffic', async (t) => {
  let received = 0;
  const url = await fixture(t, (_req, res) => {
    received++;
    res.end(JSON.stringify({ success: true, data: { ok: true } }));
  });
  await assert.rejects(runLoad({
    url, scenario, context: {}, requests: 2, concurrency: 1, rate: 1e-9, timeoutMs: 500
  }), /pacing schedule/);
  assert.equal(received, 0);
});

test('unpaced and fractional rates remain valid within the timer range', () => {
  const options = { requests: 1000, concurrency: 1, timeoutMs: 500 };
  for (const rate of [0, 0.5, 100]) {
    assert.doesNotThrow(() => core.validateLoad({ ...options, rate }));
  }
  assert.doesNotThrow(() => core.validateLoad({ ...options, requests: 1, rate: 1e-9 }));
});
