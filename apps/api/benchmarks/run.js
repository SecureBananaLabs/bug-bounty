/**
 * FreelanceFlow API Benchmark Suite
 *
 * Runs autocannon against all /api/ endpoints and produces
 * JSON + Markdown reports in benchmarks/results/.
 *
 * Usage:
 *   node benchmarks/run.js          # full benchmark
 *   node benchmarks/run.js --ci     # CI smoke test (low concurrency)
 *
 * Configuration: .env.benchmark (see .env.benchmark.template)
 */

import { createApp } from "../src/app.js";
import autocannon from "autocannon";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, "results");

// ─── Load config ───────────────────────────────────────

function loadEnv() {
  const envPath = join(__dirname, "..", ".env.benchmark");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

const HOST = process.env.BENCHMARK_HOST || "http://127.0.0.1:3000";
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || "10", 10);
const DURATION = parseInt(process.env.BENCHMARK_DURATION || "10", 10);
const CI_THRESHOLD = parseInt(process.env.BENCHMARK_CI_P99_THRESHOLD || "500", 10);
const IS_CI = process.argv.includes("--ci");

// ─── Helpers ───────────────────────────────────────────

async function fetchJSON(url, opts = {}) {
  const res = await fetch(`${HOST}${url}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runAutocannon(endpoint, opts = {}) {
  const url = `${HOST}${endpoint}`;
  const instance = autocannon({
    url,
    connections: IS_CI ? 2 : CONNECTIONS,
    duration: IS_CI ? 3 : DURATION,
    timeout: 10,
    ...opts,
  });

  return new Promise((resolve, reject) => {
    const results = [];
    instance.on("done", (result) => resolve(result));
    instance.on("error", reject);
    autocannon.track(instance);
  });
}

function summarize(result, label) {
  return {
    endpoint: label,
    requests: {
      total: result.requests?.total ?? 0,
      perSecond: result.requests?.average ?? 0,
    },
    latency: {
      p50: result.latency?.p50 ?? 0,
      p95: result.latency?.p95 ?? 0,
      p99: result.latency?.p99 ?? 0,
      avg: result.latency?.average ?? 0,
      max: result.latency?.max ?? 0,
    },
    errors: {
      count: result.errors ?? 0,
      rate: result.requests?.total
        ? ((result.errors / result.requests.total) * 100).toFixed(2)
        : 0,
    },
    throughput: {
      bytesPerSecond: result.throughput?.average ?? 0,
    },
    ttfb: {
      // autocannon reports latency which includes TTFB
      p50: result.latency?.p50 ?? 0,
    },
  };
}

// ─── Auth setup ────────────────────────────────────────

let AUTH_TOKEN = "";

async function setupAuth() {
  const email = process.env.BENCHMARK_TEST_EMAIL || "benchmark@freelanceflow.test";
  const password = process.env.BENCHMARK_TEST_PASSWORD || "benchpass123";

  // Try to register (ok if already exists)
  await fetchJSON("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name: "Benchmark" }),
  }).catch(() => {});

  // Login
  console.log(`  Logging in as ${email}...`);
  const login = await fetchJSON("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (login.data?.token) {
    AUTH_TOKEN = login.data.token;
    console.log("  ✓ Auth token obtained");
  } else {
    console.log("  ⚠ No auth token — protected routes will return 401");
  }
}

function authHeader() {
  return AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
}

// ─── Endpoint definitions ──────────────────────────────

const ENDPOINTS = [
  // Public
  { method: "GET", path: "/health", label: "GET /health", body: null },

  // Auth
  { method: "POST", path: "/api/auth/register", label: "POST /api/auth/register", body: JSON.stringify({ email: `u${Date.now()}@t.com`, password: "test123", name: "T" }) },
  { method: "POST", path: "/api/auth/login", label: "POST /api/auth/login", body: JSON.stringify({ email: process.env.BENCHMARK_TEST_EMAIL || "b@t.com", password: process.env.BENCHMARK_TEST_PASSWORD || "test123" }) },

  // Users (protected)
  { method: "GET", path: "/api/users", label: "GET /api/users", body: null, auth: true },

  // Jobs
  { method: "GET", path: "/api/jobs", label: "GET /api/jobs", body: null },
  { method: "POST", path: "/api/jobs", label: "POST /api/jobs", body: JSON.stringify({ title: "Bench Test", description: "Performance benchmark job posting", budgetMin: 100, budgetMax: 500, categoryId: "cat_bench" }), auth: true },

  // Proposals (protected)
  { method: "GET", path: "/api/proposals", label: "GET /api/proposals", body: null, auth: true },

  // Payments (protected)
  { method: "POST", path: "/api/payments", label: "POST /api/payments", body: JSON.stringify({ amount: 1000, currency: "usd" }), auth: true },

  // Reviews
  { method: "GET", path: "/api/reviews", label: "GET /api/reviews", body: null },

  // Messages (protected)
  { method: "GET", path: "/api/messages", label: "GET /api/messages", body: null, auth: true },

  // Notifications (protected)
  { method: "GET", path: "/api/notifications", label: "GET /api/notifications", body: null, auth: true },

  // Search
  { method: "GET", path: "/api/search?q=test", label: "GET /api/search", body: null },

  // Admin (protected)
  { method: "GET", path: "/api/admin", label: "GET /api/admin", body: null, auth: true },
];

// ─── Main ──────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 FreelanceFlow API Benchmark${IS_CI ? " (CI smoke)" : ""}`);
  console.log(`   Target: ${HOST}`);
  console.log(`   Connections: ${IS_CI ? 2 : CONNECTIONS} | Duration: ${IS_CI ? 3 : DURATION}s\n`);

  // Start server
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  process.env.BENCHMARK_HOST = `http://127.0.0.1:${port}`;
  // Re-set HOST to loopback for local testing
  const BASE = `http://127.0.0.1:${port}`;

  // Override fetchJSON to use local server
  const origFetch = globalThis.fetch;
  globalThis.fetch = (url, opts) => {
    if (typeof url === "string" && url.startsWith(HOST)) {
      url = url.replace(HOST, BASE);
    }
    return origFetch(url, opts);
  };

  console.log(`   Server running on port ${port}\n`);

  try {
    // Setup auth
    await setupAuth();

    // Run benchmarks
    const results = [];
    const startTime = Date.now();

    for (const ep of ENDPOINTS) {
      const opts = {
        method: ep.method,
        headers: ep.auth ? authHeader() : {},
      };
      if (ep.body) {
        opts.body = ep.body;
        opts.headers["Content-Type"] = "application/json";
      }

      process.stdout.write(`  Benchmarking ${ep.label.padEnd(35)} `);
      const result = await runAutocannon(ep.path, opts);
      const summary = summarize(result, ep.label);
      results.push(summary);

      const reqs = summary.requests.perSecond.toFixed(0);
      const p99 = summary.latency.p99.toFixed(1);
      const errs = summary.errors.rate;
      console.log(`→ ${reqs.padStart(6)} req/s | p99 ${p99.padStart(7)}ms | err ${errs}%`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // ─── Write results ──────────────────────────────

    mkdirSync(RESULTS_DIR, { recursive: true });

    // JSON
    const jsonOutput = {
      timestamp: new Date().toISOString(),
      mode: IS_CI ? "ci-smoke" : "full",
      duration_s: parseFloat(duration),
      config: {
        host: HOST,
        connections: IS_CI ? 2 : CONNECTIONS,
        duration_s: IS_CI ? 3 : DURATION,
      },
      results,
    };
    writeFileSync(join(RESULTS_DIR, "latest.json"), JSON.stringify(jsonOutput, null, 2));

    // Markdown
    let md = `# API Benchmark Results\n\n`;
    md += `**Date:** ${new Date().toISOString()}\n`;
    md += `**Mode:** ${IS_CI ? "CI Smoke" : "Full"}\n`;
    md += `**Duration:** ${duration}s\n\n`;
    md += `| Endpoint | Req/s | p50 (ms) | p95 (ms) | p99 (ms) | Avg (ms) | Error % |\n`;
    md += `|----------|-------|----------|----------|----------|----------|--------|\n`;

    for (const r of results) {
      md += `| ${r.endpoint} | ${r.requests.perSecond.toFixed(0)} | ${r.latency.p50.toFixed(1)} | ${r.latency.p95.toFixed(1)} | ${r.latency.p99.toFixed(1)} | ${r.latency.avg.toFixed(1)} | ${r.errors.rate} |\n`;
    }

    md += `\n---\n*Generated by FreelanceFlow Benchmark Suite*\n`;
    writeFileSync(join(RESULTS_DIR, "latest.md"), md);

    // ─── CI check ───────────────────────────────────

    if (IS_CI) {
      console.log(`\n  CI threshold check (p99 < ${CI_THRESHOLD}ms):`);
      let failed = false;
      for (const r of results) {
        const status = r.latency.p99 <= CI_THRESHOLD ? "✓" : "✗ FAIL";
        if (r.latency.p99 > CI_THRESHOLD) failed = true;
        console.log(`    ${status} ${r.endpoint}: p99=${r.latency.p99.toFixed(1)}ms`);
      }
      if (failed) {
        console.log(`\n❌ CI SMOKE BENCHMARK FAILED — p99 exceeded ${CI_THRESHOLD}ms threshold`);
        process.exitCode = 1;
      } else {
        console.log(`\n✅ CI smoke benchmark passed`);
      }
    }

    console.log(`\n📊 Results saved to benchmarks/results/`);
    console.log(`   JSON: benchmarks/results/latest.json`);
    console.log(`   MD:   benchmarks/results/latest.md\n`);
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
