#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "results");
const thresholdPath = path.join(__dirname, "thresholds.json");
const isSmoke = process.argv.includes("--smoke");
const now = new Date();

const requestsPerEndpoint = numberFromEnv(
  "BENCHMARK_REQUESTS",
  isSmoke ? 2 : 5
);
const concurrency = numberFromEnv("BENCHMARK_CONCURRENCY", isSmoke ? 1 : 2);
const startedApp = await maybeStartLocalApp();
const baseUrl = trimTrailingSlash(
  process.env.BENCHMARK_TARGET_URL || startedApp.url
);
const adminToken = signAccessToken({ sub: "benchmark_admin", role: "admin" });

const endpoints = [
  {
    name: "GET /health",
    method: "GET",
    path: "/health"
  },
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    json: (index) => ({
      email: `benchmark-register-${index}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    json: () => ({
      email: "benchmark-login@example.com",
      password: "benchmark-password"
    })
  },
  {
    name: "GET /api/auth/oauth/github/callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "GET /api/users",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "POST /api/users",
    method: "POST",
    path: "/api/users",
    json: (index) => ({
      email: `benchmark-user-${index}@example.com`,
      name: `Benchmark User ${index}`,
      role: "client"
    })
  },
  {
    name: "GET /api/jobs",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    json: (index) => ({
      title: `Benchmark API job ${index}`,
      description: "Synthetic benchmark job payload for the marketplace API.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "cat_engineering",
      skills: ["node", "api", "benchmark"]
    })
  },
  {
    name: "GET /api/proposals",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    json: (index) => ({
      jobId: "job_101",
      freelancerId: "usr_freelancer",
      bidAmount: 900 + index,
      coverLetter: "Synthetic benchmark proposal body."
    })
  },
  {
    name: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    json: () => ({
      amount: 1200,
      currency: "usd",
      jobId: "job_101"
    })
  },
  {
    name: "GET /api/reviews",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews",
    json: () => ({
      revieweeId: "usr_freelancer",
      reviewerId: "usr_client",
      rating: 5,
      comment: "Synthetic benchmark review."
    })
  },
  {
    name: "GET /api/messages",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "POST /api/messages",
    method: "POST",
    path: "/api/messages",
    json: () => ({
      threadId: "thr_benchmark",
      senderId: "usr_client",
      body: "Synthetic benchmark message."
    })
  },
  {
    name: "GET /api/notifications",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "POST /api/notifications",
    method: "POST",
    path: "/api/notifications",
    json: () => ({
      userId: "usr_client",
      type: "proposal-update",
      message: "Synthetic benchmark notification."
    })
  },
  {
    name: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    form: () => {
      const form = new FormData();
      form.append(
        "file",
        new Blob(["benchmark upload payload"], { type: "text/plain" }),
        "benchmark.txt"
      );
      return form;
    }
  },
  {
    name: "GET /api/search",
    method: "GET",
    path: "/api/search?q=benchmark"
  },
  {
    name: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  }
];

try {
  const thresholds = await loadThresholds();
  const startedAt = performance.now();
  const results = [];

  for (const endpoint of endpoints) {
    results.push(await benchmarkEndpoint(endpoint));
  }

  const report = {
    generatedAt: now.toISOString(),
    mode: isSmoke ? "smoke" : "full",
    target: startedApp.started ? "local" : baseUrl,
    endpointCount: endpoints.length,
    requestsPerEndpoint,
    concurrency,
    durationMs: round(performance.now() - startedAt),
    environment: environmentSnapshot(),
    thresholds,
    results
  };

  report.thresholdFailures = evaluateThresholds(results, thresholds);

  await writeReports(report);

  if (isSmoke && report.thresholdFailures.length > 0) {
    for (const failure of report.thresholdFailures) {
      console.error(`Threshold failed: ${failure}`);
    }
    process.exitCode = 1;
  }
} finally {
  await startedApp.close();
}

async function maybeStartLocalApp() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {
      started: false,
      url: process.env.BENCHMARK_TARGET_URL,
      close: async () => {}
    };
  }

  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    started: true,
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function benchmarkEndpoint(endpoint) {
  const samples = [];
  const statusCounts = {};
  let completed = 0;
  let nextIndex = 0;
  const endpointStart = performance.now();

  async function worker() {
    while (nextIndex < requestsPerEndpoint) {
      const index = nextIndex;
      nextIndex += 1;
      const sample = await requestSample(endpoint, index);
      samples.push(sample);
      statusCounts[sample.status] = (statusCounts[sample.status] || 0) + 1;
      completed += 1;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, requestsPerEndpoint) }, worker)
  );

  const elapsedMs = performance.now() - endpointStart;
  const latencies = samples.map((sample) => sample.durationMs).sort(compare);
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort(compare);
  const errors = samples.filter((sample) => sample.status < 200 || sample.status >= 400);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: completed,
    statusCounts,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    ttfbP95Ms: percentile(ttfbs, 95),
    sustainedRps: round((completed / elapsedMs) * 1000),
    peakRps: peakRps(samples),
    errorRatePercent: round((errors.length / Math.max(completed, 1)) * 100)
  };
}

async function requestSample(endpoint, index) {
  const url = `${baseUrl}${endpoint.path}`;
  const headers = { ...(endpoint.headers || {}) };
  let body;

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.json(index));
  } else if (endpoint.form) {
    body = endpoint.form(index);
  }

  const start = performance.now();
  const response = await fetch(url, {
    method: endpoint.method,
    headers,
    body
  });
  const afterHeaders = performance.now();
  await response.arrayBuffer();
  const end = performance.now();

  return {
    status: response.status,
    startMs: start,
    durationMs: round(end - start),
    ttfbMs: round(afterHeaders - start)
  };
}

async function loadThresholds() {
  const raw = await readFile(thresholdPath, "utf8");
  return JSON.parse(raw);
}

function evaluateThresholds(results, thresholds) {
  const failures = [];

  for (const result of results) {
    const threshold = thresholds.endpoints?.[result.name] || thresholds.default;
    if (result.p99Ms > threshold.p99Ms) {
      failures.push(`${result.name} p99 ${result.p99Ms}ms > ${threshold.p99Ms}ms`);
    }
    if (result.errorRatePercent > threshold.errorRatePercent) {
      failures.push(
        `${result.name} error rate ${result.errorRatePercent}% > ${threshold.errorRatePercent}%`
      );
    }
  }

  return failures;
}

async function writeReports(report) {
  await mkdir(resultsDir, { recursive: true });
  const stamp = report.generatedAt.replaceAll(":", "").replaceAll(".", "-");
  const json = JSON.stringify(report, null, 2);
  const markdown = toMarkdown(report);

  await writeFile(path.join(resultsDir, `${stamp}.json`), json);
  await writeFile(path.join(resultsDir, `${stamp}.md`), markdown);
  await writeFile(path.join(resultsDir, "latest.json"), json);
  await writeFile(path.join(resultsDir, "latest.md"), markdown);

  console.log(`Wrote ${path.relative(process.cwd(), path.join(resultsDir, "latest.md"))}`);
}

function toMarkdown(report) {
  const rows = report.results
    .map((result) =>
      [
        result.name,
        result.requests,
        result.p50Ms,
        result.p95Ms,
        result.p99Ms,
        result.ttfbP95Ms,
        result.sustainedRps,
        result.peakRps,
        result.errorRatePercent,
        code(JSON.stringify(result.statusCounts))
      ].join(" | ")
    )
    .join("\n");

  const failures =
    report.thresholdFailures.length === 0
      ? "No threshold failures."
      : report.thresholdFailures.map((failure) => `- ${failure}`).join("\n");

  return `# API Benchmark Report

- Generated: ${report.generatedAt}
- Mode: ${report.mode}
- Target: ${report.target}
- Endpoints: ${report.endpointCount}
- Requests per endpoint: ${report.requestsPerEndpoint}
- Concurrency: ${report.concurrency}
- Duration: ${report.durationMs} ms
- Runtime: Node.js ${report.environment.node}
- OS: ${report.environment.os}
- CPU: ${report.environment.cpu}
- Total memory: ${report.environment.totalMemoryMb} MB
- Free memory at start: ${report.environment.freeMemoryMb} MB

## Results

Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses
--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---
${rows}

## Thresholds

${failures}
`;
}

function environmentSnapshot() {
  const cpus = os.cpus();
  return {
    node: process.version,
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: cpus.length > 0 ? `${cpus[0].model} (${cpus.length} logical cores)` : "unknown",
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024)
  };
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.min(
    values.length - 1,
    Math.ceil((percentileValue / 100) * values.length) - 1
  );
  return round(values[index]);
}

function peakRps(samples) {
  const buckets = new Map();

  for (const sample of samples) {
    const second = Math.floor(sample.startMs / 1000);
    buckets.set(second, (buckets.get(second) || 0) + 1);
  }

  return Math.max(...buckets.values(), 0);
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
}

function trimTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function compare(a, b) {
  return a - b;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function code(value) {
  return `\`${value.replaceAll("|", "\\|")}\``;
}
