import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateThresholds, percentile, summarize } from '../metrics.mjs';

const sample = (overrides = {}) => ({
  durationMs: 20,
  ttfbMs: 5,
  completedAtMs: 50,
  statusCode: 200,
  expectedStatus: 200,
  error: false,
  ...overrides
});
const nullPercentiles = { p50: null, p95: null, p99: null };

test('nearest-rank percentiles preserve observations, boundaries and input order', () => {
  const values = [40, 10, 30, 20];
  assert.equal(percentile(values, 0), 10);
  assert.equal(percentile(values, 50), 20);
  assert.equal(percentile(values, 95), 40);
  assert.equal(percentile(values, 100), 40);
  assert.deepEqual(values, [40, 10, 30, 20]);
  const hundred = Array.from({ length: 100 }, (_, index) => index + 1).reverse();
  assert.equal(percentile(hundred, 95), 95);
  assert.equal(percentile(hundred, 99), 99);
  assert.equal(percentile([7], 99), 7);
  assert.equal(percentile([], 99), null);
  assert.throws(() => percentile([1, NaN], 50), TypeError);
  assert.throws(() => percentile([1], 101), RangeError);
});

test('HTTP failures, unexpected success statuses and network timeouts cannot count as success', () => {
  const summary = summarize([
    sample(),
    sample({ durationMs: 40, ttfbMs: 10, statusCode: 201, expectedStatus: 201 }),
    sample({ durationMs: 999, statusCode: 404, expectedStatus: 404 }),
    sample({ durationMs: 999, statusCode: 429, expectedStatus: 429 }),
    sample({ durationMs: 999, statusCode: 500, expectedStatus: 500 }),
    sample({ durationMs: 999, statusCode: 201 }),
    sample({ durationMs: 1000, statusCode: null, ttfbMs: null, error: 'timeout' }),
    sample({ durationMs: 999, statusCode: 200, error: 'response aborted' })
  ], 1000);
  assert.equal(summary.total, 8);
  assert.equal(summary.succeeded, 2);
  assert.equal(summary.errors, 6);
  assert.equal(summary.errorRate, 0.75);
  assert.deepEqual(summary.latencyMs, { p50: 20, p95: 40, p99: 40 });
  assert.deepEqual(summary.ttfbMs, { p50: 5, p95: 10, p99: 10 });
  assert.deepEqual(summary.statusCounts, { 200: 2, 201: 2, 404: 1, 429: 1, 500: 1 });
  assert.equal(summary.sustainedRps, 8);
  assert.equal(summary.peakRps, 80);
});

test('a status alone is not a complete timed success', () => {
  const summary = summarize([
    sample({ ttfbMs: null }),
    sample({ durationMs: 10, ttfbMs: 20 })
  ], 100);
  assert.equal(summary.succeeded, 0);
  assert.equal(summary.errors, 2);
  assert.deepEqual(summary.latencyMs, nullPercentiles);
  assert.deepEqual(summary.ttfbMs, nullPercentiles);
});

test('empty and zero-length windows yield zero throughput and no invented latency', () => {
  for (const elapsed of [0, 1000]) {
    assert.deepEqual(summarize([], elapsed), {
      total: 0, succeeded: 0, errors: 0, errorRate: 0,
      latencyMs: nullPercentiles, ttfbMs: nullPercentiles,
      sustainedRps: 0, peakRps: 0, statusCounts: {}
    });
  }
  assert.throws(() => summarize([sample({ completedAtMs: 0 })], 0), RangeError);
  assert.throws(() => summarize([], -1), RangeError);
  assert.throws(() => summarize([], Infinity), RangeError);
  assert.throws(() => summarize([], 100, { bucketMs: 0 }), RangeError);
  assert.throws(() => summarize([sample({ completedAtMs: 101 })], 100), TypeError);
});

test('peak RPS uses a partial tail bucket actual width, including the measurement endpoint', () => {
  const summary = summarize([
    sample({ completedAtMs: 0 }),
    sample({ completedAtMs: 100 }),
    sample({ completedAtMs: 200 }),
    sample({ completedAtMs: 250 })
  ], 250);
  assert.equal(summary.sustainedRps, 16);
  assert.equal(summary.peakRps, 40); // Two completions in the final 50 ms.
  assert.equal(summarize([sample({ completedAtMs: 200 })], 200).peakRps, 10);
  assert.equal(summarize([sample({ completedAtMs: 10 })], 10).peakRps, 100);
  assert.equal(summarize([
    sample({ completedAtMs: 20 }), sample({ completedAtMs: 60 })
  ], 100, { bucketMs: 50 }).peakRps, 20);
});

test('thresholds accept exact limits and report latency and error-rate regressions independently', () => {
  const results = [{ id: 'health', ...summarize([
    sample({ durationMs: 30 }), sample({ statusCode: 429 })
  ], 100) }];
  assert.deepEqual(evaluateThresholds(results, { health: { p99Ms: 30, maxErrorRate: 0.5 } }), []);
  const violations = evaluateThresholds(results, { health: { p99Ms: 29, maxErrorRate: 0 } });
  assert.equal(violations.length, 2);
  assert.match(violations[0], /health.*p99.*30.*29/);
  assert.match(violations[1], /health.*error rate.*0.5.*0/);
});

test('a permissive error threshold cannot hide a missing successful latency sample', () => {
  const thresholds = { health: { p99Ms: 1000, maxErrorRate: 1 } };
  for (const samples of [[], [sample({ statusCode: 404 })]]) {
    const violations = evaluateThresholds([{ id: 'health', ...summarize(samples, 100) }], thresholds);
    assert.equal(violations.length, 1);
    assert.match(violations[0], /no valid successful-response p99/);
  }
});

test('missing, unknown and malformed thresholds fail closed instead of silently disabling gates', () => {
  const results = [{ id: 'health', ...summarize([sample()], 100) }];
  const valid = { p99Ms: 100, maxErrorRate: 0 };
  const invalidConfigurations = [
    null, [], {}, { health: null }, { health: {} },
    { health: { p99Ms: 100 } }, { health: { maxErrorRate: 0 } },
    { health: { ...valid, p99Ms: 0 } },
    { health: { ...valid, p99Ms: '100' } },
    { health: { ...valid, p99Ms: Infinity } },
    { health: { ...valid, maxErrorRate: NaN } },
    { health: { ...valid, maxErrorRate: -0.1 } },
    { health: { ...valid, maxErrorRate: 1.1 } },
    { health: { ...valid, maxLatencyMs: 100 } },
    { health: valid, nonexistent: valid }
  ];
  for (const thresholds of invalidConfigurations) {
    assert.ok(evaluateThresholds(results, thresholds).length > 0);
  }
  assert.ok(evaluateThresholds([], {}).length > 0);
  assert.ok(evaluateThresholds([results[0], results[0]], { health: valid }).some((v) => /duplicate/.test(v)));
  assert.ok(evaluateThresholds([{ ...results[0], errorRate: NaN }], { health: valid }).some((v) => /invalid measured/.test(v)));
});
