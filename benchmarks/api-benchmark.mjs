#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");

const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke");
const shouldWriteResults = !args.has("--no-write-results");

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--target=")) {
    process.env.BENCHMARK_TARGET_URL = arg.slice("--target=".length);
  }
}

await loadEnvFile(path.join(__dirname, ".env.benchmark"));

const config = {
  targetUrl: trimTrailingSlash(process.env.BENCHMARK_TARGET_URL ?? ""),
  durationMs: Number(process.env.BENCHMARK_DURATION_MS ?? (isSmoke ? 350 : 1200)),
  concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? (isSmoke ? 1 : 4)),
  warmupRequests: Number(process.env.BENCHMARK_WARMUP_REQUESTS ?? (isSmoke ? 1 : 3)),
  maxRequestsPerEndpoint: Number(process.env.BENCHMARK_MAX_REQUESTS_PER_ENDPOINT ?? (isSmoke ? 3 : 6)),
  mode: isSmoke ? "smoke" : "full"
};

const benchmarkToken = process.env.BENCHMARK_AUTH_TOKEN
  ?? signAccessToken({ sub: "usr_benchmark_admin", role: "admin" });

const endpoints = [
  {
    id: "health.get",
    method: "GET",
    path: "/health",
    description: "Service health check"
  },
  {
    id: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    description: "Register a benchmark client",
    json: (iteration) => ({
      email: `benchmark-client-${Date.now()}-${iteration}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    id: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    description: "Login with benchmark credentials",
    json: () => ({
      email: "benchmark-client@example.com",
      password: "benchmark-password"
    })
  },
  {
    id: "auth.oauth.github",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    description: "OAuth callback acknowledgement"
  },
  {
    id: "auth.refresh",
    method: "POST",
    path: "/api/auth/refresh",
    description: "Refresh access token"
  },
  {
    id: "jobs.list",
    method: "GET",
    path: "/api/jobs",
    description: "List jobs"
  },
  {
    id: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    description: "Create a representative job",
    json: () => ({
      title: "Build a secure milestone dashboard",
      description: "Implement a dashboard that summarizes scoped freelance delivery milestones.",
      budgetMin: 1500,
      budgetMax: 2800,
      categoryId: "cat_engineering",
      skills: ["Node.js", "React", "Security"]
    })
  },
  {
    id: "users.list",
    method: "GET",
    path: "/api/users",
    description: "List users"
  },
  {
    id: "users.create",
    method: "POST",
    path: "/api/users",
    description: "Create a benchmark user",
    json: (iteration) => ({
      email: `freelancer-${Date.now()}-${iteration}@example.com`,
      name: "Benchmark Freelancer",
      role: "freelancer"
    })
  },
  {
    id: "proposals.list",
    method: "GET",
    path: "/api/proposals",
    description: "List proposals"
  },
  {
    id: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    description: "Create a representative proposal",
    json: () => ({
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver the requested milestone dashboard with tests and proof artifacts.",
      bidAmount: 2200
    })
  },
  {
    id: "payments.create",
    method: "POST",
    path: "/api/payments",
    description: "Create a payment intent stub payload",
    json: () => ({
      amount: 250000,
      currency: "usd",
      metadata: { jobId: "job_benchmark" }
    })
  },
  {
    id: "reviews.list",
    method: "GET",
    path: "/api/reviews",
    description: "List reviews"
  },
  {
    id: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    description: "Create a representative review",
    json: () => ({
      reviewerId: "usr_benchmark_client",
      subjectId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Clear handoff, good validation evidence, and responsive delivery."
    })
  },
  {
    id: "messages.list",
    method: "GET",
    path: "/api/messages",
    description: "List messages"
  },
  {
    id: "messages.create",
    method: "POST",
    path: "/api/messages",
    description: "Create a representative message",
    json: () => ({
      senderId: "usr_benchmark_client",
      receiverId: "usr_benchmark_freelancer",
      body: "Please attach the validation proof before the milestone review."
    })
  },
  {
    id: "notifications.list",
    method: "GET",
    path: "/api/notifications",
    description: "List notifications"
  },
  {
    id: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    description: "Create a representative notification",
    json: () => ({
      userId: "usr_benchmark_client",
      type: "proposal_update",
      message: "A freelancer submitted a proposal for your benchmark job."
    })
  },
  {
    id: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    description: "Upload a small proof artifact",
    form: () => {
      const form = new FormData();
      form.set(
        "file",
        new Blob(["benchmark proof artifact"], { type: "text/plain" }),
        "benchmark-proof.txt"
      );
      return form;
    }
  },
  {
    id: "search.get",
    method: "GET",
    path: "/api/search?q=security%20dashboard",
    description: "Search with a representative query"
  },
  {
    id: "admin.metrics",
    method: "GET",
    path: "/api/admin/metrics",
    description: "Fetch admin metrics with benchmark token",
    headers: () => ({ Authorization: `Bearer ${benchmarkToken}` })
  }
];

const thresholds = await readThresholds();
const localServer = config.targetUrl ? null : await startLocalServer();
const targetUrl = config.targetUrl || localServer.url;

try {
  const endpointResults = [];

  for (const endpoint of endpoints) {
    await warmEndpoint(targetUrl, endpoint);
    endpointResults.push(await runEndpoint(targetUrl, endpoint));
  }

  const result = {
    generatedAt: new Date().toISOString(),
    mode: config.mode,
    targetUrl,
    settings: {
      durationMs: config.durationMs,
      concurrency: config.concurrency,
      warmupRequests: config.warmupRequests,
      maxRequestsPerEndpoint: config.maxRequestsPerEndpoint
    },
    environment: describeEnvironment(),
    endpoints: endpointResults
  };

  const failures = evaluateThresholds(result.endpoints, thresholds);
  result.thresholdFailures = failures;

  if (shouldWriteResults) {
    await mkdir(resultsDir, { recursive: true });
    await writeFile(
      path.join(resultsDir, `${config.mode}-latest.json`),
      `${JSON.stringify(result, null, 2)}\n`
    );
    await writeFile(path.join(resultsDir, "summary.md"), renderMarkdown(result));
  }

  console.log(renderConsoleSummary(result));

  if (failures.length > 0) {
    console.error("\nThreshold failures:");
    for (const failure of failures) {
      console.error(`- ${failure.endpoint}: ${failure.reason}`);
    }
    process.exitCode = 1;
  }
} finally {
  if (localServer) {
    await new Promise((resolve, reject) => {
      localServer.server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function startLocalServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return { server, url: `http://127.0.0.1:${port}` };
}

async function warmEndpoint(targetUrl, endpoint) {
  for (let iteration = 0; iteration < config.warmupRequests; iteration += 1) {
    await sendRequest(targetUrl, endpoint, iteration).catch(() => undefined);
  }
}

async function runEndpoint(targetUrl, endpoint) {
  const latencies = [];
  const ttfbs = [];
  const completions = [];
  let totalRequests = 0;
  let startedRequests = 0;
  let errorRequests = 0;
  let iteration = 0;
  const startedAt = performance.now();
  const stopAt = startedAt + config.durationMs;

  async function worker() {
    while (performance.now() < stopAt) {
      if (
        config.maxRequestsPerEndpoint > 0
        && startedRequests >= config.maxRequestsPerEndpoint
      ) {
        break;
      }

      startedRequests += 1;
      const currentIteration = iteration;
      iteration += 1;
      const sample = await sendRequest(targetUrl, endpoint, currentIteration);
      totalRequests += 1;
      latencies.push(sample.latencyMs);
      ttfbs.push(sample.ttfbMs);
      completions.push(sample.completedAt);

      if (sample.status >= 400 || sample.error) {
        errorRequests += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: config.concurrency }, () => worker()));

  const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001);
  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const sortedTtfbs = [...ttfbs].sort((a, b) => a - b);

  return {
    id: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    requests: totalRequests,
    errors: errorRequests,
    errorRatePercent: percent(errorRequests, totalRequests),
    sustainedRps: round(totalRequests / elapsedSeconds),
    peakRps: calculatePeakRps(completions),
    latencyMs: {
      p50: percentile(sortedLatencies, 50),
      p95: percentile(sortedLatencies, 95),
      p99: percentile(sortedLatencies, 99)
    },
    ttfbMs: {
      p50: percentile(sortedTtfbs, 50),
      p95: percentile(sortedTtfbs, 95),
      p99: percentile(sortedTtfbs, 99)
    }
  };
}

async function sendRequest(targetUrl, endpoint, iteration) {
  const url = `${targetUrl}${endpoint.path}`;
  const headers = endpoint.headers ? endpoint.headers(iteration) : {};
  const options = { method: endpoint.method, headers: { ...headers } };

  if (endpoint.json) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(endpoint.json(iteration));
  }

  if (endpoint.form) {
    options.body = endpoint.form(iteration);
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(url, options);
    const headerAt = performance.now();
    await response.arrayBuffer();
    const completedAt = performance.now();
    return {
      status: response.status,
      latencyMs: completedAt - startedAt,
      ttfbMs: headerAt - startedAt,
      completedAt
    };
  } catch (error) {
    const completedAt = performance.now();
    return {
      status: 0,
      latencyMs: completedAt - startedAt,
      ttfbMs: completedAt - startedAt,
      completedAt,
      error: error.message
    };
  }
}

async function readThresholds() {
  const raw = await readFile(thresholdsPath, "utf8");
  return JSON.parse(raw);
}

function evaluateThresholds(results, thresholdConfig) {
  const failures = [];
  const defaults = thresholdConfig.default ?? {};

  for (const result of results) {
    const threshold = { ...defaults, ...(thresholdConfig.endpoints?.[result.id] ?? {}) };

    if (threshold.p99LatencyMs && result.latencyMs.p99 > threshold.p99LatencyMs) {
      failures.push({
        endpoint: result.id,
        reason: `p99 ${result.latencyMs.p99}ms exceeded ${threshold.p99LatencyMs}ms`
      });
    }

    if (
      threshold.errorRatePercent !== undefined
      && result.errorRatePercent > threshold.errorRatePercent
    ) {
      failures.push({
        endpoint: result.id,
        reason: `error rate ${result.errorRatePercent}% exceeded ${threshold.errorRatePercent}%`
      });
    }
  }

  return failures;
}

function calculatePeakRps(completions) {
  if (completions.length === 0) {
    return 0;
  }

  const buckets = new Map();
  for (const completedAt of completions) {
    const bucket = Math.floor(completedAt / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Math.max(...buckets.values());
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.ceil((p / 100) * sortedValues.length) - 1
  );
  return round(sortedValues[index]);
}

function percent(part, whole) {
  return whole === 0 ? 0 : round((part / whole) * 100);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function trimTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function loadEnvFile(envPath) {
  if (!existsSync(envPath)) {
    return;
  }

  const lines = (await readFile(envPath, "utf8")).split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [key, ...valueParts] = trimmed.split("=");
    process.env[key.trim()] ??= valueParts.join("=").trim();
  }
}

function describeEnvironment() {
  return {
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCores: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    node: process.version
  };
}

function renderMarkdown(result) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `Generated: ${result.generatedAt}`,
    `Mode: ${result.mode}`,
    `Target: ${result.targetUrl}`,
    `Concurrency: ${result.settings.concurrency}`,
    `Duration per endpoint: ${result.settings.durationMs}ms`,
    `Max requests per endpoint: ${result.settings.maxRequestsPerEndpoint || "duration-limited"}`,
    "",
    "| Endpoint | Method | Requests | Sustained RPS | Peak RPS | Error % | p50 | p95 | p99 | TTFB p95 |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const endpoint of result.endpoints) {
    lines.push(
      `| ${endpoint.id} | ${endpoint.method} ${endpoint.path} | ${endpoint.requests} | ${endpoint.sustainedRps} | ${endpoint.peakRps} | ${endpoint.errorRatePercent} | ${endpoint.latencyMs.p50}ms | ${endpoint.latencyMs.p95}ms | ${endpoint.latencyMs.p99}ms | ${endpoint.ttfbMs.p95}ms |`
    );
  }

  lines.push("");

  if (result.thresholdFailures.length === 0) {
    lines.push("Threshold gate: passed.");
  } else {
    lines.push("Threshold gate: failed.");
    for (const failure of result.thresholdFailures) {
      lines.push(`- ${failure.endpoint}: ${failure.reason}`);
    }
  }

  lines.push("");
  lines.push("Environment:");
  lines.push(`- Platform: ${result.environment.platform}`);
  lines.push(`- CPU: ${result.environment.cpu}`);
  lines.push(`- Logical cores: ${result.environment.logicalCores}`);
  lines.push(`- Node: ${result.environment.node}`);

  return `${lines.join("\n")}\n`;
}

function renderConsoleSummary(result) {
  const rows = result.endpoints.map((endpoint) => ({
    endpoint: endpoint.id,
    requests: endpoint.requests,
    rps: endpoint.sustainedRps,
    errors: `${endpoint.errorRatePercent}%`,
    p99: `${endpoint.latencyMs.p99}ms`,
    ttfbP95: `${endpoint.ttfbMs.p95}ms`
  }));

  return [
    `API benchmark (${result.mode}) completed against ${result.targetUrl}`,
    `Settings: concurrency=${result.settings.concurrency}, durationMs=${result.settings.durationMs}, maxRequestsPerEndpoint=${result.settings.maxRequestsPerEndpoint || "duration-limited"}`,
    JSON.stringify(rows, null, 2),
    `Threshold gate: ${result.thresholdFailures.length === 0 ? "passed" : "failed"}`
  ].join("\n");
}
