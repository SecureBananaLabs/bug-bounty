import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const isSmoke = process.argv.includes("--smoke");
const outputDir = resolve(rootDir, process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results");
const thresholds = JSON.parse(await readFile(resolve(__dirname, "thresholds.json"), "utf8"));

const config = {
  concurrency: numberFromEnv("BENCHMARK_CONCURRENCY", isSmoke ? 2 : 4),
  requestsPerRoute: numberFromEnv("BENCHMARK_REQUESTS_PER_ROUTE", isSmoke ? 4 : 8),
  mode: isSmoke ? "smoke" : "full"
};

const scenarios = [
  { name: "health", method: "GET", path: "/health" },
  { name: "auth_register", method: "POST", path: "/api/auth/register", body: () => ({ email: uniqueEmail("register"), password: "benchmark-password", role: "client" }) },
  { name: "auth_login", method: "POST", path: "/api/auth/login", body: () => ({ email: uniqueEmail("login"), password: "benchmark-password" }) },
  { name: "auth_oauth_callback", method: "GET", path: "/api/auth/oauth/github/callback" },
  { name: "auth_refresh", method: "POST", path: "/api/auth/refresh" },
  { name: "users_list", method: "GET", path: "/api/users" },
  { name: "users_create", method: "POST", path: "/api/users", body: () => ({ email: uniqueEmail("user"), name: "Benchmark User", role: "freelancer" }) },
  { name: "jobs_list", method: "GET", path: "/api/jobs" },
  { name: "jobs_create", method: "POST", path: "/api/jobs", body: () => ({ title: "Benchmark API Route", description: "Synthetic benchmark job payload", budgetMin: 100, budgetMax: 250, categoryId: "cat_benchmark", skills: ["node", "api"] }) },
  { name: "proposals_list", method: "GET", path: "/api/proposals" },
  { name: "proposals_create", method: "POST", path: "/api/proposals", body: () => ({ jobId: "job_benchmark", freelancerId: "usr_benchmark", coverLetter: "Benchmark proposal payload", amount: 150 }) },
  { name: "payments_create", method: "POST", path: "/api/payments", body: () => ({ amount: 15000, currency: "usd", jobId: "job_benchmark" }) },
  { name: "reviews_list", method: "GET", path: "/api/reviews" },
  { name: "reviews_create", method: "POST", path: "/api/reviews", body: () => ({ jobId: "job_benchmark", rating: 5, comment: "Benchmark review payload" }) },
  { name: "messages_list", method: "GET", path: "/api/messages" },
  { name: "messages_create", method: "POST", path: "/api/messages", body: () => ({ threadId: "thr_benchmark", message: "Benchmark message payload" }) },
  { name: "notifications_list", method: "GET", path: "/api/notifications" },
  { name: "notifications_create", method: "POST", path: "/api/notifications", body: () => ({ userId: "usr_benchmark", type: "benchmark", message: "Benchmark notification payload" }) },
  { name: "uploads_create_empty", method: "POST", path: "/api/uploads" },
  { name: "search", method: "GET", path: "/api/search?q=benchmark" },
  { name: "admin_metrics", method: "GET", path: "/api/admin/metrics", auth: true }
];

const localServer = await maybeStartLocalServer();
const baseUrl = process.env.BENCHMARK_TARGET_URL ?? localServer.url;
const authToken = process.env.BENCHMARK_AUTH_TOKEN || signAccessToken({ sub: "usr_benchmark_admin", role: "admin" });

try {
  const startedAt = new Date().toISOString();
  const routeResults = [];

  for (const scenario of scenarios) {
    routeResults.push(await runScenario(baseUrl, scenario, authToken, config));
  }

  const summary = summarize(routeResults, startedAt, baseUrl, config);
  await writeResults(summary);

  const activeThresholds = thresholds[config.mode];
  const failures = routeResults.filter((result) => result.p99Ms > activeThresholds.maxP99Ms || result.errorRate > activeThresholds.maxErrorRate);

  console.log(`Benchmark ${config.mode} complete: ${routeResults.length} routes, ${summary.totalRequests} requests`);
  console.log(`Results: ${summary.jsonPath}`);
  console.log(`Summary: ${summary.markdownPath}`);

  if (failures.length) {
    console.error("Threshold failures:");
    for (const failure of failures) {
      console.error(`- ${failure.name}: p99=${failure.p99Ms}ms errorRate=${(failure.errorRate * 100).toFixed(2)}%`);
    }
    process.exitCode = 1;
  }
} finally {
  await localServer?.close?.();
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@benchmark.local`;
}

async function maybeStartLocalServer() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return null;
  }

  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolveListening, rejectListening) => {
    server.once("listening", resolveListening);
    server.once("error", rejectListening);
  });

  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolveClose, rejectClose) => server.close((error) => (error ? rejectClose(error) : resolveClose())))
  };
}

async function runScenario(baseUrl, scenario, authToken, currentConfig) {
  const timings = [];
  const ttfbTimings = [];
  const statuses = new Map();
  let errors = 0;
  let completed = 0;
  const started = performance.now();

  async function worker() {
    while (completed < currentConfig.requestsPerRoute) {
      completed += 1;
      const result = await measureRequest(baseUrl, scenario, authToken);
      timings.push(result.latencyMs);
      ttfbTimings.push(result.ttfbMs);
      statuses.set(result.status, (statuses.get(result.status) ?? 0) + 1);
      if (result.error) {
        errors += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: currentConfig.concurrency }, () => worker()));
  const durationSeconds = (performance.now() - started) / 1000;
  timings.sort((a, b) => a - b);
  ttfbTimings.sort((a, b) => a - b);

  return {
    name: scenario.name,
    method: scenario.method,
    path: scenario.path,
    requests: timings.length,
    statuses: Object.fromEntries(statuses),
    errorRate: timings.length ? errors / timings.length : 0,
    requestsPerSecond: round(timings.length / durationSeconds),
    p50Ms: percentile(timings, 50),
    p95Ms: percentile(timings, 95),
    p99Ms: percentile(timings, 99),
    ttfbP50Ms: percentile(ttfbTimings, 50),
    ttfbP95Ms: percentile(ttfbTimings, 95),
    ttfbP99Ms: percentile(ttfbTimings, 99),
    minMs: round(timings[0] ?? 0),
    maxMs: round(timings.at(-1) ?? 0)
  };
}

async function measureRequest(baseUrl, scenario, authToken) {
  const headers = {};
  const options = { method: scenario.method, headers };

  if (scenario.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (scenario.body) {
    headers["content-type"] = "application/json";
    options.body = JSON.stringify(scenario.body());
  }

  const started = performance.now();

  try {
    const response = await fetch(new URL(scenario.path, baseUrl), options);
    const ttfbMs = round(performance.now() - started);
    await response.arrayBuffer();
    const latencyMs = round(performance.now() - started);
    return {
      status: response.status,
      ttfbMs,
      latencyMs,
      error: response.status >= 400
    };
  } catch {
    return {
      status: "network_error",
      ttfbMs: round(performance.now() - started),
      latencyMs: round(performance.now() - started),
      error: true
    };
  }
}

function percentile(sortedValues, target) {
  if (!sortedValues.length) {
    return 0;
  }
  const index = Math.ceil((target / 100) * sortedValues.length) - 1;
  return round(sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)]);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function summarize(results, startedAt, targetUrl, currentConfig) {
  const totalRequests = results.reduce((sum, result) => sum + result.requests, 0);
  const totalErrors = results.reduce((sum, result) => sum + Math.round(result.errorRate * result.requests), 0);
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const jsonPath = resolve(outputDir, `benchmark-${currentConfig.mode}-${stamp}.json`);
  const markdownPath = resolve(outputDir, `benchmark-${currentConfig.mode}-${stamp}.md`);

  return {
    startedAt,
    finishedAt: now.toISOString(),
    mode: currentConfig.mode,
    targetUrl,
    concurrency: currentConfig.concurrency,
    requestsPerRoute: currentConfig.requestsPerRoute,
    totalRequests,
    totalErrors,
    overallErrorRate: totalRequests ? round(totalErrors / totalRequests) : 0,
    routes: results,
    jsonPath,
    markdownPath
  };
}

async function writeResults(summary) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(summary.jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(summary.markdownPath, toMarkdown(summary));
}

function toMarkdown(summary) {
  const lines = [
    `# API Benchmark Summary (${summary.mode})`,
    "",
    `- Target: ${summary.targetUrl}`,
    `- Started: ${summary.startedAt}`,
    `- Finished: ${summary.finishedAt}`,
    `- Concurrency: ${summary.concurrency}`,
    `- Requests per route: ${summary.requestsPerRoute}`,
    `- Total requests: ${summary.totalRequests}`,
    `- Overall error rate: ${(summary.overallErrorRate * 100).toFixed(2)}%`,
    "",
    "| Route | Method | Requests | RPS | p50 | p95 | p99 | TTFB p95 | Error rate | Statuses |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const route of summary.routes) {
    lines.push(`| \`${route.path}\` | ${route.method} | ${route.requests} | ${route.requestsPerSecond} | ${route.p50Ms}ms | ${route.p95Ms}ms | ${route.p99Ms}ms | ${route.ttfbP95Ms}ms | ${(route.errorRate * 100).toFixed(2)}% | \`${JSON.stringify(route.statuses)}\` |`);
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}
