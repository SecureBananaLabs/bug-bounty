#!/usr/bin/env node

import os from "node:os";
import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const BENCHMARK_DIR = path.resolve(ROOT_DIR, "benchmarks");
const RESULTS_DIR = path.resolve(BENCHMARK_DIR, "results");
const DEFAULT_TIMEOUT_MS = 5000;

await loadEnvFile(path.join(BENCHMARK_DIR, ".env.benchmark"));

const args = parseArgs(process.argv.slice(2));
const isSmoke = Boolean(args.smoke);
const failOnThreshold = Boolean(args.ci);
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const outputName = String(args.output ?? (isSmoke ? "smoke" : "latest"));

const config = {
  mode: isSmoke ? "smoke" : "full",
  concurrency: readNumberEnv("BENCHMARK_CONCURRENCY", isSmoke ? 2 : 4),
  requestsPerEndpoint: readNumberEnv("BENCHMARK_REQUESTS_PER_ENDPOINT", isSmoke ? 3 : 8),
  warmupRequests: readNumberEnv("BENCHMARK_WARMUP_REQUESTS", isSmoke ? 0 : 1),
  timeoutMs: readNumberEnv("BENCHMARK_TIMEOUT_MS", DEFAULT_TIMEOUT_MS),
  outputName
};

const benchmarkRoutes = [
  {
    name: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    expectedStatus: 201,
    body: (seed) => ({
      email: `benchmark+${seed}@example.com`,
      password: "benchmark-pass-123",
      role: "client"
    })
  },
  {
    name: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    body: () => ({
      email: "benchmark@example.com",
      password: "benchmark-pass-123"
    })
  },
  {
    name: "auth.oauthCallback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "auth.refresh",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "users.list",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "users.create",
    method: "POST",
    path: "/api/users",
    expectedStatus: 201,
    body: (seed) => ({
      email: `talent-${seed}@example.com`,
      name: "Benchmark Freelancer",
      role: "freelancer",
      skills: ["node", "react", "postgres"]
    })
  },
  {
    name: "jobs.list",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    expectedStatus: 201,
    body: (seed) => ({
      title: `Build benchmark dashboard ${seed}`,
      description: "Create a performance dashboard with API latency charts and alerts.",
      budgetMin: 1200,
      budgetMax: 2500,
      categoryId: "engineering",
      skills: ["node", "performance", "dashboard"]
    })
  },
  {
    name: "proposals.list",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    expectedStatus: 201,
    body: (seed) => ({
      jobId: `job_${seed}`,
      freelancerId: `usr_${seed}`,
      coverLetter: "I can deliver this API performance work with a short feedback loop.",
      bidAmount: 1800,
      timelineDays: 7
    })
  },
  {
    name: "payments.create",
    method: "POST",
    path: "/api/payments",
    expectedStatus: 201,
    body: (seed) => ({
      proposalId: `prp_${seed}`,
      amount: 1800,
      currency: "usd"
    })
  },
  {
    name: "reviews.list",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    expectedStatus: 201,
    body: (seed) => ({
      contractId: `ctr_${seed}`,
      rating: 5,
      comment: "Clear communication and verified delivery."
    })
  },
  {
    name: "messages.list",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "messages.create",
    method: "POST",
    path: "/api/messages",
    expectedStatus: 201,
    body: (seed) => ({
      threadId: `thread_${seed}`,
      senderId: "benchmark-client",
      recipientId: "benchmark-freelancer",
      body: "Can you share a milestone update today?"
    })
  },
  {
    name: "notifications.list",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    expectedStatus: 201,
    body: (seed) => ({
      userId: `usr_${seed}`,
      type: "proposal.received",
      message: "A new proposal is ready for review."
    })
  },
  {
    name: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    expectedStatus: 201,
    multipart: (seed) => {
      const form = new FormData();
      form.append("file", new Blob([`benchmark upload ${seed}\n`], { type: "text/plain" }), `benchmark-${seed}.txt`);
      return form;
    }
  },
  {
    name: "search.global",
    method: "GET",
    path: (seed) => `/api/search?q=${encodeURIComponent(`node benchmark ${seed}`)}`
  },
  {
    name: "admin.metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];

const thresholds = await readThresholds();
const localServer = await maybeStartLocalServer();

try {
  const baseUrl = localServer?.baseUrl ?? normalizeBaseUrl(process.env.BENCHMARK_TARGET_URL);
  if (!baseUrl) {
    throw new Error("Set BENCHMARK_TARGET_URL or run without it to benchmark the local API app.");
  }

  const token = await resolveAuthToken(baseUrl);
  const routeResults = [];

  for (const route of benchmarkRoutes) {
    const result = await runRouteBenchmark(baseUrl, route, token);
    routeResults.push(result);
    logRouteResult(result);
  }

  const report = buildReport(baseUrl, routeResults);
  const thresholdFailures = evaluateThresholds(routeResults);
  await writeReports(report, thresholdFailures);

  if (thresholdFailures.length > 0) {
    console.error("\nBenchmark threshold failures:");
    for (const failure of thresholdFailures) {
      console.error(`- ${failure}`);
    }
    if (failOnThreshold) {
      process.exitCode = 1;
    }
  }
} finally {
  await localServer?.close();
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (rawArgs[index + 1] && !rawArgs[index + 1].startsWith("--")) {
      parsed[key] = rawArgs[index + 1];
      index += 1;
    } else {
      parsed[key] = true;
    }
  }
  return parsed;
}

async function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = await readFile(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
    }
  }
}

function readNumberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function readThresholds() {
  const thresholdPath = path.join(BENCHMARK_DIR, "thresholds.json");
  const raw = await readFile(thresholdPath, "utf8");
  return JSON.parse(raw);
}

async function maybeStartLocalServer() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return null;
  }

  const [{ connectDb }, { createApp }] = await Promise.all([
    import("../apps/api/src/config/db.js"),
    import("../apps/api/src/app.js")
  ]);

  await connectDb();
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

function normalizeBaseUrl(value) {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

async function resolveAuthToken(baseUrl) {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      email: "benchmark@example.com",
      password: "benchmark-pass-123"
    }),
    signal: AbortSignal.timeout(config.timeoutMs)
  });
  const payload = await response.json();
  return payload?.data?.token ?? "";
}

async function runRouteBenchmark(baseUrl, route, token) {
  for (let index = 0; index < config.warmupRequests; index += 1) {
    await executeRequest(baseUrl, route, token, `warmup-${index}`);
  }

  const startedAt = performance.now();
  const completions = [];
  const samples = [];
  let cursor = 0;

  async function worker() {
    while (cursor < config.requestsPerEndpoint) {
      const requestIndex = cursor;
      cursor += 1;
      const seed = `${route.name}-${runId}-${requestIndex}`;
      const sample = await executeRequest(baseUrl, route, token, seed);
      samples.push(sample);
      completions.push(performance.now());
    }
  }

  const workers = Array.from(
    { length: Math.min(config.concurrency, config.requestsPerEndpoint) },
    () => worker()
  );
  await Promise.all(workers);

  const finishedAt = performance.now();
  return summarizeRoute(route, samples, startedAt, finishedAt, completions);
}

async function executeRequest(baseUrl, route, token, seed) {
  const urlPath = typeof route.path === "function" ? route.path(seed) : route.path;
  const headers = {
    accept: "application/json",
    "x-benchmark-run": runId
  };
  let body;

  if (route.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  if (route.body) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(route.body(seed));
  } else if (route.multipart) {
    body = route.multipart(seed);
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${urlPath}`, {
      method: route.method,
      headers,
      body,
      signal: AbortSignal.timeout(config.timeoutMs)
    });
    const headersAt = performance.now();
    await response.text();
    const finishedAt = performance.now();
    const expectedStatus = route.expectedStatus ?? 200;

    return {
      status: response.status,
      ok: response.status === expectedStatus,
      durationMs: finishedAt - startedAt,
      ttfbMs: headersAt - startedAt
    };
  } catch (error) {
    const finishedAt = performance.now();
    return {
      status: 0,
      ok: false,
      durationMs: finishedAt - startedAt,
      ttfbMs: finishedAt - startedAt,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function summarizeRoute(route, samples, startedAt, finishedAt, completions) {
  const durations = samples.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errors = samples.filter((sample) => !sample.ok);
  const wallSeconds = Math.max((finishedAt - startedAt) / 1000, 0.001);

  return {
    name: route.name,
    method: route.method,
    path: typeof route.path === "function" ? route.path("{seed}") : route.path,
    requests: samples.length,
    errors: errors.length,
    errorRatePct: round((errors.length / samples.length) * 100),
    p50Ms: round(percentile(durations, 50)),
    p95Ms: round(percentile(durations, 95)),
    p99Ms: round(percentile(durations, 99)),
    ttfbP95Ms: round(percentile(ttfbs, 95)),
    sustainedRps: round(samples.length / wallSeconds),
    peakRps: round(computePeakRps(completions, startedAt, wallSeconds)),
    statuses: countBy(samples.map((sample) => sample.status)),
    sampleErrors: errors.slice(0, 3).map((sample) => sample.error ?? `HTTP ${sample.status}`)
  };
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
}

function computePeakRps(completions, startedAt, wallSeconds) {
  if (completions.length === 0) return 0;
  const buckets = new Map();
  for (const completedAt of completions) {
    const bucket = Math.floor((completedAt - startedAt) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Math.max(...buckets.values(), completions.length / wallSeconds);
}

function countBy(values) {
  return values.reduce((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function buildReport(baseUrl, routeResults) {
  const startedAt = new Date().toISOString();
  return {
    runId,
    generatedAt: startedAt,
    target: baseUrl,
    config,
    environment: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      node: process.version
    },
    routes: routeResults
  };
}

function evaluateThresholds(routeResults) {
  const failures = [];
  const defaults = thresholds.defaults ?? {};
  const routeThresholds = thresholds.routes ?? {};

  for (const result of routeResults) {
    const threshold = { ...defaults, ...(routeThresholds[result.name] ?? {}) };
    if (threshold.p99Ms !== undefined && result.p99Ms > threshold.p99Ms) {
      failures.push(`${result.name} p99 ${result.p99Ms}ms exceeds ${threshold.p99Ms}ms`);
    }
    if (threshold.errorRatePct !== undefined && result.errorRatePct > threshold.errorRatePct) {
      failures.push(`${result.name} error rate ${result.errorRatePct}% exceeds ${threshold.errorRatePct}%`);
    }
    if (threshold.minSustainedRps !== undefined && result.sustainedRps < threshold.minSustainedRps) {
      failures.push(`${result.name} sustained RPS ${result.sustainedRps} is below ${threshold.minSustainedRps}`);
    }
  }

  return failures;
}

async function writeReports(report, thresholdFailures) {
  await mkdir(RESULTS_DIR, { recursive: true });
  const jsonPath = path.join(RESULTS_DIR, `${config.outputName}.json`);
  const markdownPath = path.join(RESULTS_DIR, `${config.outputName}.md`);

  await writeFile(jsonPath, `${JSON.stringify({ ...report, thresholdFailures }, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdown(report, thresholdFailures));

  console.log(`\nWrote benchmark JSON: ${path.relative(ROOT_DIR, jsonPath)}`);
  console.log(`Wrote benchmark summary: ${path.relative(ROOT_DIR, markdownPath)}`);
}

function renderMarkdown(report, thresholdFailures) {
  const rows = report.routes
    .map(
      (route) =>
        `| ${route.name} | ${route.method} ${route.path} | ${route.requests} | ${route.p50Ms} | ${route.p95Ms} | ${route.p99Ms} | ${route.ttfbP95Ms} | ${route.sustainedRps} | ${route.peakRps} | ${route.errorRatePct}% |`
    )
    .join("\n");

  const statusText =
    thresholdFailures.length === 0
      ? "All configured thresholds passed."
      : thresholdFailures.map((failure) => `- ${failure}`).join("\n");

  return `# API Benchmark Summary

- Generated at: ${report.generatedAt}
- Target: ${report.target}
- Mode: ${report.config.mode}
- Requests per endpoint: ${report.config.requestsPerEndpoint}
- Concurrency: ${report.config.concurrency}
- Warmup requests per endpoint: ${report.config.warmupRequests}
- Node.js: ${report.environment.node}
- Platform: ${report.environment.platform} ${report.environment.release} ${report.environment.arch}

| Route | Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
${rows}

## Threshold Status

${statusText}
`;
}

function logRouteResult(result) {
  console.log(
    `${result.name.padEnd(22)} p95=${String(result.p95Ms).padStart(7)}ms p99=${String(result.p99Ms).padStart(7)}ms rps=${String(result.sustainedRps).padStart(7)} errors=${result.errorRatePct}%`
  );
}
