import test from "node:test";
import assert from "node:assert/strict";
import { percentile, renderMarkdownReport, summarizeSamples } from "../lib/metrics.mjs";

test("percentile returns the nearest ranked sample", () => {
  const samples = [10, 20, 30, 40, 50];

  assert.equal(percentile(samples, 50), 30);
  assert.equal(percentile(samples, 95), 50);
  assert.equal(percentile(samples, 99), 50);
});

test("summarizeSamples calculates latency, TTFB, RPS, and error rate", () => {
  const summary = summarizeSamples(
    [
      { status: 200, latencyMs: 10, ttfbMs: 4, completedAtMs: 1000 },
      { status: 201, latencyMs: 20, ttfbMs: 6, completedAtMs: 1100 },
      { status: 500, latencyMs: 30, ttfbMs: 8, completedAtMs: 1200 }
    ],
    1500
  );

  assert.equal(summary.requests, 3);
  assert.equal(summary.errors, 1);
  assert.equal(summary.errorRatePercent, 33.33);
  assert.deepEqual(summary.latencyMs, { p50: 20, p95: 30, p99: 30 });
  assert.deepEqual(summary.ttfbMs, { p50: 6, p95: 8, p99: 8 });
  assert.equal(summary.rps.sustained, 2);
  assert.equal(summary.rps.peak, 3);
  assert.deepEqual(summary.statusCodes, { "200": 1, "201": 1, "500": 1 });
});

test("renderMarkdownReport emits a valid markdown table row", () => {
  const markdown = renderMarkdownReport({
    generatedAt: "2026-05-17T00:00:00.000Z",
    mode: "smoke",
    target: "local-auto-start",
    requestsPerEndpoint: 2,
    concurrency: 1,
    endpoints: [
      {
        name: "health",
        method: "GET",
        path: "/health",
        latencyMs: { p50: 1, p95: 2, p99: 3 },
        ttfbMs: { p50: 1, p95: 2, p99: 3 },
        rps: { sustained: 10, peak: 2 },
        errorRatePercent: 0,
        statusCodes: { "200": 2 }
      }
    ]
  });

  assert.match(markdown, /\| Endpoint \| Method \| Path \|/);
  assert.match(markdown, /\| health \| GET \| \/health \| 1 \| 2 \| 3 \|/);
});
