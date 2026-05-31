import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import autocannon from "autocannon";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const API_DIR = resolve(ROOT, "apps/api");
const RESULTS_DIR = resolve(__dirname, "results");
const PORT = 4001;
const BASE = `http://localhost:${PORT}`;
const THRESHOLDS = JSON.parse(readFileSync(resolve(__dirname, "thresholds.json"), "utf-8"));

const TEST_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfYmVuY2htYXJrIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.QLKHkIBjSBTqFFa5Dd-qzOsr9K8bWGH2nSC6tENvz74";

const ENDPOINTS = [
  { method: "GET", path: "/health" },
  { method: "POST", path: "/api/auth/register", body: { email: "test@benchmark.dev", password: "benchpass1" } },
  { method: "POST", path: "/api/auth/login", body: { email: "test@benchmark.dev", password: "benchpass1" } },
  { method: "POST", path: "/api/auth/refresh" },
  { method: "GET", path: "/api/auth/oauth/google/callback" },
  { method: "GET", path: "/api/users" },
  { method: "POST", path: "/api/users", body: { email: "new@benchmark.dev", name: "Bench User" } },
  { method: "GET", path: "/api/jobs" },
  { method: "POST", path: "/api/jobs", body: { title: "Benchmark Job Position", description: "This is a benchmark job description for load testing purposes.", budgetMin: 500, budgetMax: 5000, categoryId: "cat_web", skills: ["node", "react"] } },
  { method: "GET", path: "/api/proposals" },
  { method: "POST", path: "/api/proposals", body: { jobId: "job_1", coverLetter: "I am an experienced benchmark engineer and can deliver.", rate: 75 } },
  { method: "POST", path: "/api/payments", body: { amount: 100, currency: "USD", paymentMethodId: "pm_bench" } },
  { method: "GET", path: "/api/reviews" },
  { method: "POST", path: "/api/reviews", body: { userId: "usr_1", rating: 5, comment: "Excellent benchmark performance." } },
  { method: "GET", path: "/api/messages" },
  { method: "POST", path: "/api/messages", body: { recipientId: "usr_2", content: "Hello from benchmark suite." } },
  { method: "GET", path: "/api/notifications" },
  { method: "POST", path: "/api/notifications", body: { userId: "usr_1", type: "info", message: "Benchmark notification test." } },
  { method: "POST", path: "/api/uploads" },
  { method: "GET", path: "/api/search", query: { q: "benchmark" } },
  { method: "GET", path: "/api/admin/metrics", auth: true },
];

function fmtMs(ms) {
  return `${ms.toFixed(2)} ms`;
}

function fmtNum(n) {
  return n.toLocaleString();
}

async function waitForServer(url, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start within ${retries * 500}ms`);
}

function runBenchmark(opts) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: BASE,
        ...opts,
        connections: 10,
        duration: 10,
        pipelining: 1,
        timeout: 30,
        // Note: autocannon provides p50, p75, p99 by default.
        // p95 is estimated as avg(p75, p99) in the output when p95 is 0.
        headers: {
          "Content-Type": "application/json",
          ...(opts.headers || {}),
        },
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );
  });
}

async function main() {
  console.log("\n[benchmark] Starting API server...\n");

  const server = spawn("node", ["src/server.js"], {
    cwd: API_DIR,
    env: { ...process.env, BENCHMARK: "1", PORT: String(PORT) },
    stdio: "pipe",
  });

  server.stderr.on("data", (d) => process.stderr.write(d));

  await waitForServer(`${BASE}/health`);
  console.log(`[benchmark] Server ready on ${BASE}\n`);

  const results = [];

  for (const ep of ENDPOINTS) {
    const label = `${ep.method} ${ep.path}`;
    process.stdout.write(`  ${label} ... `);

    const urlPath = ep.query
      ? `${ep.path}?${new URLSearchParams(ep.query)}`
      : ep.path;

    const opts = {
      method: ep.method,
      path: urlPath,
      headers: {},
      setupClient: null,
    };

    if (ep.auth) {
      opts.headers["Authorization"] = `Bearer ${TEST_TOKEN}`;
    }

    if (ep.method === "POST") {
      opts.headers["Content-Type"] = "application/json";
      if (ep.body) {
        opts.body = JSON.stringify(ep.body);
      }
    }

    try {
      const result = await runBenchmark(opts);

      const codes = result.statusCodes || {};
      const non2xxCt = Object.entries(codes)
        .filter(([code]) => !code.startsWith("2"))
        .reduce((sum, [, ct]) => sum + ct, 0);
      const errors = (result.errors || 0) + (result.timeouts || 0);

      const r = {
        endpoint: label,
        method: ep.method,
        path: ep.path,
        latency: {
          p50: result.latency?.p50 ?? 0,
          p75: result.latency?.p75 ?? 0,
          p95: (result.latency?.p95 ?? 0) || Math.round(((result.latency?.p75 ?? 0) + (result.latency?.p99 ?? 0)) / 2),
          p99: result.latency?.p99 ?? 0,
          average: result.latency?.average ?? 0,
          min: result.latency?.min ?? 0,
          max: result.latency?.max ?? 0,
        },
        requests: {
          total: result.requests?.total ?? 0,
          average: Math.round(result.requests?.average ?? 0),
          throughput: Math.round(result.throughput?.average ?? 0),
        },
        errors: {
          total: errors,
          non2xx: non2xxCt,
          codes,
        },
        ttfb: result.latency?.first ? result.latency.first : "—",
      };

      results.push(r);
      process.stdout.write(
        `p50=${fmtMs(r.latency.p50)}  p95=${fmtMs(r.latency.p95)}  p99=${fmtMs(r.latency.p99)}  rps=${fmtNum(r.requests.average)}  err=${r.errors.total}\n`,
      );
    } catch (err) {
      results.push({
        endpoint: label,
        method: ep.method,
        path: ep.path,
        error: err.message,
      });
      process.stdout.write(`FAILED: ${err.message}\n`);
    }
  }

  const jsonPath = resolve(RESULTS_DIR, "benchmark-results.json");
  writeFileSync(jsonPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\n[benchmark] JSON report: ${jsonPath}`);

  const mdPath = resolve(RESULTS_DIR, "benchmark-summary.md");
  const mdLines = [];

  mdLines.push("# Benchmark Summary");
  mdLines.push("");
  mdLines.push(`**Date:** ${new Date().toISOString()}`);
  mdLines.push(`**Tool:** autocannon (10 connections, 10s duration)`);
  mdLines.push(`**Target:** http://localhost:${PORT}`);
  mdLines.push("");
  mdLines.push("## Per-Endpoint Results");
  mdLines.push("");
  mdLines.push("| Endpoint | Method | p50 | p95 | p99 | Avg RPS | Errors |");
  mdLines.push("|----------|--------|-----|-----|-----|---------|--------|");

  let allPass = true;

  for (const r of results) {
    if (r.error) {
      mdLines.push(`| ${r.endpoint} | ${r.method} | — | — | — | — | **${r.error}** |`);
      allPass = false;
      continue;
    }
    const errorRate = (r.errors.total || 0) / Math.max(r.requests.total, 1) * 100;
    const pass =
      r.latency.p99 <= THRESHOLDS.p99 &&
      errorRate <= THRESHOLDS.errorRate &&
      r.requests.average >= THRESHOLDS.minRps &&
      r.errors.non2xx === 0;
    if (!pass) allPass = false;

    const status = pass ? "✅" : "❌";
    mdLines.push(
      `| ${r.endpoint} ${status} | ${r.method} | ${fmtMs(r.latency.p50)} | ${fmtMs(r.latency.p95)} | ${fmtMs(r.latency.p99)} | ${fmtNum(r.requests.average)} | ${r.errors.total} |`,
    );
  }

  mdLines.push("");
  mdLines.push("## Thresholds");
  mdLines.push("");
  mdLines.push(`| Metric | Threshold | Status |`);
  mdLines.push(`|--------|-----------|--------|`);
  mdLines.push(`| p99 latency | ≤ ${THRESHOLDS.p99} ms | ${allPass ? "✅ Pass" : "❌ Fail"} |`);
  mdLines.push(`| Error rate | ≤ ${THRESHOLDS.errorRate}% | ${allPass ? "✅ Pass" : "❌ Fail"} |`);
  mdLines.push(`| Min RPS | ≥ ${THRESHOLDS.minRps} | ${allPass ? "✅ Pass" : "❌ Fail"} |`);

  mdLines.push("");
  mdLines.push("## Environment");
  mdLines.push("");
  mdLines.push("- **Node.js:** " + process.version);
  mdLines.push("- **Platform:** " + process.platform);
  mdLines.push("- **Architecture:** " + process.arch);

  writeFileSync(mdPath, mdLines.join("\n"));
  console.log(`[benchmark] Markdown report: ${mdPath}`);

  console.log(`\n[benchmark] Threshold check: ${allPass ? "✅ ALL PASS" : "❌ SOME FAILED"}\n`);

  server.kill();
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[benchmark] Fatal:", err);
  process.exit(1);
});
