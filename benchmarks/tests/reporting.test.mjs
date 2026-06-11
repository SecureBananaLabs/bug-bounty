import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildMarkdownReport, evaluateThresholds } from "../reporting.mjs";

const sampleResults = [
  {
    id: "jobs.list",
    method: "GET",
    path: "/api/jobs",
    status: "passed",
    metrics: {
      latency: { p50: 5.1, p95: 8.4, p99: 11.9 },
      ttfb: { p50: 4.8, p95: 7.6, p99: 10.2 },
      requests: { sustainedRps: 120.5, peakRps: 138.2 },
      errors: { total: 0, rate: 0 },
      statusCodes: { 200: 42 }
    }
  }
];

describe("benchmark reporting", () => {
  it("renders the required benchmark metrics in markdown", () => {
    const markdown = buildMarkdownReport({
      generatedAt: "2026-06-11T00:00:00.000Z",
      targetUrl: "http://127.0.0.1:4000",
      mode: "smoke",
      durationSeconds: 2,
      connections: 2,
      results: sampleResults,
      thresholdSummary: { passed: true, failures: [] }
    });

    assert.match(markdown, /p50 latency/);
    assert.match(markdown, /p95 latency/);
    assert.match(markdown, /p99 latency/);
    assert.match(markdown, /TTFB p95/);
    assert.match(markdown, /sustained RPS/);
    assert.match(markdown, /peak RPS/);
    assert.match(markdown, /error rate/);
  });

  it("fails thresholds when endpoint p99 latency exceeds the configured limit", () => {
    const summary = evaluateThresholds(sampleResults, {
      defaults: { p99LatencyMs: 10, errorRate: 0.01 },
      endpoints: {}
    });

    assert.equal(summary.passed, false);
    assert.deepEqual(summary.failures, [
      "jobs.list p99 latency 11.9ms exceeded 10ms"
    ]);
  });
});
