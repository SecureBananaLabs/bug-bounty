/**
 * Benchmark runner for FreelanceFlow API
 *
 * Usage:
 *   node run.js              # Full benchmark
 *   node run.js --smoke      # Smoke test (low concurrency, for CI)
 *   node run.js --report     # Generate markdown report from last results
 */

import autocannon from "autocannon";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, "results");
const THRESHOLDS_FILE = join(__dirname, "thresholds.json");

// Load config from environment
const HOST = process.env.BENCHMARK_HOST || "http://localhost:3000";
const TOKEN = process.env.BENCHMARK_TOKEN || "";
const isSmoke = process.argv.includes("--smoke");
const isReport = process.argv.includes("--report");

const DURATION = isSmoke
  ? parseInt(process.env.BENCHMARK_SMOKE_DURATION || "3", 10)
  : parseInt(process.env.BENCHMARK_DURATION || "10", 10);
const CONNECTIONS = isSmoke
  ? parseInt(process.env.BENCHMARK_SMOKE_CONNECTIONS || "5", 10)
  : parseInt(process.env.BENCHMARK_CONNECTIONS || "50", 10);

// Thresholds for CI regression gate
function loadThresholds() {
  if (!existsSync(THRESHOLDS_FILE)) {
    return { p99_ms: 500, error_rate_pct: 5 };
  }
  return JSON.parse(readFileSync(THRESHOLDS_FILE, "utf-8"));
}

// All API endpoints to benchmark
const ENDPOINTS = [
  // Health check (no auth)
  { name: "GET /health", method: "GET", path: "/health", auth: false, body: null },
  
  // Auth routes (no auth required for register/login)
  { name: "POST /api/auth/register", method: "POST", path: "/api/auth/register", auth: false,
    body: { email: "bench_user@test.com", password: "benchmark123", name: "Bench User" } },
  { name: "POST /api/auth/login", method: "POST", path: "/api/auth/login", auth: false,
    body: { email: "bench_user@test.com", password: "benchmark123" } },
  { name: "POST /api/auth/refresh", method: "POST", path: "/api/auth/refresh", auth: true,
    body: { refreshToken: "benchmark-refresh-token" } },
  { name: "GET /api/auth/oauth/github/callback", method: "GET", path: "/api/auth/oauth/github/callback?code=bench", auth: false, body: null },
  
  // User routes
  { name: "GET /api/users", method: "GET", path: "/api/users", auth: false, body: null },
  { name: "POST /api/users", method: "POST", path: "/api/users", auth: false,
    body: { email: "newuser@test.com", name: "New User", role: "freelancer" } },
  
  // Job routes
  { name: "GET /api/jobs", method: "GET", path: "/api/jobs", auth: false, body: null },
  { name: "POST /api/jobs", method: "POST", path: "/api/jobs", auth: false,
    body: { title: "Benchmark Test Job", description: "A job created during benchmarking", budget: 5000 } },
  
  // Proposal routes
  { name: "GET /api/proposals", method: "GET", path: "/api/proposals", auth: false, body: null },
  { name: "POST /api/proposals", method: "POST", path: "/api/proposals", auth: false,
    body: { jobId: 1, coverLetter: "I can do this", bidAmount: 3000 } },
  
  // Payment routes
  { name: "POST /api/payments", method: "POST", path: "/api/payments", auth: false,
    body: { amount: 100, currency: "usd" } },
  
  // Review routes
  { name: "GET /api/reviews", method: "GET", path: "/api/reviews", auth: false, body: null },
  { name: "POST /api/reviews", method: "POST", path: "/api/reviews", auth: false,
    body: { revieweeId: 1, rating: 5, comment: "Great work" } },
  
  // Message routes
  { name: "GET /api/messages", method: "GET", path: "/api/messages", auth: false, body: null },
  { name: "POST /api/messages", method: "POST", path: "/api/messages", auth: false,
    body: { recipientId: 1, content: "Hello from benchmark" } },
  
  // Notification routes
  { name: "GET /api/notifications", method: "GET", path: "/api/notifications", auth: false, body: null },
  { name: "POST /api/notifications", method: "POST", path: "/api/notifications", auth: false,
    body: { userId: 1, type: "info", message: "Benchmark notification" } },
  
  // Search route
  { name: "GET /api/search", method: "GET", path: "/api/search?q=benchmark", auth: false, body: null },
  
  // Admin route (auth required)
  { name: "GET /api/admin/metrics", method: "GET", path: "/api/admin/metrics", auth: true, body: null },
];

/**
 * Run autocannon against a single endpoint
 */
function runBenchmark(endpoint) {
  return new Promise((resolve) => {
    const headers = {
      "Content-Type": "application/json",
    };
    if (endpoint.auth && TOKEN) {
      headers["Authorization"] = `Bearer ${TOKEN}`;
    }

    const instance = autocannon({
      url: `${HOST}${endpoint.path}`,
      method: endpoint.method,
      headers,
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      duration: DURATION,
      connections: CONNECTIONS,
      timeout: 10,
      retries: 0,
    }, (err, result) => {
      if (err) {
        resolve({
          name: endpoint.name,
          method: endpoint.method,
          path: endpoint.path,
          error: err.message,
          p50: 0, p95: 0, p99: 0,
          rps: 0, errorRate: 100,
          ttfb: 0,
          requests: 0,
          latency: {},
        });
      } else {
        const totalRequests = result.requests.total + result.errors;
        const errorRate = totalRequests > 0
          ? (result.errors / totalRequests) * 100
          : 0;

        resolve({
          name: endpoint.name,
          method: endpoint.method,
          path: endpoint.path,
          p50: result.latency.p50 || 0,
          p90: result.latency.p90 || 0,
          p95: result.latency.p95 || 0,
          p99: result.latency.p99 || 0,
          rps: result.requests.average || 0,
          rpsMax: result.requests.max || 0,
          errorRate: parseFloat(errorRate.toFixed(2)),
          ttfb: result.latency.p50 || 0, // TTFB approximated by p50 latency
          requests: result.requests.total,
          errors: result.errors,
          duration: result.duration,
          connections: result.connections,
        });
      }
    });

    // Progress output
    autocannon.track(instance, { renderProgressBar: false, renderResultsTable: false, renderLatencyTable: false });
  });
}

/**
 * Generate markdown report from results
 */
function generateMarkdownReport(results, allPassed) {
  const timestamp = new Date().toISOString();
  const mode = isSmoke ? "Smoke" : "Full";
  
  let md = `# API Benchmark Report\n\n`;
  md += `**Date:** ${timestamp}\n`;
  md += `**Mode:** ${mode} (${DURATION}s, ${CONNECTIONS} connections)\n`;
  md += `**Target:** ${HOST}\n`;
  md += `**Overall:** ${allPassed ? "✅ PASSED" : "❌ FAILED"}\n\n`;
  
  md += `## Summary\n\n`;
  md += `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate | TTFB (ms) | Status |\n`;
  md += `|----------|----------|----------|----------|-----|------------|-----------|--------|\n`;
  
  for (const r of results) {
    if (r.error) {
      md += `| ${r.name} | N/A | N/A | N/A | N/A | N/A | N/A | ❌ ${r.error} |\n`;
      continue;
    }
    const thresholds = loadThresholds();
    const p99Pass = r.p99 <= thresholds.p99_ms;
    const errPass = r.errorRate <= thresholds.error_rate_pct;
    const status = p99Pass && errPass ? "✅" : "❌";
    md += `| ${r.name} | ${r.p50.toFixed(2)} | ${r.p95.toFixed(2)} | ${r.p99.toFixed(2)} | ${r.rps.toFixed(1)} | ${r.errorRate}% | ${r.ttfb.toFixed(2)} | ${status} |\n`;
  }
  
  md += `\n## Details\n\n`;
  for (const r of results) {
    if (r.error) {
      md += `### ${r.name}\n\n❌ Error: ${r.error}\n\n`;
      continue;
    }
    md += `### ${r.name}\n\n`;
    md += `- **p50 latency:** ${r.p50.toFixed(2)} ms\n`;
    md += `- **p90 latency:** ${r.p90.toFixed(2)} ms\n`;
    md += `- **p95 latency:** ${r.p95.toFixed(2)} ms\n`;
    md += `- **p99 latency:** ${r.p99.toFixed(2)} ms\n`;
    md += `- **Requests/sec (avg):** ${r.rps.toFixed(1)}\n`;
    md += `- **Requests/sec (peak):** ${r.rpsMax.toFixed(1)}\n`;
    md += `- **Total requests:** ${r.requests}\n`;
    md += `- **Errors:** ${r.errors} (${r.errorRate}%)\n`;
    md += `- **TTFB:** ${r.ttfb.toFixed(2)} ms\n`;
    md += `- **Duration:** ${r.duration}s\n`;
    md += `- **Connections:** ${r.connections}\n\n`;
  }
  
  return md;
}

/**
 * Main benchmark runner
 */
async function main() {
  if (isReport) {
    // Just generate report from existing JSON results
    const resultsFile = join(RESULTS_DIR, "latest.json");
    if (!existsSync(resultsFile)) {
      console.error("No results found. Run benchmark first.");
      process.exit(1);
    }
    const results = JSON.parse(readFileSync(resultsFile, "utf-8"));
    const md = generateMarkdownReport(results.results, results.allPassed);
    writeFileSync(join(RESULTS_DIR, "report.md"), md);
    console.log("Report written to benchmarks/results/report.md");
    console.log("\n" + md);
    return;
  }

  console.log(`\n🚀 Starting ${isSmoke ? "SMOKE" : "FULL"} benchmark`);
  console.log(`   Target: ${HOST}`);
  console.log(`   Duration: ${DURATION}s per endpoint`);
  console.log(`   Connections: ${CONNECTIONS}`);
  console.log(`   Endpoints: ${ENDPOINTS.length}\n`);

  mkdirSync(RESULTS_DIR, { recursive: true });

  const results = [];
  const thresholds = loadThresholds();
  let allPassed = true;

  for (let i = 0; i < ENDPOINTS.length; i++) {
    const ep = ENDPOINTS[i];
    process.stdout.write(`  [${i + 1}/${ENDPOINTS.length}] ${ep.name} ... `);
    
    const result = await runBenchmark(ep);
    results.push(result);

    if (result.error) {
      console.log(`❌ ${result.error}`);
      allPassed = false;
    } else {
      const p99Pass = result.p99 <= thresholds.p99_ms;
      const errPass = result.errorRate <= thresholds.error_rate_pct;
      const passed = p99Pass && errPass;
      if (!passed) allPassed = false;
      
      console.log(
        `${passed ? "✅" : "❌"} p50=${result.p50.toFixed(1)}ms p99=${result.p99.toFixed(1)}ms rps=${result.rps.toFixed(0)} err=${result.errorRate}%`
      );
    }
  }

  // Save JSON results
  const timestamp = new Date().toISOString();
  const jsonOutput = {
    timestamp,
    mode: isSmoke ? "smoke" : "full",
    host: HOST,
    duration: DURATION,
    connections: CONNECTIONS,
    thresholds,
    allPassed,
    results,
  };
  
  writeFileSync(join(RESULTS_DIR, "latest.json"), JSON.stringify(jsonOutput, null, 2));
  writeFileSync(join(RESULTS_DIR, `benchmark-${timestamp.replace(/[:.]/g, "-")}.json`), JSON.stringify(jsonOutput, null, 2));

  // Generate and save markdown report
  const md = generateMarkdownReport(results, allPassed);
  writeFileSync(join(RESULTS_DIR, "report.md"), md);

  // Print summary
  console.log(`\n${allPassed ? "✅ All endpoints passed" : "❌ Some endpoints failed thresholds"}`);
  console.log(`   Results saved to benchmarks/results/`);
  console.log(`   Report: benchmarks/results/report.md\n`);

  if (isSmoke && !allPassed) {
    console.error("❌ Smoke benchmark FAILED — p99 latency or error rate exceeded thresholds");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
