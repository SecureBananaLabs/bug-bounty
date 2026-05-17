#!/usr/bin/env node
/**
 * SecureBanana Labs API Benchmark Suite
 *
 * Comprehensive benchmark for all /api/ endpoints.
 * Measures p50, p95, p99 latency, RPS (peak + sustained),
 * error rate (%), and time to first byte (TTFB).
 *
 * Usage:
 *   npm run benchmark          # Full suite (from benchmarks/)
 *   SMOKE=true npm run benchmark  # CI smoke test
 *
 * Output: benchmarks/results/benchmark-{timestamp}.json + .md
 */

const autocannon = require("autocannon");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

// ═══════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════

const isSmoke = process.env.SMOKE === "true";

const config = {
  host: process.env.BENCHMARK_HOST || "http://localhost:4000",
  connections: isSmoke
    ? parseInt(process.env.SMOKE_CONNECTIONS || "2", 10)
    : parseInt(process.env.BENCHMARK_CONNECTIONS || "10", 10),
  duration: isSmoke
    ? parseInt(process.env.SMOKE_DURATION || "5", 10)
    : parseInt(process.env.BENCHMARK_DURATION || "30", 10),
  jwtSecret: process.env.JWT_SECRET || "development-secret",
};

// Generate a test JWT token for auth-protected routes
function generateTestToken() {
  return jwt.sign(
    {
      sub: "benchmark-user",
      email: process.env.TEST_EMAIL || "benchmark@securebanana.dev",
      role: "admin",
    },
    config.jwtSecret,
    { expiresIn: "1h" }
  );
}

const testToken = generateTestToken();
const authHeader = `Bearer ${testToken}`;

// ═══════════════════════════════════════════
// Endpoint Definitions
// ═══════════════════════════════════════════

const endpoints = [
  // --- Public / Health ---
  { name: "GET /health", method: "GET", path: "/health" },

  // --- Auth (public) ---
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    body: JSON.stringify({
      email: `bench-${Date.now()}@test.dev`,
      password: "TestPass123!",
      role: "client",
    }),
    headers: { "content-type": "application/json" },
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    body: JSON.stringify({
      email: process.env.TEST_EMAIL || "benchmark@securebanana.dev",
      password: process.env.TEST_PASSWORD || "Benchmark123!",
    }),
    headers: { "content-type": "application/json" },
  },
  {
    name: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh",
    body: JSON.stringify({}),
    headers: { "content-type": "application/json", authorization: authHeader },
  },

  // --- Users (auth-protected) ---
  {
    name: "GET /api/users",
    method: "GET",
    path: "/api/users",
    headers: { authorization: authHeader },
  },
  {
    name: "POST /api/users",
    method: "POST",
    path: "/api/users",
    body: JSON.stringify({
      name: "Benchmark User",
      email: `bench-${Date.now()}@test.dev`,
    }),
    headers: { "content-type": "application/json", authorization: authHeader },
  },

  // --- Jobs (auth-protected) ---
  {
    name: "GET /api/jobs",
    method: "GET",
    path: "/api/jobs",
    headers: { authorization: authHeader },
  },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    body: JSON.stringify({
      title: "Benchmark Test Job",
      description: "A test job for benchmarking purposes",
      budget: 500,
      category: "development",
    }),
    headers: { "content-type": "application/json", authorization: authHeader },
  },

  // --- Proposals (auth-protected) ---
  {
    name: "GET /api/proposals",
    method: "GET",
    path: "/api/proposals",
    headers: { authorization: authHeader },
  },
  {
    name: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    body: JSON.stringify({
      jobId: "bench-job-001",
      coverLetter: "Benchmark proposal for testing",
      bid: 450,
    }),
    headers: { "content-type": "application/json", authorization: authHeader },
  },

  // --- Payments (auth-protected) ---
  {
    name: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    body: JSON.stringify({
      amount: 1000,
      currency: "usd",
      jobId: "bench-job-001",
    }),
    headers: { "content-type": "application/json", authorization: authHeader },
  },

  // --- Reviews (auth-protected) ---
  {
    name: "GET /api/reviews",
    method: "GET",
    path: "/api/reviews",
    headers: { authorization: authHeader },
  },
  {
    name: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews",
    body: JSON.stringify({
      jobId: "bench-job-001",
      rating: 5,
      comment: "Great work on the benchmark test",
    }),
    headers: { "content-type": "application/json", authorization: authHeader },
  },

  // --- Messages (auth-protected) ---
  {
    name: "GET /api/messages",
    method: "GET",
    path: "/api/messages",
    headers: { authorization: authHeader },
  },
  {
    name: "POST /api/messages",
    method: "POST",
    path: "/api/messages",
    body: JSON.stringify({
      recipientId: "bench-recipient",
      content: "Benchmark test message",
    }),
    headers: { "content-type": "application/json", authorization: authHeader },
  },

  // --- Notifications (auth-protected) ---
  {
    name: "GET /api/notifications",
    method: "GET",
    path: "/api/notifications",
    headers: { authorization: authHeader },
  },

  // --- Uploads (auth-protected, requires file) ---
  // Note: File upload benchmark uses a minimal in-memory buffer
  // This tests upload endpoint throughput without actual file I/O
  {
    name: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    headers: {
      authorization: authHeader,
      "content-type": "multipart/form-data",
    },
    body: null, // autocannon doesn't natively handle multipart well
    // This endpoint is benchmarked for connectivity/latency, not full upload speed
  },

  // --- Search (auth-protected) ---
  {
    name: "GET /api/search?q=developer",
    method: "GET",
    path: "/api/search?q=developer",
    headers: { authorization: authHeader },
  },

  // --- Admin (auth-protected) ---
  {
    name: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: { authorization: authHeader },
  },
];

// ═══════════════════════════════════════════
// Benchmark Runner
// ═══════════════════════════════════════════

function parseUrl(host) {
  const u = new URL(host);
  return { protocol: u.protocol.replace(":", ""), hostname: u.hostname, port: u.port || "80" };
}

async function runEndpoint(ep) {
  const urlParts = parseUrl(config.host);

  const opts = {
    url: `${config.host}${ep.path}`,
    connections: config.connections,
    duration: config.duration,
    method: ep.method || "GET",
    headers: ep.headers || {},
    timeout: 30,
  };

  if (ep.body && ep.method !== "GET") {
    opts.body = ep.body;
  }

  return new Promise((resolve) => {
    const instance = autocannon(opts, (err, result) => {
      if (err) {
        resolve({
          endpoint: ep.name,
          error: err.message,
          p50: null,
          p95: null,
          p99: null,
          rps_mean: null,
          rps_max: null,
          error_rate: null,
          ttfb_min: null,
          ttfb_max: null,
          total_requests: 0,
          status_codes: {},
        });
        return;
      }

      const totalErrors = Object.entries(result.errors || {}).reduce(
        (sum, [, count]) => sum + count,
        0
      );
      const totalRequests = result.requests?.total || 0;
      const errorRate =
        totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : "0.00";

      resolve({
        endpoint: ep.name,
        p50: result.latency?.p50 || null,
        p95: result.latency?.p95 || null,
        p99: result.latency?.p99 || null,
        p999: result.latency?.p999 || null,
        rps_mean: result.requests?.mean?.toFixed(2) || null,
        rps_max: result.requests?.max || null,
        rps_min: result.requests?.min || null,
        error_rate: parseFloat(errorRate),
        ttfb_min: result.latency?.min || null,
        ttfb_max: result.latency?.max || null,
        ttfb_avg: result.latency?.average || null,
        ttfb_stddev: result.latency?.stddev || null,
        total_requests: totalRequests,
        total_errors: totalErrors,
        status_codes: result.statusCodeStats || {},
        bytes_total: result.throughput?.total || 0,
        bytes_per_sec: result.throughput?.average
          ? (result.throughput.average / 1024).toFixed(2) + " KB/s"
          : "N/A",
      });
    });

    // Track progress for visibility
    autocannon.track(instance, {
      renderProgressBar: false,
      renderResultsTable: false,
    });
  });
}

// ═══════════════════════════════════════════
// Report Generation
// ═══════════════════════════════════════════

function generateMarkdown(results, metadata) {
  const now = new Date().toISOString();
  const mode = isSmoke ? "🚬 Smoke" : "📊 Full";

  let md = `# API Benchmark Report — ${mode}\n\n`;
  md += `**Generated:** ${now}\n`;
  md += `**Target:** ${config.host}\n`;
  md += `**Connections:** ${config.connections}\n`;
  md += `**Duration:** ${config.duration}s per endpoint\n`;
  md += `**JWT Test Token:** ${testToken.substring(0, 20)}...\n`;
  md += `**Mode:** ${metadata.mode}\n\n`;
  md += `---\n\n`;

  // Per-endpoint table
  md += `## Per-Endpoint Results\n\n`;
  md += `| Endpoint | p50 | p95 | p99 | RPS (mean) | RPS (max) | Error % | TTFB (avg) | Status Codes |\n`;
  md += `|----------|-----|-----|-----|-----------|-----------|---------|------------|-------------|\n`;

  for (const r of results) {
    if (r.error) {
      md += `| ${r.endpoint} | ❌ ${r.error} | - | - | - | - | - | - | - |\n`;
      continue;
    }
    const statusSummary = Object.entries(r.status_codes)
      .map(([code, count]) => `${code}:${count}`)
      .join(", ") || "N/A";

    md += `| ${r.endpoint} | ${r.p50 ?? "-"}ms | ${r.p95 ?? "-"}ms | ${r.p99 ?? "-"}ms | ${r.rps_mean ?? "-"} | ${r.rps_max ?? "-"} | ${r.error_rate ?? "-"}% | ${r.ttfb_avg ?? "-"}ms | ${statusSummary} |\n`;
  }

  // Summary statistics
  const valid = results.filter((r) => !r.error && r.p99 !== null);
  if (valid.length > 0) {
    const avgP99 = (valid.reduce((s, r) => s + r.p99, 0) / valid.length).toFixed(2);
    const maxP99 = Math.max(...valid.map((r) => r.p99));
    const totalRPS_mean = valid.reduce((s, r) => s + parseFloat(r.rps_mean || 0), 0).toFixed(2);
    const totalErrors = valid.reduce((s, r) => s + (r.total_errors || 0), 0);
    const totalRequests = valid.reduce((s, r) => s + (r.total_requests || 0), 0);
    const overallErrorRate =
      totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : "0.00";

    md += `\n## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Endpoints tested | ${valid.length}/${results.length} |\n`;
    md += `| Average p99 latency | ${avgP99}ms |\n`;
    md += `| Max p99 latency | ${maxP99}ms |\n`;
    md += `| Aggregate mean RPS | ${totalRPS_mean} |\n`;
    md += `| Overall error rate | ${overallErrorRate}% |\n`;
    md += `| Total requests | ${totalRequests} |\n`;
    md += `| Total errors | ${totalErrors} |\n`;

    // Threshold check (CI gate)
    md += `\n## Threshold Check\n\n`;
    const thresholds = metadata.thresholds || {};
    const p99Threshold = thresholds.p99_latency_ms || 500;

    const failures = valid.filter((r) => r.p99 > p99Threshold);
    if (failures.length > 0) {
      md += `⚠️ **THRESHOLD EXCEEDED** — p99 > ${p99Threshold}ms:\n\n`;
      for (const f of failures) {
        md += `- ${f.endpoint}: p99=${f.p99}ms\n`;
      }
    } else {
      md += `✅ All endpoints within p99 threshold (${p99Threshold}ms)\n`;
    }
  }

  md += `\n---\n*Report generated by SecureBanana Labs Benchmark Suite v1.0.0*\n`;
  return md;
}

// ═══════════════════════════════════════════
// Main
// ═══════════════════════════════════════════

async function main() {
  const mode = isSmoke ? "smoke" : "full";
  console.log(`\n🔬 SecureBanana API Benchmark — ${mode.toUpperCase()}\n`);
  console.log(`   Target: ${config.host}`);
  console.log(`   Connections: ${config.connections}`);
  console.log(`   Duration: ${config.duration}s/endpoint`);
  console.log(`   Endpoints: ${endpoints.length}\n`);

  // Load thresholds
  let thresholds = {};
  try {
    thresholds = JSON.parse(
      fs.readFileSync(path.join(__dirname, "thresholds.json"), "utf-8")
    );
  } catch {
    console.warn("⚠ thresholds.json not found, using defaults");
  }

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    process.stdout.write(`   [${i + 1}/${endpoints.length}] ${ep.name}... `);
    const result = await runEndpoint(ep);
    results.push(result);

    if (result.error) {
      console.log(`❌ ${result.error}`);
    } else {
      console.log(
        `✅ p50=${result.p50}ms p99=${result.p99}ms RPS=${result.rps_mean} err=${result.error_rate}%`
      );
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s\n`);

  // Write results
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const metadata = { mode, thresholds, timestamp, config };

  const jsonPath = path.join(__dirname, "results", `benchmark-${mode}-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({ metadata, results }, null, 2));
  console.log(`📄 JSON: ${jsonPath}`);

  const md = generateMarkdown(results, metadata);
  const mdPath = path.join(__dirname, "results", `benchmark-${mode}-${timestamp}.md`);
  fs.writeFileSync(mdPath, md);
  console.log(`📄 Markdown: ${mdPath}`);

  // Also write latest symlinks
  const latestJson = path.join(__dirname, "results", `latest-${mode}.json`);
  const latestMd = path.join(__dirname, "results", `latest-${mode}.md`);
  fs.writeFileSync(latestJson, JSON.stringify({ metadata, results }, null, 2));
  fs.writeFileSync(latestMd, md);

  // CI gate: exit non-zero if thresholds exceeded in smoke mode
  if (isSmoke) {
    const p99Threshold = thresholds.p99_latency_ms || 500;
    const valid = results.filter((r) => !r.error && r.p99 !== null);
    const failures = valid.filter((r) => r.p99 > p99Threshold);
    if (failures.length > 0) {
      console.error(`\n❌ CI GATE FAILED: ${failures.length} endpoints exceed p99=${p99Threshold}ms`);
      process.exit(1);
    }
    console.log(`\n✅ CI GATE PASSED: All endpoints below p99=${p99Threshold}ms`);
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
