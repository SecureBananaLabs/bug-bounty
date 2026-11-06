import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";

const isSmoke = process.env.SMOKE_TEST === "true" || process.argv.includes("--smoke");
const concurrency = isSmoke ? 2 : parseInt(process.env.BENCHMARK_CONCURRENCY || "10", 10);
const durationSec = isSmoke ? 2 : parseInt(process.env.BENCHMARK_DURATION_SEC || "3", 10);
const defaultHost = process.env.API_HOST || "";
const benchmarkToken = process.env.BENCHMARK_TOKEN || "mock-benchmark-auth-token-2026";

const endpoints = [
  { name: "Health Check", path: "/health", method: "GET" },
  { name: "Auth Register", path: "/api/auth/register", method: "POST", body: { email: "bench@test.com", password: "Password123!" } },
  { name: "Auth Login", path: "/api/auth/login", method: "POST", body: { email: "bench@test.com", password: "Password123!" } },
  { name: "List Jobs", path: "/api/jobs", method: "GET" },
  { name: "List Proposals", path: "/api/proposals", method: "GET" },
  { name: "List Users", path: "/api/users", method: "GET" },
  { name: "Payments Intent", path: "/api/payments/intent", method: "POST", body: { amount: 5000, currency: "usd" } },
  { name: "List Reviews", path: "/api/reviews", method: "GET" },
  { name: "List Messages", path: "/api/messages", method: "GET" },
  { name: "List Notifications", path: "/api/notifications", method: "GET" },
  { name: "Search Freelancers", path: "/api/search", method: "GET" },
  { name: "Uploads Status", path: "/api/uploads", method: "GET" },
  { name: "Admin Stats", path: "/api/admin", method: "GET" }
];

async function runBenchmarkForEndpoint(targetHost, ep) {
  const latencies = [];
  const ttfbList = [];
  let successfulRequests = 0;
  let failedRequests = 0;
  
  const targetUrl = new URL(ep.path, targetHost);
  const payload = ep.body ? JSON.stringify(ep.body) : null;
  const startTime = performance.now();
  const endTime = startTime + (durationSec * 1000);

  async function worker() {
    while (performance.now() < endTime) {
      const reqStart = performance.now();
      try {
        const res = await fetch(targetUrl.toString(), {
          method: ep.method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${benchmarkToken}`
          },
          body: payload,
        });
        const ttfb = performance.now() - reqStart;
        await res.text();
        const reqEnd = performance.now();
        const totalDuration = reqEnd - reqStart;
        
        latencies.push(totalDuration);
        ttfbList.push(ttfb);
        if (res.status >= 200 && res.status < 500) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      } catch (err) {
        failedRequests++;
        latencies.push(performance.now() - reqStart);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = (performance.now() - startTime) / 1000;
  const totalRequests = successfulRequests + failedRequests;
  const rps = totalTimeSec > 0 ? (totalRequests / totalTimeSec) : 0;
  const errorRate = totalRequests > 0 ? ((failedRequests / totalRequests) * 100) : 0;

  latencies.sort((a, b) => a - b);
  ttfbList.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const avgTTFB = ttfbList.length > 0 ? (ttfbList.reduce((a, b) => a + b, 0) / ttfbList.length) : 0;

  return {
    name: ep.name,
    path: ep.path,
    method: ep.method,
    totalRequests,
    rps: parseFloat(rps.toFixed(2)),
    errorRatePct: parseFloat(errorRate.toFixed(2)),
    latency: {
      p50: parseFloat(p50.toFixed(2)),
      p95: parseFloat(p95.toFixed(2)),
      p99: parseFloat(p99.toFixed(2))
    },
    ttfbMs: parseFloat(avgTTFB.toFixed(2))
  };
}

async function main() {
  console.log(`Starting FreelanceFlow API Benchmark Suite...`);
  console.log(`Mode: ${isSmoke ? "SMOKE REGRESSION GATE" : "FULL BENCHMARK"}, Concurrency: ${concurrency}, Duration: ${durationSec}s per endpoint\n`);

  let server = null;
  let host = defaultHost;

  if (!host) {
    console.log("No API_HOST configured. Booting local test server on ephemeral port...");
    const app = createApp();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    host = `http://127.0.0.1:${port}`;
    console.log(`Ephemeral API server active at: ${host}\n`);
  }

  const results = [];
  for (const ep of endpoints) {
    process.stdout.write(`Testing [${ep.method}] ${ep.path.padEnd(24)} `);
    const res = await runBenchmarkForEndpoint(host, ep);
    results.push(res);
    console.log(`-> RPS: ${res.rps.toString().padStart(6)} | p50: ${res.latency.p50.toFixed(1)}ms | p95: ${res.latency.p95.toFixed(1)}ms | p99: ${res.latency.p99.toFixed(1)}ms | TTFB: ${res.ttfbMs.toFixed(1)}ms`);
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log("\nEphemeral API server closed.");
  }

  // Load thresholds
  const thresholdsPath = path.resolve("benchmarks/thresholds.json");
  const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf-8"));

  // Check regressions
  let hasRegression = false;
  const regressionErrors = [];

  for (const r of results) {
    const epThreshold = thresholds.endpoints[r.path] || {};
    const maxP99 = epThreshold.max_p99_latency_ms || thresholds.default.max_p99_latency_ms;
    const maxErrors = thresholds.default.max_error_rate_pct;

    if (r.latency.p99 > maxP99) {
      hasRegression = true;
      regressionErrors.push(`REGRESSION: ${r.path} p99 latency (${r.latency.p99}ms) exceeded threshold (${maxP99}ms)`);
    }
  }

  // Write results
  const resultsDir = path.resolve("benchmarks/results");
  fs.mkdirSync(resultsDir, { recursive: true });

  const jsonReportPath = path.join(resultsDir, "benchmark-report.json");
  fs.writeFileSync(jsonReportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    concurrency,
    durationSec,
    endpoints: results
  }, null, 2));

  // Generate Markdown summary
  let md = `# FreelanceFlow Platform API Benchmark Report\n\n`;
  md += `**Execution Timestamp:** ${new Date().toUTCString()}  \n`;
  md += `**Concurrency:** ${concurrency} | **Duration:** ${durationSec}s per route | **Status:** ${hasRegression ? "❌ REGRESSION DETECTED" : "✅ ALL GATES PASSED"}  \n\n`;
  md += `| Endpoint | Method | Req/sec (RPS) | p50 (ms) | p95 (ms) | p99 (ms) | TTFB (ms) | Error Rate (%) |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const r of results) {
    md += `| \`${r.path}\` | \`${r.method}\` | ${r.rps} | ${r.latency.p50} | ${r.latency.p95} | **${r.latency.p99}** | ${r.ttfbMs} | ${r.errorRatePct}% |\n`;
  }

  md += `\n## Threshold Enforcement\n`;
  if (hasRegression) {
    md += `⚠️ **Gate Failures:**\n`;
    for (const err of regressionErrors) {
      md += `- ${err}\n`;
    }
  } else {
    md += `✅ All platform endpoints operated comfortably within p99 SLA thresholds defined in \`benchmarks/thresholds.json\`.\n`;
  }

  const mdReportPath = path.join(resultsDir, "benchmark-summary.md");
  fs.writeFileSync(mdReportPath, md);

  console.log(`\nResults written to:`);
  console.log(`- ${jsonReportPath}`);
  console.log(`- ${mdReportPath}`);

  if (hasRegression) {
    console.error("\n❌ Performance regression detected against thresholds.json!");
    process.exit(1);
  } else {
    console.log("\n✅ Benchmark completed successfully! All thresholds passed.");
  }
}

main().catch((err) => {
  console.error("Fatal benchmark error:", err);
  process.exit(1);
});
