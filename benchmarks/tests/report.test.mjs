import test from "node:test";
import assert from "node:assert/strict";

import { buildMarkdownReport, evaluateThresholds } from "../lib/report.mjs";

test("evaluateThresholds flags p99 and error-rate regressions", () => {
  const results = [
    { id: "GET /health", p99Ms: 50, errorRate: 0, requestsPerSecond: 100, ttfbP95Ms: 20 },
    { id: "POST /api/jobs", p99Ms: 900, errorRate: 0.02, requestsPerSecond: 8, ttfbP95Ms: 300 },
  ];
  const thresholds = {
    defaults: { maxP99Ms: 750, maxErrorRate: 0 },
    endpoints: { "GET /health": { maxP99Ms: 100, maxErrorRate: 0 } },
  };

  const evaluated = evaluateThresholds(results, thresholds);

  assert.equal(evaluated[0].passed, true);
  assert.equal(evaluated[1].passed, false);
  assert.deepEqual(evaluated[1].violations, [
    "p99 900ms exceeds 750ms",
    "error rate 2% exceeds 0%",
  ]);
});

test("buildMarkdownReport writes reviewer-friendly benchmark summary", () => {
  const report = buildMarkdownReport({
    generatedAt: "2026-05-22T12:00:00.000Z",
    mode: "smoke",
    target: "local app",
    benchmarkEnv: {
      node: "v22.0.0",
      platform: "win32",
      arch: "x64",
      cpu: "test cpu",
      cores: 8,
      totalMemoryMb: 32768,
    },
    results: [
      {
        id: "GET /health",
        method: "GET",
        path: "/health",
        status: 200,
        p50Ms: 10,
        p95Ms: 15,
        p99Ms: 20,
        ttfbP95Ms: 12,
        requestsPerSecond: 90,
        errorRate: 0,
        passed: true,
        violations: [],
      },
    ],
  });

  assert.match(report, /# API Benchmark Summary/);
  assert.match(report, /Mode: `smoke`/);
  assert.match(report, /GET \/health/);
  assert.match(report, /p99/);
  assert.match(report, /Benchmark Environment/);
});
