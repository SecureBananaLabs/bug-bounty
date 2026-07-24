import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");

const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke");
const shouldWriteResults = !args.has("--no-write-results");

const config = {
  concurrency: numberFromEnv(
    "BENCHMARK_CONCURRENCY",
    isSmoke ? 1 : 2
  ),
  durationSeconds: numberFromEnv(
    "BENCHMARK_DURATION_SECONDS",
    isSmoke ? 1 : 3
  ),
  maxRequestsPerEndpoint: numberFromEnv(
    "BENCHMARK_MAX_REQUESTS_PER_ENDPOINT",
    isSmoke ? 1 : 9
  ),
  timeoutMs: numberFromEnv("BENCHMARK_TIMEOUT_MS", 5000),
  targetUrl: process.env.BENCHMARK_TARGET_URL,
  benchmarkToken: process.env.BENCHMARK_AUTH_TOKEN,
};

const benchmarkId = new Date().toISOString().replace(/[:.]/g, "-");

const routes = [
  route("GET", "/health", "health"),
  jsonRoute("POST", "/api/auth/register", "auth register", () => ({
    email: `bench-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: "Benchmark123!",
    role: "client",
  })),
  jsonRoute("POST", "/api/auth/login", "auth login", () => ({
    email: "benchmark@example.com",
    password: "Benchmark123!",
  })),
  route("GET", "/api/auth/oauth/github/callback", "auth oauth callback"),
  jsonRoute("POST", "/api/auth/refresh", "auth refresh", () => ({})),
  route("GET", "/api/users", "users list"),
  jsonRoute("POST", "/api/users", "users create", () => ({
    name: "Benchmark User",
    email: `bench-user-${Date.now()}@example.com`,
    role: "client",
  })),
  route("GET", "/api/jobs", "jobs list"),
  jsonRoute("POST", "/api/jobs", "jobs create", () => ({
    title: "Build a benchmark dashboard",
    description: "Create a small dashboard for benchmark result summaries.",
    budgetMin: 500,
    budgetMax: 1500,
    categoryId: "cat_development",
    skills: ["node", "api", "performance"],
  })),
  route("GET", "/api/proposals", "proposals list"),
  jsonRoute("POST", "/api/proposals", "proposals create", () => ({
    jobId: "job_benchmark",
    freelancerId: "usr_benchmark",
    coverLetter: "Synthetic benchmark proposal payload.",
    bidAmount: 900,
  })),
  jsonRoute("POST", "/api/payments", "payments create", () => ({
    proposalId: "proposal_benchmark",
    amount: 900,
    currency: "usd",
  })),
  route("GET", "/api/reviews", "reviews list"),
  jsonRoute("POST", "/api/reviews", "reviews create", () => ({
    targetUserId: "usr_benchmark",
    rating: 5,
    comment: "Synthetic review payload for benchmarks.",
  })),
  route("GET", "/api/messages", "messages list"),
  jsonRoute("POST", "/api/messages", "messages create", () => ({
    conversationId: "conv_benchmark",
    senderId: "usr_benchmark",
    body: "Synthetic benchmark message.",
  })),
  route("GET", "/api/notifications", "notifications list"),
  jsonRoute("POST", "/api/notifications", "notifications create", () => ({
    userId: "usr_benchmark",
    type: "benchmark",
    message: "Synthetic benchmark notification.",
  })),
  uploadRoute(),
  route("GET", "/api/search?q=benchmark", "search"),
  authRoute("GET", "/api/admin/metrics", "admin metrics"),
];

async function main() {
  const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
  const localServer = await maybeStartLocalServer();
  const targetUrl = config.targetUrl ?? localServer.url;
  const token = config.benchmarkToken ?? signAccessToken({
    sub: "benchmark-user",
    role: "admin",
  });

  const startedAt = new Date().toISOString();
  const results = [];

  try {
    for (const endpoint of routes) {
      const result = await runEndpoint(targetUrl, endpoint, token);
      results.push(result);
      printResult(result);
    }
  } finally {
    await localServer.close();
  }

  const report = {
    benchmarkId,
    mode: isSmoke ? "smoke" : "full",
    startedAt,
    finishedAt: new Date().toISOString(),
    targetUrl: config.targetUrl ? redactTarget(targetUrl) : "local in-process Express server",
    config,
    environment: getEnvironment(),
    results,
    thresholdFailures: evaluateThresholds(results, thresholds, isSmoke),
  };

  if (shouldWriteResults) {
    await writeReports(report);
  }

  if (report.thresholdFailures.length > 0) {
    console.error("\nBenchmark thresholds failed:");
    for (const failure of report.thresholdFailures) {
      console.error(`- ${failure.endpoint}: ${failure.metric} ${failure.actual} > ${failure.limit}`);
    }
    process.exitCode = 1;
  }
}

function route(method, routePath, name) {
  return { method, path: routePath, name };
}

function jsonRoute(method, routePath, name, bodyFactory) {
  return {
    ...route(method, routePath, name),
    makeRequest() {
      return {
        headers: { "content-type": "application/json" },
        body: JSON.stringify(bodyFactory()),
      };
    },
  };
}

function authRoute(method, routePath, name) {
  return {
    ...route(method, routePath, name),
    makeRequest({ token }) {
      return { headers: { authorization: `Bearer ${token}` } };
    },
  };
}

function uploadRoute() {
  return {
    method: "POST",
    path: "/api/uploads",
    name: "uploads create",
    makeRequest() {
      const form = new FormData();
      form.append(
        "file",
        new Blob(["benchmark file payload"], { type: "text/plain" }),
        "benchmark.txt"
      );
      return { body: form };
    },
  };
}

async function maybeStartLocalServer() {
  if (config.targetUrl) {
    return {
      url: config.targetUrl.replace(/\/$/, ""),
      close: async () => {},
    };
  }

  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function runEndpoint(targetUrl, endpoint, token) {
  const samples = [];
  const statuses = new Map();
  const errors = [];
  const started = performance.now();
  const deadline = started + config.durationSeconds * 1000;
  let scheduled = 0;

  async function worker() {
    while (
      scheduled < config.maxRequestsPerEndpoint &&
      performance.now() < deadline
    ) {
      scheduled += 1;
      const sample = await sendRequest(targetUrl, endpoint, token);
      sample.completedAtMs = performance.now() - started;
      samples.push(sample);
      statuses.set(sample.status, (statuses.get(sample.status) ?? 0) + 1);
      if (sample.error) errors.push(sample.error);
    }
  }

  const workerCount = Math.max(1, Math.min(config.concurrency, config.maxRequestsPerEndpoint));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  const durationMs = performance.now() - started;

  const total = samples.length;
  const failed = samples.filter((sample) => sample.error || sample.status >= 500).length;
  const non2xx = samples.filter((sample) => sample.status < 200 || sample.status >= 300).length;
  const latencyValues = samples.map((sample) => sample.totalMs);
  const ttfbValues = samples.map((sample) => sample.ttfbMs);

  return {
    name: endpoint.name,
    endpoint: `${endpoint.method} ${endpoint.path}`,
    requests: total,
    durationMs: round(durationMs),
    rps: round(total / (durationMs / 1000)),
    peakRps: calculatePeakRps(samples, durationMs),
    statusCounts: Object.fromEntries([...statuses.entries()].sort()),
    errorRatePct: pct(failed, total),
    non2xxRatePct: pct(non2xx, total),
    latencyMs: summarize(latencyValues),
    ttfbMs: summarize(ttfbValues),
    errors: [...new Set(errors)].slice(0, 5),
  };
}

async function sendRequest(targetUrl, endpoint, token) {
  const url = new URL(endpoint.path, `${targetUrl}/`);
  const request = endpoint.makeRequest?.({ token }) ?? {};
  const started = performance.now();

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: request.headers,
      body: request.body,
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    const ttfbMs = performance.now() - started;
    await response.arrayBuffer();
    return {
      status: response.status,
      ttfbMs: round(ttfbMs),
      totalMs: round(performance.now() - started),
    };
  } catch (error) {
    return {
      status: 0,
      ttfbMs: round(performance.now() - started),
      totalMs: round(performance.now() - started),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function summarize(values) {
  if (values.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: round(sorted[0]),
    max: round(sorted[sorted.length - 1]),
    avg: round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length),
  };
}

function percentile(sortedValues, percentileValue) {
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return round(sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))]);
}

function evaluateThresholds(results, thresholds, smoke) {
  const base = smoke ? thresholds.smoke : thresholds.defaults;
  const failures = [];

  for (const result of results) {
    const endpointThresholds = {
      ...base,
      ...(thresholds.endpoints?.[result.endpoint] ?? {}),
    };

    compare(failures, result.endpoint, "p99 latency ms", result.latencyMs.p99, endpointThresholds.p99LatencyMs);
    compare(failures, result.endpoint, "error rate pct", result.errorRatePct, endpointThresholds.errorRatePct);
    compare(failures, result.endpoint, "non-2xx rate pct", result.non2xxRatePct, endpointThresholds.non2xxRatePct);
  }

  return failures;
}

function compare(failures, endpoint, metric, actual, limit) {
  if (typeof limit === "number" && actual > limit) {
    failures.push({ endpoint, metric, actual, limit });
  }
}

async function writeReports(report) {
  await fs.mkdir(resultsDir, { recursive: true });
  await fs.writeFile(
    path.join(resultsDir, "latest.json"),
    `${JSON.stringify(report, null, 2)}\n`
  );
  await fs.writeFile(path.join(resultsDir, "summary.md"), renderMarkdown(report));
}

function renderMarkdown(report) {
  const rows = report.results
    .map((result) =>
      `| ${[
        result.endpoint,
        result.requests,
        result.rps,
        result.peakRps,
        result.latencyMs.p50,
        result.latencyMs.p95,
        result.latencyMs.p99,
        result.ttfbMs.p95,
        result.errorRatePct,
        result.non2xxRatePct,
      ].join(" | ")} |`
    )
    .join("\n");

  const failures = report.thresholdFailures.length
    ? report.thresholdFailures
        .map((failure) => `- ${failure.endpoint}: ${failure.metric} ${failure.actual} > ${failure.limit}`)
        .join("\n")
    : "- None";

  return `# API Benchmark Summary

- Benchmark ID: ${report.benchmarkId}
- Mode: ${report.mode}
- Target: ${report.targetUrl}
- Started: ${report.startedAt}
- Finished: ${report.finishedAt}
- Concurrency: ${report.config.concurrency}
- Max requests per endpoint: ${report.config.maxRequestsPerEndpoint}
- Duration cap per endpoint: ${report.config.durationSeconds}s
- Node.js: ${report.environment.node}
- Platform: ${report.environment.platform}

| Endpoint | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Error % | Non-2xx % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Threshold Failures

${failures}
`;
}

function printResult(result) {
  console.log(
    `${result.endpoint.padEnd(34)} requests=${String(result.requests).padStart(3)} rps=${String(result.rps).padStart(7)} peak=${String(result.peakRps).padStart(3)} p99=${String(result.latencyMs.p99).padStart(7)}ms errors=${result.errorRatePct}% non2xx=${result.non2xxRatePct}%`
  );
}

function calculatePeakRps(samples, durationMs) {
  if (samples.length === 0 || durationMs <= 0) {
    return 0;
  }

  if (durationMs <= 1000) {
    return round(samples.length / (durationMs / 1000));
  }

  const completions = samples
    .map((sample) => sample.completedAtMs ?? 0)
    .sort((a, b) => a - b);
  let peakCount = 0;
  let left = 0;

  for (let right = 0; right < completions.length; right += 1) {
    while (completions[right] - completions[left] > 1000) {
      left += 1;
    }
    peakCount = Math.max(peakCount, right - left + 1);
  }

  return peakCount;
}

function getEnvironment() {
  return {
    node: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model,
    logicalCpus: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    cwd: rootDir,
  };
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function pct(part, total) {
  return total ? round((part / total) * 100) : 0;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function redactTarget(targetUrl) {
  const url = new URL(targetUrl);
  return `${url.protocol}//${url.host}`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
