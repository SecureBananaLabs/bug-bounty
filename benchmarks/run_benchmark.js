#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: base64url encode for JWT
function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function generateBenchmarkJwt(secret = "development-secret") {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      id: "bench_user_001",
      email: "benchmark@platform.internal",
      role: "admin",
      iat: now,
      exp: now + 3600
    })
  );
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${header}.${payload}.${signature}`;
}

const token = generateBenchmarkJwt(process.env.TEST_JWT_SECRET || "development-secret");

const ENDPOINTS = [
  {
    name: "Health Check",
    path: "/health",
    method: "GET",
    body: null,
    headers: {}
  },
  {
    name: "Auth - Register",
    path: "/api/auth/register",
    method: "POST",
    body: () => JSON.stringify({
      email: `bench_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`,
      password: "StrongPassword123!",
      role: "freelancer"
    }),
    headers: { "Content-Type": "application/json" }
  },
  {
    name: "Auth - Login",
    path: "/api/auth/login",
    method: "POST",
    body: () => JSON.stringify({
      email: "bench_test@example.com",
      password: "StrongPassword123!"
    }),
    headers: { "Content-Type": "application/json" }
  },
  {
    name: "Jobs - List",
    path: "/api/jobs",
    method: "GET",
    body: null,
    headers: { Authorization: `Bearer ${token}` }
  },
  {
    name: "Jobs - Create",
    path: "/api/jobs",
    method: "POST",
    body: () => JSON.stringify({
      title: "Full-Stack Distributed System Architecture",
      description: "Build an ultra low latency microservice cluster with Node.js and Redis.",
      budgetMin: 3000,
      budgetMax: 7000,
      categoryId: "cat_backend_eng",
      skills: ["Node.js", "Express", "Distributed Systems", "PostgreSQL"]
    }),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  },
  {
    name: "Users - Profile / List",
    path: "/api/users",
    method: "GET",
    body: null,
    headers: { Authorization: `Bearer ${token}` }
  },
  {
    name: "Proposals - List",
    path: "/api/proposals",
    method: "GET",
    body: null,
    headers: { Authorization: `Bearer ${token}` }
  },
  {
    name: "Payments - Create Intent",
    path: "/api/payments",
    method: "POST",
    body: () => JSON.stringify({
      amount: 4500,
      currency: "usd",
      metadata: { benchmark: "true" }
    }),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  },
  {
    name: "Reviews - List",
    path: "/api/reviews",
    method: "GET",
    body: null,
    headers: { Authorization: `Bearer ${token}` }
  },
  {
    name: "Messages - List",
    path: "/api/messages",
    method: "GET",
    body: null,
    headers: { Authorization: `Bearer ${token}` }
  },
  {
    name: "Notifications - List",
    path: "/api/notifications",
    method: "GET",
    body: null,
    headers: { Authorization: `Bearer ${token}` }
  },
  {
    name: "Search - Query",
    path: "/api/search?q=developer",
    method: "GET",
    body: null,
    headers: { Authorization: `Bearer ${token}` }
  },
  {
    name: "Admin - Panel Data",
    path: "/api/admin",
    method: "GET",
    body: null,
    headers: { Authorization: `Bearer ${token}` }
  }
];

function singleRequest(targetUrl, endpoint) {
  return new Promise((resolve) => {
    const urlObj = new URL(endpoint.path, targetUrl);
    const bodyData = typeof endpoint.body === "function" ? endpoint.body() : endpoint.body;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: endpoint.method,
      headers: {
        "User-Agent": "autocannon-benchmarker/1.0",
        ...endpoint.headers
      }
    };

    if (bodyData) {
      options.headers["Content-Length"] = Buffer.byteLength(bodyData);
    }

    const startTime = process.hrtime.bigint();
    let ttfb = null;

    const req = http.request(options, (res) => {
      ttfb = Number(process.hrtime.bigint() - startTime) / 1e6;
      res.on("data", () => {});
      res.on("end", () => {
        const totalDurationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
        const isError = res.statusCode >= 500;
        resolve({
          statusCode: res.statusCode,
          latencyMs: totalDurationMs,
          ttfbMs: ttfb,
          isError
        });
      });
    });

    req.on("error", (err) => {
      const totalDurationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
      resolve({
        statusCode: 0,
        latencyMs: totalDurationMs,
        ttfbMs: totalDurationMs,
        isError: true,
        errorMessage: err.message
      });
    });

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, mean: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const getP = (p) => sorted[Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1)];
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    p50: Number(getP(50).toFixed(2)),
    p95: Number(getP(95).toFixed(2)),
    p99: Number(getP(99).toFixed(2)),
    mean: Number((sum / sorted.length).toFixed(2))
  };
}

async function benchmarkEndpoint(targetUrl, endpoint, iterations = 60, concurrency = 6) {
  const latencies = [];
  const ttfbs = [];
  let errorCount = 0;
  const startAll = process.hrtime.bigint();

  for (let i = 0; i < iterations; i += concurrency) {
    const chunk = Math.min(concurrency, iterations - i);
    const promises = Array.from({ length: chunk }, () => singleRequest(targetUrl, endpoint));
    const results = await Promise.all(promises);

    for (const r of results) {
      latencies.push(r.latencyMs);
      if (r.ttfbMs) ttfbs.push(r.ttfbMs);
      if (r.isError) errorCount += 1;
    }
  }

  const totalTimeSec = Number(process.hrtime.bigint() - startAll) / 1e9;
  const rps = Number((iterations / totalTimeSec).toFixed(1));
  const errorRate = Number(((errorCount / iterations) * 100).toFixed(2));
  const { p50, p95, p99, mean } = calculatePercentiles(latencies);
  const avgTtfb = ttfbs.length ? Number((ttfbs.reduce((a, b) => a + b, 0) / ttfbs.length).toFixed(2)) : mean;

  return {
    endpoint: endpoint.path,
    name: endpoint.name,
    method: endpoint.method,
    requests: iterations,
    p50,
    p95,
    p99,
    mean,
    ttfb: avgTtfb,
    rps,
    errorRate
  };
}

async function run() {
  console.log("=================================================");
  console.log(" FreelanceFlow Platform API Benchmark Suite");
  console.log("=================================================");

  let targetUrl = process.env.TARGET_HOST || "http://127.0.0.1:4000";
  let tempServer = null;

  // Check if target server is live; if not, spin up app in-process
  try {
    await fetch(`${targetUrl}/health`, { signal: AbortSignal.timeout(1200) });
    console.log(`[Target Server]: Connected to ${targetUrl}`);
  } catch {
    console.log(`[Target Server]: Target ${targetUrl} offline. Launching in-process API server...`);
    try {
      const { createApp } = await import("../apps/api/src/app.js");
      const app = createApp();
      tempServer = http.createServer(app);
      await new Promise((resolve) => tempServer.listen(0, "127.0.0.1", resolve));
      const port = tempServer.address().port;
      targetUrl = `http://127.0.0.1:${port}`;
      console.log(`[In-Process Server]: Ready at ${targetUrl}`);
    } catch (e) {
      console.error("Could not launch in-process API server:", e.message);
      process.exit(1);
    }
  }

  const isSmoke = process.env.CI_SMOKE_MODE === "true" || process.argv.includes("--smoke");
  const iterations = isSmoke ? 20 : 60;
  const concurrency = isSmoke ? 4 : 8;

  console.log(`[Execution Profile]: ${isSmoke ? "CI Smoke Mode" : "Full Benchmark"} (Requests/Endpoint: ${iterations}, Concurrency: ${concurrency})\n`);

  const results = [];
  for (const ep of ENDPOINTS) {
    process.stdout.write(`Benchmarking [${ep.method.padEnd(4)}] ${ep.path.padEnd(25)} ... `);
    const metric = await benchmarkEndpoint(targetUrl, ep, iterations, concurrency);
    results.push(metric);
    console.log(`p50: ${metric.p50}ms | p99: ${metric.p99}ms | RPS: ${metric.rps} | Errors: ${metric.errorRate}%`);
  }

  if (tempServer) {
    await new Promise((resolve) => tempServer.close(resolve));
    console.log("\n[In-Process Server]: Stopped.");
  }

  // Load regression thresholds
  const thresholdsPath = path.join(__dirname, "thresholds.json");
  let thresholds = null;
  if (fs.existsSync(thresholdsPath)) {
    thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf-8"));
  }

  // Check regression gates
  let passedGate = true;
  const gateViolations = [];
  if (thresholds) {
    const globalMaxP99 = thresholds.global?.max_p99_latency_ms || 250;
    const globalMaxError = thresholds.global?.max_error_rate_percent || 2.0;
    for (const r of results) {
      const epConfig = thresholds.endpoints?.[r.endpoint];
      const maxP99 = epConfig?.max_p99_latency_ms || globalMaxP99;
      const maxErr = epConfig?.max_error_rate_percent || globalMaxError;
      if (r.p99 > maxP99) {
        passedGate = false;
        gateViolations.push(`${r.endpoint}: p99 latency ${r.p99}ms exceeded threshold ${maxP99}ms`);
      }
      if (r.errorRate > maxErr) {
        passedGate = false;
        gateViolations.push(`${r.endpoint}: error rate ${r.errorRate}% exceeded threshold ${maxErr}%`);
      }
    }
  }

  // Build Results JSON and Markdown Summary
  const outDir = path.join(__dirname, "results");
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPayload = {
    timestamp: new Date().toISOString(),
    environment: {
      targetHost: targetUrl,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      smokeMode: isSmoke
    },
    gatePassed: passedGate,
    violations: gateViolations,
    metrics: results
  };

  fs.writeFileSync(path.join(outDir, "benchmark_results.json"), JSON.stringify(jsonPayload, null, 2), "utf-8");

  // Generate Markdown Summary
  let md = "# API Performance Benchmark Report\n\n";
  md += `**Execution Date**: \`${new Date().toISOString()}\`\n`;
  md += `**Target Host**: \`${targetUrl}\` | **Node Version**: \`${process.version}\` | **Smoke Gate**: \`${passedGate ? "PASSED ✅" : "FAILED ❌"}\`\n\n`;
  md += "## Performance Metrics\n\n";
  md += "| Method | Endpoint | Req/s (RPS) | p50 (ms) | p95 (ms) | p99 (ms) | TTFB (ms) | Error Rate (%) |\n";
  md += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n";
  for (const r of results) {
    md += `| \`${r.method}\` | \`${r.endpoint}\` | **${r.rps}** | ${r.p50} | ${r.p95} | ${r.p99} | ${r.ttfb} | ${r.errorRate}% |\n`;
  }

  if (gateViolations.length > 0) {
    md += "\n### ⚠️ Regression Gate Violations\n";
    for (const v of gateViolations) {
      md += `- ${v}\n`;
    }
  } else {
    md += "\n> **Regression Gate**: All measured endpoints satisfy thresholds defined in `benchmarks/thresholds.json`.\n";
  }

  fs.writeFileSync(path.join(outDir, "benchmark_summary.md"), md, "utf-8");

  console.log("\n=================================================");
  console.log(` Gate Status: ${passedGate ? "PASSED (Zero regressions)" : "FAILED"}`);
  console.log(` Results saved to: benchmarks/results/benchmark_results.json`);
  console.log(` Markdown summary: benchmarks/results/benchmark_summary.md`);
  console.log("=================================================");

  if (!passedGate && isSmoke) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
