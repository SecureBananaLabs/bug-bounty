import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");

loadBenchmarkEnv();

const isSmoke = process.env.BENCHMARK_SMOKE === "1";
const requestCount = readPositiveInteger(
  process.env.BENCHMARK_REQUESTS,
  isSmoke ? 3 : 8,
);
const concurrency = readPositiveInteger(
  process.env.BENCHMARK_CONCURRENCY,
  isSmoke ? 1 : 4,
);
const targetUrl = process.env.BENCHMARK_TARGET_URL?.replace(/\/$/, "");

const endpointDefinitions = [
  {
    name: "GET /health",
    method: "GET",
    path: "/health",
    expectedStatuses: [200],
  },
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    json: (iteration) => ({
      email: `benchmark-${Date.now()}-${iteration}@example.com`,
      password: "benchmark-password",
      role: "client",
    }),
    expectedStatuses: [201],
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    json: () => ({
      email: "benchmark@example.com",
      password: "benchmark-password",
    }),
    expectedStatuses: [200],
  },
  {
    name: "GET /api/auth/oauth/:provider/callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    expectedStatuses: [200],
  },
  {
    name: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatuses: [200],
  },
  {
    name: "GET /api/users",
    method: "GET",
    path: "/api/users",
    expectedStatuses: [200],
  },
  {
    name: "POST /api/users",
    method: "POST",
    path: "/api/users",
    json: (iteration) => ({
      email: `benchmark-user-${Date.now()}-${iteration}@example.com`,
      fullName: "Benchmark User",
      role: "client",
    }),
    expectedStatuses: [201],
  },
  {
    name: "GET /api/jobs",
    method: "GET",
    path: "/api/jobs",
    expectedStatuses: [200],
  },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    json: () => ({
      title: "Benchmark marketplace build",
      description: "Synthetic benchmark job payload for local API timing.",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_benchmark",
      skills: ["node", "api", "benchmark"],
    }),
    expectedStatuses: [201],
  },
  {
    name: "GET /api/proposals",
    method: "GET",
    path: "/api/proposals",
    expectedStatuses: [200],
  },
  {
    name: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    json: () => ({
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark",
      coverLetter: "Synthetic proposal payload for benchmark coverage.",
      bidAmount: 250,
    }),
    expectedStatuses: [201],
  },
  {
    name: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    json: () => ({
      amount: 2500,
      currency: "usd",
      jobId: "job_benchmark",
    }),
    expectedStatuses: [201],
  },
  {
    name: "GET /api/reviews",
    method: "GET",
    path: "/api/reviews",
    expectedStatuses: [200],
  },
  {
    name: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews",
    json: () => ({
      reviewerId: "usr_client",
      revieweeId: "usr_freelancer",
      rating: 5,
      comment: "Synthetic benchmark review.",
    }),
    expectedStatuses: [201],
  },
  {
    name: "GET /api/messages",
    method: "GET",
    path: "/api/messages",
    expectedStatuses: [200],
  },
  {
    name: "POST /api/messages",
    method: "POST",
    path: "/api/messages",
    json: () => ({
      conversationId: "con_benchmark",
      senderId: "usr_client",
      content: "Synthetic benchmark message.",
    }),
    expectedStatuses: [201],
  },
  {
    name: "GET /api/notifications",
    method: "GET",
    path: "/api/notifications",
    expectedStatuses: [200],
  },
  {
    name: "POST /api/notifications",
    method: "POST",
    path: "/api/notifications",
    json: () => ({
      userId: "usr_benchmark",
      message: "Synthetic benchmark notification.",
      type: "system",
    }),
    expectedStatuses: [201],
  },
  {
    name: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    formData: () => {
      const form = new FormData();
      form.append(
        "file",
        new Blob(["benchmark upload"], { type: "text/plain" }),
        "benchmark.txt",
      );
      return form;
    },
    expectedStatuses: [201],
  },
  {
    name: "GET /api/search",
    method: "GET",
    path: "/api/search?q=benchmark",
    expectedStatuses: [200],
  },
  {
    name: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true,
    expectedStatuses: [200],
  },
];

async function main() {
  process.env.JWT_SECRET ??= "benchmark-secret";

  const thresholds = JSON.parse(await readFile(thresholdsPath, "utf8"));
  const localServer = targetUrl ? null : await startLocalServer();
  const baseUrl = targetUrl ?? localServer.url;
  const authToken =
    process.env.BENCHMARK_AUTH_TOKEN ?? (await createBenchmarkToken());

  try {
    const startedAt = new Date();
    const endpointResults = [];

    for (const endpoint of endpointDefinitions) {
      endpointResults.push(
        await benchmarkEndpoint(endpoint, { baseUrl, authToken }),
      );
    }

    const report = {
      generatedAt: startedAt.toISOString(),
      mode: isSmoke ? "smoke" : "full",
      targetUrl: baseUrl,
      requestsPerEndpoint: requestCount,
      concurrency,
      environment: collectEnvironment(),
      results: endpointResults,
    };

    const violations = collectThresholdViolations(report, thresholds);
    report.thresholdViolations = violations;

    await mkdir(resultsDir, { recursive: true });
    await writeFile(
      path.join(resultsDir, "latest.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    await writeFile(path.join(resultsDir, "latest.md"), renderMarkdown(report));

    if (violations.length > 0) {
      console.error(renderViolationSummary(violations));
      process.exitCode = 1;
    }
  } finally {
    await localServer?.close();
  }
}

async function startLocalServer() {
  const { createApp } = await import("../apps/api/src/app.js");
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

async function createBenchmarkToken() {
  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({
    sub: "usr_benchmark_admin",
    role: "admin",
    purpose: "benchmark",
  });
}

async function benchmarkEndpoint(endpoint, context) {
  const statuses = new Map();
  const timings = [];
  const startedAt = performance.now();
  let launched = 0;

  async function worker() {
    while (launched < requestCount) {
      const iteration = launched;
      launched += 1;

      const measurement = await measureRequest(endpoint, context, iteration);
      timings.push(measurement);
      statuses.set(
        measurement.status,
        (statuses.get(measurement.status) ?? 0) + 1,
      );
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, requestCount) }, () => worker()),
  );

  const durationMs = performance.now() - startedAt;
  const latencies = timings.map((timing) => timing.latencyMs).sort((a, b) => a - b);
  const ttfbs = timings.map((timing) => timing.ttfbMs).sort((a, b) => a - b);
  const errorCount = timings.filter(
    (timing) => !endpoint.expectedStatuses.includes(timing.status),
  ).length;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: timings.length,
    durationMs: round(durationMs),
    sustainedRps: round((timings.length / durationMs) * 1000),
    peakRps: calculatePeakRps(timings, startedAt),
    errorRate: round(errorCount / timings.length),
    statuses: Object.fromEntries([...statuses.entries()].sort()),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      max: round(latencies.at(-1) ?? 0),
    },
    ttfbMs: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99),
    },
  };
}

async function measureRequest(endpoint, { baseUrl, authToken }, iteration) {
  const url = `${baseUrl}${endpoint.path}`;
  const headers = new Headers();
  let body;

  if (endpoint.auth) {
    headers.set("authorization", `Bearer ${authToken}`);
  }

  if (endpoint.json) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(endpoint.json(iteration));
  } else if (endpoint.formData) {
    body = endpoint.formData(iteration);
  }

  const startedAt = performance.now();
  let response;
  let ttfbMs;

  try {
    response = await fetch(url, {
      method: endpoint.method,
      headers,
      body,
    });
    ttfbMs = performance.now() - startedAt;
    await response.arrayBuffer();
  } catch (error) {
    const latencyMs = performance.now() - startedAt;
    return {
      status: 0,
      latencyMs: round(latencyMs),
      ttfbMs: round(ttfbMs ?? latencyMs),
      completedAt: performance.now(),
      error: error.message,
    };
  }

  return {
    status: response.status,
    latencyMs: round(performance.now() - startedAt),
    ttfbMs: round(ttfbMs),
    completedAt: performance.now(),
  };
}

function collectThresholdViolations(report, thresholds) {
  const defaults = thresholds.defaults ?? {};
  const endpointThresholds = thresholds.endpoints ?? {};
  const violations = [];

  for (const result of report.results) {
    const threshold = {
      ...defaults,
      ...(endpointThresholds[result.name] ?? {}),
    };

    if (
      Number.isFinite(threshold.maxP99Ms) &&
      result.latencyMs.p99 > threshold.maxP99Ms
    ) {
      violations.push({
        endpoint: result.name,
        metric: "p99 latency",
        actual: result.latencyMs.p99,
        threshold: threshold.maxP99Ms,
      });
    }

    if (
      Number.isFinite(threshold.maxErrorRate) &&
      result.errorRate > threshold.maxErrorRate
    ) {
      violations.push({
        endpoint: result.name,
        metric: "error rate",
        actual: result.errorRate,
        threshold: threshold.maxErrorRate,
      });
    }
  }

  return violations;
}

function renderMarkdown(report) {
  const rows = report.results
    .map(
      (result) =>
        `| ${result.name} | ${result.requests} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.sustainedRps} | ${result.peakRps} | ${formatPercent(result.errorRate)} | ${formatStatuses(result.statuses)} |`,
    )
    .join("\n");

  return `# API Benchmark Results

- Generated: ${report.generatedAt}
- Mode: ${report.mode}
- Target: ${report.targetUrl}
- Requests per endpoint: ${report.requestsPerEndpoint}
- Concurrency: ${report.concurrency}
- Runtime: ${report.environment.node} on ${report.environment.platform}
- CPU cores: ${report.environment.cpuCount}
- Memory: ${report.environment.totalMemoryMb} MB total

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error rate | Statuses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}

${renderViolationMarkdown(report.thresholdViolations)}
`;
}

function renderViolationMarkdown(violations) {
  if (violations.length === 0) {
    return "Threshold check: passed.";
  }

  const rows = violations
    .map(
      (violation) =>
        `| ${violation.endpoint} | ${violation.metric} | ${violation.actual} | ${violation.threshold} |`,
    )
    .join("\n");

  return `Threshold check: failed.

| Endpoint | Metric | Actual | Threshold |
| --- | --- | ---: | ---: |
${rows}`;
}

function renderViolationSummary(violations) {
  return violations
    .map(
      (violation) =>
        `${violation.endpoint} exceeded ${violation.metric}: ${violation.actual} > ${violation.threshold}`,
    )
    .join("\n");
}

function calculatePeakRps(timings, benchmarkStartedAt) {
  const buckets = new Map();

  for (const timing of timings) {
    const second = Math.floor((timing.completedAt - benchmarkStartedAt) / 1000);
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }

  return Math.max(...buckets.values(), 0);
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return round(sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))]);
}

function readPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function collectEnvironment() {
  return {
    node: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpuModel: os.cpus()[0]?.model ?? "unknown",
    cpuCount: os.cpus().length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
  };
}

function loadBenchmarkEnv() {
  const envPath = path.join(__dirname, ".env.benchmark");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function formatPercent(rate) {
  return `${round(rate * 100)}%`;
}

function formatStatuses(statuses) {
  return Object.entries(statuses)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");
}

function round(value) {
  return Math.round(value * 100) / 100;
}

await main();
