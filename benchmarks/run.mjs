#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const args = new Set(process.argv.slice(2));
const smokeMode = args.has("--smoke");
const requestCount = numberFromEnv("BENCHMARK_REQUESTS", smokeMode ? 2 : 6);
const concurrency = numberFromEnv("BENCHMARK_CONCURRENCY", smokeMode ? 2 : 4);
const thresholdProfile = smokeMode ? "smoke" : "default";
const targetUrl = process.env.BENCHMARK_TARGET_URL?.replace(/\/$/, "");
const benchmarkToken =
  process.env.BENCHMARK_TOKEN ?? signAccessToken({ sub: "benchmark_admin", role: "admin" });
const thresholds = await loadThresholds(thresholdProfile);

const endpoints = [
  {
    name: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    json: () => ({
      email: `bench-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "bench-password",
      role: "client"
    })
  },
  {
    name: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    json: () => ({ email: "client@example.com", password: "bench-password" })
  },
  { name: "auth.oauth.callback", method: "GET", path: "/api/auth/oauth/github/callback" },
  { name: "auth.refresh", method: "POST", path: "/api/auth/refresh", json: () => ({}) },
  { name: "users.list", method: "GET", path: "/api/users" },
  {
    name: "users.create",
    method: "POST",
    path: "/api/users",
    json: () => ({
      name: "Benchmark User",
      email: `bench-user-${Date.now()}@example.com`,
      role: "client"
    })
  },
  { name: "jobs.list", method: "GET", path: "/api/jobs" },
  {
    name: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    json: () => ({
      title: "Benchmark API workload",
      description: "Synthetic benchmark payload with a realistic job description.",
      budgetMin: 500,
      budgetMax: 2500,
      categoryId: "cat_engineering",
      skills: ["node", "api", "benchmark"]
    })
  },
  { name: "proposals.list", method: "GET", path: "/api/proposals" },
  {
    name: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    json: () => ({
      jobId: "job_101",
      freelancerId: "usr_201",
      bidAmount: 1200,
      coverLetter: "Benchmark proposal payload."
    })
  },
  {
    name: "payments.create",
    method: "POST",
    path: "/api/payments",
    json: () => ({ amount: 1200, currency: "usd", jobId: "job_101" })
  },
  { name: "reviews.list", method: "GET", path: "/api/reviews" },
  {
    name: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    json: () => ({ reviewerId: "usr_1", revieweeId: "usr_2", rating: 5, comment: "Benchmark review." })
  },
  { name: "messages.list", method: "GET", path: "/api/messages" },
  {
    name: "messages.create",
    method: "POST",
    path: "/api/messages",
    json: () => ({ senderId: "usr_1", receiverId: "usr_2", body: "Benchmark message payload." })
  },
  { name: "notifications.list", method: "GET", path: "/api/notifications" },
  {
    name: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    json: () => ({ userId: "usr_1", type: "benchmark", message: "Benchmark notification." })
  },
  {
    name: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    form: () => {
      const form = new FormData();
      form.append("file", new Blob(["benchmark file payload"], { type: "text/plain" }), "benchmark.txt");
      return form;
    }
  },
  { name: "search.global", method: "GET", path: "/api/search?q=benchmark" },
  { name: "admin.metrics", method: "GET", path: "/api/admin/metrics", auth: true }
];

let server;
let baseUrl = targetUrl;

try {
  if (!baseUrl) {
    server = await startLocalServer();
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  }

  const startedAt = new Date().toISOString();
  const results = [];

  for (const endpoint of endpoints) {
    results.push(await benchmarkEndpoint(endpoint, baseUrl));
  }

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: smokeMode ? "smoke" : "full",
    targetUrl: targetUrl ?? "local ephemeral Express server",
    requestCount,
    concurrency,
    thresholds,
    environment: environmentSnapshot(),
    endpoints: results,
    passed: results.every((result) => result.passed)
  };

  await writeReports(report);

  if (!report.passed) {
    console.error("Benchmark threshold failure. See benchmarks/results/latest.md");
    process.exitCode = 1;
  } else {
    console.log("Benchmark suite passed. See benchmarks/results/latest.md");
  }
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function numberFromEnv(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function loadThresholds(profile) {
  const raw = await readFile(new URL("./thresholds.json", import.meta.url), "utf8");
  const parsed = JSON.parse(raw);
  return parsed[profile] ?? parsed.default;
}

async function startLocalServer() {
  const app = createApp();
  const localServer = app.listen(0);
  await new Promise((resolve, reject) => {
    localServer.once("listening", resolve);
    localServer.once("error", reject);
  });
  return localServer;
}

async function benchmarkEndpoint(endpoint, baseUrl) {
  const samples = [];
  const statusCodes = {};
  const perSecondCompletions = new Map();
  let cursor = 0;
  const suiteStart = performance.now();

  async function worker() {
    while (cursor < requestCount) {
      cursor += 1;
      const result = await singleRequest(endpoint, baseUrl);
      samples.push(result);
      statusCodes[result.status] = (statusCodes[result.status] ?? 0) + 1;
      const second = Math.floor((performance.now() - suiteStart) / 1000);
      perSecondCompletions.set(second, (perSecondCompletions.get(second) ?? 0) + 1);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, requestCount) }, () => worker()));

  const elapsedMs = performance.now() - suiteStart;
  const durations = samples.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errors = samples.filter((sample) => !sample.ok).length;
  const errorRate = errors / samples.length;
  const p99Ms = percentile(durations, 0.99);
  const result = {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: samples.length,
    p50Ms: round(percentile(durations, 0.5)),
    p95Ms: round(percentile(durations, 0.95)),
    p99Ms: round(p99Ms),
    ttfbP95Ms: round(percentile(ttfbs, 0.95)),
    sustainedRps: round(samples.length / (elapsedMs / 1000)),
    peakRps: Math.max(...perSecondCompletions.values(), samples.length),
    errorRate: round(errorRate),
    statusCodes,
    passed: p99Ms <= thresholds.p99Ms && errorRate <= thresholds.errorRate
  };

  console.log(
    `${result.passed ? "PASS" : "FAIL"} ${endpoint.method} ${endpoint.path} p99=${result.p99Ms}ms errorRate=${result.errorRate}`
  );
  return result;
}

async function singleRequest(endpoint, baseUrl) {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, requestInit(endpoint));
    const ttfbMs = performance.now() - started;
    await response.arrayBuffer();
    return {
      ok: response.ok,
      status: response.status,
      ttfbMs,
      durationMs: performance.now() - started
    };
  } catch (error) {
    return {
      ok: false,
      status: "network_error",
      ttfbMs: performance.now() - started,
      durationMs: performance.now() - started,
      error: error.message
    };
  }
}

function requestInit(endpoint) {
  const headers = {};
  let body;

  if (endpoint.auth) {
    headers.authorization = `Bearer ${benchmarkToken}`;
  }
  if (endpoint.json) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.json());
  }
  if (endpoint.form) {
    body = endpoint.form();
  }

  return {
    method: endpoint.method,
    headers,
    body
  };
}

function percentile(sortedValues, percentileValue) {
  if (!sortedValues.length) return 0;
  const index = Math.min(sortedValues.length - 1, Math.ceil(sortedValues.length * percentileValue) - 1);
  return sortedValues[index];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function environmentSnapshot() {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  return {
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCores: os.cpus().length,
    totalMemoryBytes: totalMem,
    freeMemoryBytes: freeMem,
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    node: process.version,
    network: "loopback when BENCHMARK_TARGET_URL is omitted"
  };
}

async function writeReports(report) {
  const outputDir = new URL("./results/", import.meta.url);
  await mkdir(outputDir, { recursive: true });
  await writeFile(new URL("latest.json", outputDir), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(new URL("latest.md", outputDir), markdownReport(report));
}

function markdownReport(report) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `- Mode: ${report.mode}`,
    `- Target: ${report.targetUrl}`,
    `- Started: ${report.startedAt}`,
    `- Requests per endpoint: ${report.requestCount}`,
    `- Concurrency: ${report.concurrency}`,
    `- Thresholds: p99 <= ${report.thresholds.p99Ms}ms, error rate <= ${report.thresholds.errorRate}`,
    "",
    "## Environment",
    "",
    `- CPU: ${report.environment.cpu}`,
    `- Logical cores: ${report.environment.logicalCores}`,
    `- Total memory: ${Math.round(report.environment.totalMemoryBytes / 1024 / 1024 / 1024)} GiB`,
    `- Free memory at start: ${Math.round(report.environment.freeMemoryBytes / 1024 / 1024)} MiB`,
    `- Platform: ${report.environment.platform} ${report.environment.release} ${report.environment.arch}`,
    `- Node.js: ${report.environment.node}`,
    "",
    "## Results",
    "",
    "| Endpoint | p50 | p95 | p99 | TTFB p95 | Sustained RPS | Peak RPS | Error Rate | Status |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const endpoint of report.endpoints) {
    lines.push(
      `| ${endpoint.method} ${endpoint.path} | ${endpoint.p50Ms}ms | ${endpoint.p95Ms}ms | ${endpoint.p99Ms}ms | ${endpoint.ttfbP95Ms}ms | ${endpoint.sustainedRps} | ${endpoint.peakRps} | ${endpoint.errorRate} | ${endpoint.passed ? "PASS" : "FAIL"} |`
    );
  }

  lines.push("", `Overall: ${report.passed ? "PASS" : "FAIL"}`, "");
  return `${lines.join("\n")}\n`;
}
