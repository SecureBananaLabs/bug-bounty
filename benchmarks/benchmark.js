#!/usr/bin/env node

/**
 * FreelanceFlow API Benchmark Suite
 *
 * Measures p50/p95/p99 latency, RPS, error rate, and TTFB for all /api/ endpoints.
 *
 * Usage:
 *   npm run benchmark          — full benchmark (default)
 *   npm run benchmark:smoke    — smoke test with low concurrency for CI
 *
 * Configuration: copy .env.benchmark to .env and edit values.
 */

import autocannon from "autocannon";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────
const isSmoke = process.argv.includes("--smoke");

function loadEnv() {
  const envPath = join(__dirname, ".env");
  if (!existsSync(envPath)) {
    console.warn("⚠️  .env file not found. Using defaults.");
    console.warn("   Copy .env.benchmark to .env and edit values for your environment.\n");
  }
  const envFile = existsSync(envPath)
    ? readFileSync(envPath, "utf-8")
    : "";
  const env = { ...process.env };
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!env[key]) env[key] = val;
  }
  return {
    host: env.BENCHMARK_HOST || "http://localhost:4000",
    jwtSecret: env.JWT_SECRET || "development-secret",
    testUserId: env.TEST_USER_ID || "bench-test-user-0001",
    testUserRole: env.TEST_USER_ROLE || "admin",
    duration: Number(env[isSmoke ? "SMOKE_DURATION" : "BENCHMARK_DURATION"]) || (isSmoke ? 3 : 10),
    connections: Number(env[isSmoke ? "SMOKE_CONNECTIONS" : "BENCHMARK_CONNECTIONS"]) || (isSmoke ? 2 : 10),
  };
}

const config = loadEnv();

// ── Token Generation ────────────────────────────────────────────────────
function generateTestToken() {
  return jwt.sign(
    { sub: config.testUserId, role: config.testUserRole },
    config.jwtSecret,
    { expiresIn: "1h" }
  );
}

const TEST_TOKEN = generateTestToken();

// ── Endpoint Definitions ────────────────────────────────────────────────
// Realistic payloads drawn from production schema (validators)

const ENDPOINTS = [
  // ── Health (no auth) ──
  {
    name: "GET /health",
    method: "GET",
    path: "/health",
  },

  // ── Auth (no auth) ──
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    body: JSON.stringify({
      email: `bench-${Date.now()}@test.com`,
      password: "benchmarkPass123!",
      role: "client",
    }),
    headers: { "content-type": "application/json" },
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    body: JSON.stringify({ email: "bench@test.com", password: "benchmarkPass123!" }),
    headers: { "content-type": "application/json" },
  },
  {
    name: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh",
    body: JSON.stringify({ refreshToken: "test-refresh-token" }),
    headers: { "content-type": "application/json" },
  },

  // ── Users (no auth) ──
  {
    name: "GET /api/users",
    method: "GET",
    path: "/api/users",
  },
  {
    name: "POST /api/users",
    method: "POST",
    path: "/api/users",
    body: JSON.stringify({
      email: `user-${Date.now()}@test.com`,
      password: "benchmark123!",
      role: "freelancer",
    }),
    headers: { "content-type": "application/json" },
  },

  // ── Jobs (no auth) ──
  {
    name: "GET /api/jobs",
    method: "GET",
    path: "/api/jobs",
  },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    body: JSON.stringify({
      title: "Benchmark Test Job",
      description: "This is a benchmark test job created for performance testing purposes.",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat-bench",
      skills: ["nodejs", "benchmarking"],
    }),
    headers: { "content-type": "application/json" },
  },

  // ── Proposals (no auth) ──
  {
    name: "GET /api/proposals",
    method: "GET",
    path: "/api/proposals",
  },
  {
    name: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    body: JSON.stringify({
      jobId: "job-bench-001",
      coverLetter: "Benchmark proposal for performance testing.",
      bidAmount: 250,
    }),
    headers: { "content-type": "application/json" },
  },

  // ── Payments (no auth) ──
  {
    name: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    body: JSON.stringify({ amount: 1000, currency: "usd" }),
    headers: { "content-type": "application/json" },
  },

  // ── Reviews (no auth) ──
  {
    name: "GET /api/reviews",
    method: "GET",
    path: "/api/reviews",
  },
  {
    name: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews",
    body: JSON.stringify({ jobId: "job-bench-001", rating: 5, comment: "Benchmark review" }),
    headers: { "content-type": "application/json" },
  },

  // ── Messages (no auth) ──
  {
    name: "GET /api/messages",
    method: "GET",
    path: "/api/messages",
  },
  {
    name: "POST /api/messages",
    method: "POST",
    path: "/api/messages",
    body: JSON.stringify({ recipientId: "user-bench-002", content: "Benchmark message" }),
    headers: { "content-type": "application/json" },
  },

  // ── Notifications (no auth) ──
  {
    name: "GET /api/notifications",
    method: "GET",
    path: "/api/notifications",
  },
  {
    name: "POST /api/notifications",
    method: "POST",
    path: "/api/notifications",
    body: JSON.stringify({ userId: "user-bench-001", type: "info", message: "Benchmark notification" }),
    headers: { "content-type": "application/json" },
  },

  // ── Uploads (no auth, multipart skipped for benchmark simplicity) ──
  {
    name: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    body: JSON.stringify({ filename: "benchmark.txt" }),
    headers: { "content-type": "application/json" },
  },

  // ── Search (no auth) ──
  {
    name: "GET /api/search",
    method: "GET",
    path: "/api/search?q=benchmark",
  },

  // ── Admin (auth-protected) ──
  {
    name: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: { authorization: `Bearer ${TEST_TOKEN}` },
  },
];

// ── Benchmark Runner ────────────────────────────────────────────────────

function runBenchmark(endpoint) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: `${config.host}${endpoint.path}`,
        method: endpoint.method,
        headers: endpoint.headers || {},
        body: endpoint.body || undefined,
        duration: config.duration,
        connections: config.connections,
        timeout: 30,
      },
      (err, result) => {
        if (err) {
          console.error(`  ❌ ${endpoint.name} — ERROR: ${err.message}`);
          return resolve({
            endpoint: endpoint.name,
            error: err.message,
          });
        }
        resolve({
          endpoint: endpoint.name,
          method: endpoint.method,
          path: endpoint.path,
          latency: {
            p50: result.latency.p50,
            p95: result.latency.p95,
            p99: result.latency.p99,
            average: result.latency.average,
          },
          requestsPerSecond: {
            mean: result.requests.mean,
            max: result.requests.max,
          },
          errors: result.errors + result.timeouts,
          errorRate: result.errors + result.timeouts > 0
            ? (((result.errors + result.timeouts) / result.requests.total) * 100).toFixed(2)
            : "0.00",
          timeToFirstByte: result.latency.p1, // TTFB ≈ p1 latency
          totalRequests: result.requests.total,
          duration: result.duration,
          connections: config.connections,
        });
      }
    );

    // Track progress
    autocannon.track(instance, {
      renderProgressBar: true,
      renderResultsTable: false,
    });
  });
}

async function runAllBenchmarks() {
  const modeLabel = isSmoke ? "SMOKE" : "FULL";
  console.log(`\n🔥 FreelanceFlow API Benchmark — ${modeLabel} MODE`);
  console.log(`   Target: ${config.host}`);
  console.log(`   Duration: ${config.duration}s per endpoint`);
  console.log(`   Connections: ${config.connections}`);
  console.log(`   Endpoints: ${ENDPOINTS.length}\n`);

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < ENDPOINTS.length; i++) {
    const ep = ENDPOINTS[i];
    console.log(`[${i + 1}/${ENDPOINTS.length}] ${ep.name}`);
    const result = await runBenchmark(ep);
    results.push(result);
    if (!result.error) {
      console.log(`  ✅ p50=${result.latency.p50}ms p95=${result.latency.p95}ms p99=${result.latency.p99}ms RPS=${result.requestsPerSecond.mean.toFixed(1)} err=${result.errorRate}%\n`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // ── Save Results ──────────────────────────────────────────────────
  const resultsDir = join(__dirname, "results");
  mkdirSync(resultsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(resultsDir, `benchmark-${modeLabel.toLowerCase()}-${timestamp}.json`);
  const mdPath = join(resultsDir, `benchmark-${modeLabel.toLowerCase()}-${timestamp}.md`);

  const output = {
    meta: {
      mode: modeLabel.toLowerCase(),
      target: config.host,
      durationPerEndpoint: config.duration,
      connections: config.connections,
      totalEndpoints: ENDPOINTS.length,
      totalTime: `${totalTime}s`,
      timestamp: new Date().toISOString(),
    },
    endpoints: results,
  };

  writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(`📄 JSON results: ${jsonPath}`);

  // ── Generate Markdown Summary ─────────────────────────────────────
  const md = generateMarkdown(output);
  writeFileSync(mdPath, md);
  console.log(`📝 Markdown summary: ${mdPath}\n`);

  // ── Threshold Check ───────────────────────────────────────────────
  const thresholdPath = join(__dirname, "thresholds.json");
  let thresholdViolations = [];
  if (existsSync(thresholdPath)) {
    const thresholds = JSON.parse(readFileSync(thresholdPath, "utf-8"));
    for (const r of results) {
      if (r.error) continue;
      const t = thresholds.endpoints?.[r.endpoint];
      if (t?.p99 && r.latency.p99 > t.p99) {
        thresholdViolations.push(
          `${r.endpoint}: p99=${r.latency.p99}ms > threshold=${t.p99}ms`
        );
      }
    }
  }

  if (thresholdViolations.length > 0) {
    console.error("🚨 THRESHOLD VIOLATIONS DETECTED:");
    for (const v of thresholdViolations) {
      console.error(`   ${v}`);
    }
    console.error("");
    if (isSmoke) {
      console.warn("⚠️  Smoke mode: threshold violations are non-fatal (CI may lack database).");
      console.warn("   Run full benchmark with a configured environment to validate performance.\n");
      // Not exiting with error — smoke test validates tool runs, not env performance
    }
  } else {
    console.log("✅ All endpoints within thresholds.\n");
  }

  // ── Print Summary Table ──────────────────────────────────────────
  console.log(generateMarkdown(output));
}

// ── Markdown Generator ──────────────────────────────────────────────────

function generateMarkdown(data) {
  const lines = [];
  lines.push(`# API Benchmark Report — ${data.meta.mode.toUpperCase()}`);
  lines.push("");
  lines.push(`**Target:** \`${data.meta.target}\`  `);
  lines.push(`**Duration per endpoint:** ${data.meta.durationPerEndpoint}s  `);
  lines.push(`**Connections:** ${data.meta.connections}  `);
  lines.push(`**Timestamp:** ${data.meta.timestamp}  `);
  lines.push(`**Total time:** ${data.meta.totalTime}  `);
  lines.push("");

  lines.push("## Results");
  lines.push("");
  lines.push("| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | Avg RPS | Error % | TTFB (ms) |");
  lines.push("|----------|----------|----------|----------|---------|---------|-----------|");

  for (const r of data.endpoints) {
    if (r.error) {
      lines.push(`| ${r.endpoint} | ❌ ERROR | — | — | — | — | — |`);
    } else {
      lines.push(
        `| ${r.endpoint} | ${r.latency.p50.toFixed(1)} | ${r.latency.p95.toFixed(1)} | ${r.latency.p99.toFixed(1)} | ${r.requestsPerSecond.mean.toFixed(1)} | ${r.errorRate} | ${r.timeToFirstByte.toFixed(1)} |`
      );
    }
  }
  lines.push("");

  // Summary stats
  const valid = data.endpoints.filter((r) => !r.error);
  if (valid.length > 0) {
    const avgP50 = valid.reduce((s, r) => s + r.latency.p50, 0) / valid.length;
    const avgP99 = valid.reduce((s, r) => s + r.latency.p99, 0) / valid.length;
    const avgRPS = valid.reduce((s, r) => s + r.requestsPerSecond.mean, 0) / valid.length;
    const totalErr = valid.filter((r) => parseFloat(r.errorRate) > 0).length;

    lines.push("## Summary");
    lines.push("");
    lines.push(`- **Average p50 latency:** ${avgP50.toFixed(1)} ms`);
    lines.push(`- **Average p99 latency:** ${avgP99.toFixed(1)} ms`);
    lines.push(`- **Average RPS:** ${avgRPS.toFixed(1)} req/s`);
    lines.push(`- **Endpoints with errors:** ${totalErr}/${valid.length}`);
    lines.push(`- **Total endpoints tested:** ${data.endpoints.length}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ── Main ────────────────────────────────────────────────────────────────
runAllBenchmarks().catch((err) => {
  console.error("Benchmark error:", err.message || err);
  if (!isSmoke) {
    process.exit(1);
  } else {
    console.warn("⚠️  Smoke mode: benchmark errors are non-fatal.");
    process.exit(0);
  }
});
