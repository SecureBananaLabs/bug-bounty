import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { readFile, writeFile, mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { percentile, summarize, measureEndpoint, regressionFailures } from "./measure.mjs";
import { assertRouteCoverage } from "./coverage.mjs";
import { readConfig } from "./config.mjs";

test("nearest-rank percentiles include the slow tail without mutating samples", () => {
  const xs = [100, 2, 1, 4, 3];
  assert.equal(percentile(xs, 50), 3);
  assert.equal(percentile(xs, 99), 100);
  assert.deepEqual(xs, [100, 2, 1, 4, 3]);
  assert.equal(percentile([], 50), null);
});

test("summary counts status and transport failures, including HTTP429", () => {
  const r = summarize([
    { latencyMs: 20, ttfbMs: 5, completedMs: 20, status: 200, ok: true },
    { latencyMs: 10, ttfbMs: 2, completedMs: 40, status: 429, ok: false },
    { latencyMs: 50, ttfbMs: null, completedMs: 100, status: 0, ok: false }
  ], 100);
  assert.equal(r.errors, 2);
  assert.equal(r.latencyMs.p99, 50);
  assert.equal(r.ttfbMs.p99, 5);
  assert.equal(r.sustainedRps, 30);
  assert.equal(r.peakRps, 30);
  assert.deepEqual(r.statuses, { 200: 1, 429: 1, "transport-error": 1 });
});

test("CI gate fails latency, errors, invalid and missing thresholds", () => {
  const r = [{ endpoint: "GET /api/x", latencyMs: { p99: 101 }, errorRatePercent: 1 }];
  assert.equal(regressionFailures(r, { "GET /api/x": { p99Ms: 100, maxErrorRatePercent: 0 } }).length, 2);
  assert.match(regressionFailures(r, {})[0], /missing/);
  assert.match(regressionFailures(r, { "GET /api/x": { p99Ms: -1, maxErrorRatePercent: 0 } })[0], /invalid/);
  assert.deepEqual(regressionFailures(r, { "GET /api/x": { p99Ms: 102, maxErrorRatePercent: 1 } }), []);
});

test("fixture inventory covers all actual API registrations", async () => {
  assert.equal(await assertRouteCoverage(), 20);
});

test("adding an uncovered API route fails coverage", async () => {
  const root = await mkdtemp(join(tmpdir(), "benchmark-coverage-"));
  try {
    await mkdir(join(root, "routes"));
    await writeFile(join(root, "app.js"), 'app.use("/api/new", newRoutes);');
    await writeFile(join(root, "routes", "newRoutes.js"), 'newRoutes.get("/", handler);');
    await assert.rejects(assertRouteCoverage(pathToFileURL(root + "/")), /coverage mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("bounds load and requires explicit existing-server writes and token", () => {
  assert.equal(readConfig({}, true).concurrency, 1);
  assert.throws(() => readConfig({ BENCHMARK_CONCURRENCY: "0" }), /integer/);
  assert.throws(() => readConfig({ BENCHMARK_REQUESTS: "NaN" }), /integer/);
  assert.throws(() => readConfig({ BENCHMARK_HOST: "http://localhost:4000" }), /ALLOW_MUTATIONS/);
  assert.throws(() => readConfig({ BENCHMARK_HOST: "http://localhost:4000", BENCHMARK_ALLOW_MUTATIONS: "1" }), /TOKEN/);
  assert.throws(() => readConfig({ BENCHMARK_HOST: "http://user:pass@localhost:4000" }), /without credentials/);
});

test("real HTTP measurement separates TTFB from body completion and sends bearer token", async () => {
  const server = http.createServer((req, res) => {
    assert.equal(req.headers.authorization, "Bearer synthetic-token");
    res.writeHead(200);
    res.flushHeaders();
    setTimeout(() => res.end("payload"), 30);
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const result = await measureEndpoint(new URL(`http://127.0.0.1:${server.address().port}`), { method: "GET", route: "/api/x", status: 200, authenticated: true }, { requests: 4, concurrency: 2, timeoutMs: 1000, token: "synthetic-token", warmup: 0 });
    assert.equal(result.requests, 4);
    assert.equal(result.errors, 0);
    assert.ok(result.latencyMs.p50 >= result.ttfbMs.p50 + 15);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test("deadline and unexpected statuses are counted as errors", async () => {
  const server = http.createServer((req, res) => {
    if (req.url === "/api/fail") res.writeHead(503).end();
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const target = new URL(`http://127.0.0.1:${server.address().port}`);
    for (const route of ["/api/fail", "/api/hang"]) {
      const result = await measureEndpoint(target, { method: "GET", route, status: 200 }, { requests: 2, concurrency: 1, timeoutMs: 30, warmup: 0 });
      assert.equal(result.errors, 2);
      assert.equal(result.errorRatePercent, 100);
    }
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});

test("default app continues to rate limit; benchmark injection is explicit", async () => {
  const { createApp } = await import("../apps/api/src/app.js");
  const limiterSource = await readFile(new URL("../apps/api/src/middleware/rateLimit.js", import.meta.url), "utf8");
  assert.match(limiterSource, /limit: 200/);
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const url = `http://127.0.0.1:${server.address().port}/health`;
    let status;
    for (let i = 0; i < 201; i++) {
      const response = await fetch(url); status = response.status; await response.arrayBuffer();
    }
    assert.equal(status, 429);
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});
