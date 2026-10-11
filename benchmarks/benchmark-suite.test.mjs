import assert from "node:assert/strict";
import test from "node:test";
import { benchmarkEndpoints } from "./endpoints.mjs";
import {
  buildMarkdownReport,
  calculateStats,
  evaluateThresholds,
  runEndpointBenchmark,
} from "./run-benchmarks.mjs";

test("benchmark endpoint inventory covers health and mounted api routes", () => {
  const routes = benchmarkEndpoints.map((endpoint) => endpoint.path);

  assert.ok(routes.includes("/health"));
  assert.ok(routes.includes("/api/auth/register"));
  assert.ok(routes.includes("/api/admin/metrics"));
  assert.equal(
    new Set(
      benchmarkEndpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`),
    ).size,
    benchmarkEndpoints.length,
  );

  for (const endpoint of benchmarkEndpoints) {
    assert.match(endpoint.name, /\S/);
    assert.match(endpoint.method, /^(GET|POST)$/);
    assert.match(endpoint.path, /^\//);
  }
});

test("latency stats include percentile and error-rate metrics", () => {
  const stats = calculateStats([
    { ok: true, status: 200, latencyMs: 5, ttfbMs: 4 },
    { ok: true, status: 201, latencyMs: 10, ttfbMs: 8 },
    { ok: false, status: 500, latencyMs: 20, ttfbMs: 18 },
  ]);

  assert.equal(stats.requests, 3);
  assert.equal(stats.errors, 1);
  assert.equal(stats.errorRate, 33.33);
  assert.equal(stats.p50Ms, 10);
  assert.equal(stats.p95Ms, 20);
  assert.equal(stats.p99Ms, 20);
  assert.equal(stats.p99TtfbMs, 18);
});

test("endpoint benchmark records request metrics against a local server", async () => {
  const calls = [];
  const result = await runEndpointBenchmark({
    baseUrl: "http://benchmark.local",
    endpoint: {
      name: "health",
      method: "GET",
      path: "/health",
      iterations: 2,
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "http://benchmark.local/health");
  assert.equal(result.requests, 2);
  assert.equal(result.errors, 0);
});

test("markdown report summarizes benchmark outcome", () => {
  const markdown = buildMarkdownReport({
    targetUrl: "http://127.0.0.1:4000",
    startedAt: "2026-05-20T19:00:00.000Z",
    finishedAt: "2026-05-20T19:00:01.000Z",
    summary: {
      endpoints: 1,
      totalRequests: 5,
      totalErrors: 0,
      maxP99Ms: 12,
      maxP99TtfbMs: 9,
    },
    endpoints: [
      {
        name: "health",
        method: "GET",
        path: "/health",
        requests: 5,
        errors: 0,
        errorRate: 0,
        p50Ms: 3,
        p95Ms: 9,
        p99Ms: 12,
        p99TtfbMs: 9,
        rps: 25,
      },
    ],
  });

  assert.match(markdown, /API Benchmark Summary/);
  assert.match(markdown, /\| health \| GET \| \/health \|/);
  assert.match(markdown, /Max p99 latency: 12 ms/);
});

test("threshold evaluation flags latency and error regressions", () => {
  const passing = evaluateThresholds({
    report: {
      summary: { maxP99Ms: 120 },
      endpoints: [{ errorRate: 0 }],
    },
    thresholds: { maxP99Ms: 250, maxErrorRate: 0 },
  });
  const failing = evaluateThresholds({
    report: {
      summary: { maxP99Ms: 300 },
      endpoints: [{ errorRate: 0 }, { errorRate: 5 }],
    },
    thresholds: { maxP99Ms: 250, maxErrorRate: 0 },
  });

  assert.equal(passing.ok, true);
  assert.equal(failing.ok, false);
  assert.deepEqual(failing.failures, [
    "max p99 latency 300 ms exceeds threshold 250 ms",
    "max error rate 5% exceeds threshold 0%",
  ]);
});
