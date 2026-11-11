import test from 'node:test';
import assert from 'node:assert/strict';

const configModule = await import('../config.mjs').catch(() => ({}));
const reportModule = await import('../report.mjs').catch(() => ({}));
const { readConfig } = configModule;
const { toMarkdown, evaluateReport } = reportModule;

test('configuration and complete-report gate exist', () => {
  assert.equal(typeof readConfig, 'function');
  assert.equal(typeof toMarkdown, 'function');
  assert.equal(typeof evaluateReport, 'function');
});

test('smoke uses low concurrency and explicit environment values cannot expose secrets', () => {
  const config = readConfig(['--smoke'], { JWT_SECRET: 'must-not-appear', BENCHMARK_TOKEN: 'must-not-appear' });
  assert.equal(config.concurrency, 1);
  assert.equal(config.requests, 50);
  assert.equal(config.rate, 50);
  assert.equal(config.host, '127.0.0.1');
  assert.equal(JSON.stringify(config).includes('must-not-appear'), false);
});

test('CLI overrides template values, accepts only loopback, and rejects malformed input', () => {
  const config = readConfig(['--requests', '80', '--host', 'localhost'], { BENCHMARK_REQUESTS: '60' });
  assert.equal(config.requests, 80);
  assert.equal(config.host, '127.0.0.1');
  for (const argv of [
    ['--host', 'example.com'], ['--host', '0.0.0.0'], ['--smoke', '--concurrency', '3'],
    ['--requests', '0'], ['--requests', 'NaN'], ['--timeout-ms', '0'],
    ['--warmup', '21'], ['--unknown'], ['--requests'], ['--requests', '1', '--requests', '2']
  ]) assert.throws(() => readConfig(argv, {}));
});

test('complete-report gate rejects missing, duplicate, zero-sample or failed endpoints', () => {
  const endpoint = { id: 'one', samples: 50, gate: { passed: true, reasons: [] } };
  const report = { endpoints: [endpoint], failures: [], controls: { defaultLimiter: { passed: true }, invalidToken: { passed: true } } };
  assert.equal(evaluateReport(report, ['one']), true);
  assert.equal(evaluateReport(report, ['one', 'two']), false);
  assert.equal(evaluateReport({ ...report, endpoints: [endpoint, endpoint] }, ['one']), false);
  assert.equal(evaluateReport({ ...report, endpoints: [{ ...endpoint, samples: 0 }] }, ['one']), false);
  assert.equal(evaluateReport({ ...report, endpoints: [{ ...endpoint, gate: { passed: false } }] }, ['one']), false);
  assert.equal(evaluateReport({ ...report, controls: {} }, ['one']), false);
});

test('Markdown makes a failed run visible and retains all requested metrics', () => {
  const markdown = toMarkdown({
    passed: false, generatedAt: '2026-10-21T00:00:00.000Z', mode: 'smoke', config: { requests: 50, concurrency: 1, rate: 50 },
    source: { commit: 'abc123', digest: 'def456', dirty: true }, environment: {}, controls: {}, failures: ['coverage missing'],
    endpoints: [{
      id: 'one', method: 'GET', route: '/api/example', samples: 50, requestBytes: 0,
      latencyMs: { p50: 1, p95: 2, p99: 3 }, ttfbMs: { p50: 0.5, p95: 1, p99: 2, samples: 50 },
      rps: { sustained: 50, peak: 55, peakWindowMs: 1000 }, errorRatePct: 0, gate: { passed: false, reasons: ['coverage missing'] }
    }]
  });
  for (const text of ['FAIL', 'p50', 'p95', 'p99', 'TTFB', 'Peak', 'Sustained', 'Error', 'abc123', 'coverage missing', 'in-memory']) {
    assert.ok(markdown.includes(text), text);
  }
});
