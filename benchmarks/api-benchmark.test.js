import { describe, it } from "node:test";
import assert from "node:assert";

// Inline copy of computeStats from api-benchmark.js (for testing)
function computeStats(results) {
  const latencies = results.map((r) => r.latency).filter((l) => l > 0);
  const errors = results.filter((r) => r.status === 0 || r.status >= 400);
  const successes = results.filter((r) => r.status >= 200 && r.status < 400);

  if (latencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, rps: 0, errorRate: 100, ttfbAvg: 0 };
  }

  latencies.sort((a, b) => a - b);
  const totalTime = Math.max(...latencies) - Math.min(...latencies);

  const percentile = (arr, p) => {
    const idx = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, idx)];
  };

  const rps = (latencies.length / (totalTime || 1)) * 1000;
  const ttfbAvg =
    successes.reduce((sum, r) => sum + r.ttfb, 0) / (successes.length || 1);

  return {
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    rps: Math.round(rps * 10) / 10,
    errorRate: Math.round((errors.length / results.length) * 10000) / 100,
    ttfbAvg: Math.round(ttfbAvg),
  };
}

describe("computeStats (from api-benchmark.js)", () => {
  it("should compute correct percentiles for normal distribution", () => {
    const results = [];
    // Generate 100 results with known latencies
    for (let i = 0; i < 50; i++) results.push({ latency: 50, status: 200, ttfb: 40 });
    for (let i = 0; i < 45; i++) results.push({ latency: 150, status: 200, ttfb: 120 });
    for (let i = 0; i < 5; i++) results.push({ latency: 300, status: 200, ttfb: 240 });

    const stats = computeStats(results);

    assert.strictEqual(stats.p50, 50);
    assert.strictEqual(stats.p95, 150);
    assert.strictEqual(stats.p99, 300);
    assert.strictEqual(stats.errorRate, 0);
  });

  it("should compute correct error rate", () => {
    const results = [];
    for (let i = 0; i < 90; i++) results.push({ latency: 100, status: 200, ttfb: 80 });
    for (let i = 0; i < 10; i++) results.push({ latency: 0, status: 500, ttfb: 0 }); // errors

    const stats = computeStats(results);

    assert.strictEqual(stats.errorRate, 10);
  });

  it("should handle empty results", () => {
    const stats = computeStats([]);

    assert.strictEqual(stats.p50, 0);
    assert.strictEqual(stats.p95, 0);
    assert.strictEqual(stats.p99, 0);
    assert.strictEqual(stats.rps, 0);
    assert.strictEqual(stats.errorRate, 100);
  });

  it("should compute RPS correctly", () => {
    const results = [];
    for (let i = 0; i < 100; i++) results.push({ latency: 100, status: 200, ttfb: 80 });

    const stats = computeStats(results);
    assert.ok(stats.rps > 0);
  });

  it("should handle all errors", () => {
    const results = [];
    for (let i = 0; i < 100; i++) results.push({ latency: 0, status: 0, ttfb: 0, error: "TIMEOUT" });

    const stats = computeStats(results);

    assert.strictEqual(stats.errorRate, 100);
    assert.strictEqual(stats.p50, 0);
  });
});
