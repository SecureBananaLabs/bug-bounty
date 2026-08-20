import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const thresholdPath = path.join(__dirname, "thresholds.json");

const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke") || process.env.BENCHMARK_SMOKE === "1";
const checkThresholds =
  args.has("--check-thresholds") ||
  process.env.BENCHMARK_CHECK_THRESHOLDS === "1" ||
  isSmoke;

const durationSeconds = numberFromEnv(
  "BENCHMARK_DURATION_SECONDS",
  isSmoke ? 1 : 3
);
const concurrency = numberFromEnv("BENCHMARK_CONCURRENCY", isSmoke ? 2 : 8);
const warmupRequests = numberFromEnv("BENCHMARK_WARMUP_REQUESTS", isSmoke ? 1 : 2);
const maxRequestsPerEndpoint = numberFromEnv(
  "BENCHMARK_MAX_REQUESTS_PER_ENDPOINT",
  isSmoke ? 2 : 8
);
const externalTarget = stripTrailingSlash(process.env.BENCHMARK_TARGET_URL ?? "");

const endpointDefinitions = [
  {
    id: "health",
    group: "health",
    method: "GET",
    path: "/health",
    kind: "read"
  },
  {
    id: "auth-register",
    group: "auth",
    method: "POST",
    path: "/api/auth/register",
    kind: "write",
    json: (run) => ({
      email: `bench-register-${run}@example.com`,
      password: "benchmark-password-123",
      role: run % 2 === 0 ? "client" : "freelancer"
    })
  },
  {
    id: "auth-login",
    group: "auth",
    method: "POST",
    path: "/api/auth/login",
    kind: "write",
    json: () => ({
      email: "bench-login@example.com",
      password: "benchmark-password-123"
    })
  },
  {
    id: "auth-oauth-callback",
    group: "auth",
    method: "GET",
    path: "/api/auth/oauth/github/callback?code=benchmark-code",
    kind: "read"
  },
  {
    id: "auth-refresh",
    group: "auth",
    method: "POST",
    path: "/api/auth/refresh",
    kind: "write",
    json: () => ({ refreshToken: "benchmark-refresh-token" })
  },
  {
    id: "users-list",
    group: "users",
    method: "GET",
    path: "/api/users",
    kind: "read"
  },
  {
    id: "users-create",
    group: "users",
    method: "POST",
    path: "/api/users",
    kind: "write",
    json: (run) => ({
      name: `Benchmark User ${run}`,
      email: `bench-user-${run}@example.com`,
      role: run % 2 === 0 ? "client" : "freelancer"
    })
  },
  {
    id: "jobs-list",
    group: "jobs",
    method: "GET",
    path: "/api/jobs",
    kind: "read"
  },
  {
    id: "jobs-create",
    group: "jobs",
    method: "POST",
    path: "/api/jobs",
    kind: "write",
    json: (run) => ({
      title: `Benchmark API job ${run}`,
      description: "Synthetic benchmark job used to measure the API create path.",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_benchmark",
      skills: ["node", "api", "benchmark"]
    })
  },
  {
    id: "proposals-list",
    group: "proposals",
    method: "GET",
    path: "/api/proposals",
    kind: "read"
  },
  {
    id: "proposals-create",
    group: "proposals",
    method: "POST",
    path: "/api/proposals",
    kind: "write",
    json: (run) => ({
      jobId: `job_benchmark_${run}`,
      freelancerId: "usr_benchmark_freelancer",
      clientId: "usr_benchmark_client",
      bidAmount: 250,
      estimatedDurationDays: 7,
      coverLetter: "Synthetic benchmark proposal payload."
    })
  },
  {
    id: "payments-create",
    group: "payments",
    method: "POST",
    path: "/api/payments",
    kind: "write",
    json: (run) => ({
      amount: 25000,
      currency: "usd",
      jobId: `job_benchmark_${run}`,
      clientId: "usr_benchmark_client"
    })
  },
  {
    id: "reviews-list",
    group: "reviews",
    method: "GET",
    path: "/api/reviews",
    kind: "read"
  },
  {
    id: "reviews-create",
    group: "reviews",
    method: "POST",
    path: "/api/reviews",
    kind: "write",
    json: (run) => ({
      jobId: `job_benchmark_${run}`,
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Synthetic benchmark review payload."
    })
  },
  {
    id: "messages-list",
    group: "messages",
    method: "GET",
    path: "/api/messages",
    kind: "read"
  },
  {
    id: "messages-create",
    group: "messages",
    method: "POST",
    path: "/api/messages",
    kind: "write",
    json: (run) => ({
      senderId: "usr_benchmark_client",
      receiverId: "usr_benchmark_freelancer",
      body: `Synthetic benchmark message ${run}`
    })
  },
  {
    id: "notifications-list",
    group: "notifications",
    method: "GET",
    path: "/api/notifications",
    kind: "read"
  },
  {
    id: "notifications-create",
    group: "notifications",
    method: "POST",
    path: "/api/notifications",
    kind: "write",
    json: (run) => ({
      userId: "usr_benchmark_client",
      type: "benchmark.notification",
      message: `Synthetic benchmark notification ${run}`
    })
  },
  {
    id: "uploads-create",
    group: "uploads",
    method: "POST",
    path: "/api/uploads",
    kind: "write",
    formData: (run) => {
      const form = new FormData();
      const payload = JSON.stringify({ run, fixture: "benchmark-upload" });
      form.append("file", new Blob([payload], { type: "application/json" }), "benchmark.json");
      return form;
    }
  },
  {
    id: "search",
    group: "search",
    method: "GET",
    path: "/api/search?q=benchmark",
    kind: "read"
  },
  {
    id: "admin-metrics",
    group: "admin",
    method: "GET",
    path: "/api/admin/metrics",
    kind: "read",
    auth: true
  }
];

const thresholds = JSON.parse(await readFile(thresholdPath, "utf8"));
const serverContext = await createServerContext();
const targetBaseUrl = serverContext.baseUrl;
const authToken = await resolveAuthToken(serverContext.startedInProcess);

try {
  const results = [];

  for (const endpoint of endpointDefinitions) {
    await warmUp(endpoint, targetBaseUrl, authToken);
    results.push(await benchmarkEndpoint(endpoint, targetBaseUrl, authToken));
  }

  const report = buildReport(results, serverContext);
  await writeReports(report);

  printSummary(report);

  if (checkThresholds && report.thresholdFailures.length > 0) {
    process.exitCode = 1;
  }
} finally {
  await serverContext.close();
}

function numberFromEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

async function createServerContext() {
  if (externalTarget) {
    return {
      baseUrl: externalTarget,
      startedInProcess: false,
      close: async () => {}
    };
  }

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    startedInProcess: true,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function resolveAuthToken(startedInProcess) {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  if (!startedInProcess) {
    return "";
  }

  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({ sub: "usr_benchmark_admin", role: "admin" });
}

async function warmUp(endpoint, baseUrl, token) {
  for (let index = 0; index < warmupRequests; index += 1) {
    await sendRequest(endpoint, baseUrl, token, index).catch(() => {});
  }
}

async function benchmarkEndpoint(endpoint, baseUrl, token) {
  const startedAt = performance.now();
  const deadline = startedAt + durationSeconds * 1000;
  const samples = [];
  const statusCounts = {};
  const perSecondBuckets = new Map();
  let sequence = 0;

  async function worker(workerIndex) {
    while (performance.now() < deadline) {
      if (sequence >= maxRequestsPerEndpoint) {
        break;
      }

      const run = sequence;
      sequence += 1;

      const sample = await sendRequest(endpoint, baseUrl, token, run, startedAt).catch((error) => ({
        ok: false,
        status: 0,
        error: error.message,
        ttfbMs: 0,
        totalMs: 0,
        startedOffsetMs: performance.now() - startedAt
      }));

      samples.push(sample);
      const statusKey = String(sample.status);
      statusCounts[statusKey] = (statusCounts[statusKey] ?? 0) + 1;

      const bucket = Math.floor(sample.startedOffsetMs / 1000);
      perSecondBuckets.set(bucket, (perSecondBuckets.get(bucket) ?? 0) + 1);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));

  const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001);
  const measuredWindowSeconds = Math.max(durationSeconds, elapsedSeconds);
  const successful = samples.filter((sample) => sample.ok);
  const latencies = successful.map((sample) => sample.totalMs);
  const ttfbs = successful.map((sample) => sample.ttfbMs);
  const errorCount = samples.length - successful.length;

  return {
    id: endpoint.id,
    group: endpoint.group,
    method: endpoint.method,
    path: endpoint.path,
    kind: endpoint.kind,
    samples: samples.length,
    successes: successful.length,
    errors: errorCount,
    errorRate: samples.length ? errorCount / samples.length : 1,
    elapsedSeconds: round(elapsedSeconds, 3),
    requestsPerSecond: round(samples.length / measuredWindowSeconds, 2),
    peakRequestsPerSecond: Math.max(0, ...perSecondBuckets.values()),
    statusCounts,
    latencyMs: {
      min: percentile(latencies, 0),
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      max: percentile(latencies, 100)
    },
    ttfbMs: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    }
  };
}

async function sendRequest(endpoint, baseUrl, token, run, benchmarkStartedAt = performance.now()) {
  const url = `${baseUrl}${endpoint.path}`;
  const headers = {};
  const init = {
    method: endpoint.method,
    headers
  };

  if (endpoint.auth && token) {
    headers.authorization = `Bearer ${token}`;
  }

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(endpoint.json(run));
  }

  if (endpoint.formData) {
    init.body = endpoint.formData(run);
  }

  const startedAt = performance.now();
  const response = await fetch(url, init);
  const headersReceivedAt = performance.now();
  await response.arrayBuffer();
  const finishedAt = performance.now();

  return {
    ok: response.status < 400,
    status: response.status,
    ttfbMs: round(headersReceivedAt - startedAt, 3),
    totalMs: round(finishedAt - startedAt, 3),
    startedOffsetMs: startedAt - benchmarkStartedAt
  };
}

function percentile(values, percent) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((percent / 100) * sorted.length) - 1;
  return round(sorted[Math.max(0, Math.min(sorted.length - 1, index))], 3);
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function buildReport(results, serverContext) {
  const generatedAt = new Date().toISOString();
  const mode = isSmoke ? "smoke" : "full";
  const thresholdFailures = collectThresholdFailures(results, mode);

  return {
    schemaVersion: 1,
    generatedAt,
    mode,
    target: {
      baseUrl: targetBaseUrl,
      startedInProcess: serverContext.startedInProcess
    },
    config: {
      durationSeconds,
      concurrency,
      warmupRequests,
      maxRequestsPerEndpoint,
      checkThresholds
    },
    environment: collectEnvironment(),
    thresholds: thresholds[mode],
    endpoints: results,
    aggregate: aggregateResults(results),
    thresholdFailures
  };
}

function collectThresholdFailures(results, mode) {
  const active = thresholds[mode];
  const failures = [];

  for (const result of results) {
    if (result.samples < active.minRequestsPerEndpoint) {
      failures.push(`${result.id}: only ${result.samples} request samples`);
    }

    if (result.errorRate > active.maxErrorRate) {
      failures.push(
        `${result.id}: error rate ${formatPercent(result.errorRate)} exceeds ${formatPercent(active.maxErrorRate)}`
      );
    }

    if (mode === "smoke" && result.latencyMs.p99 > active.maxP99Ms) {
      failures.push(`${result.id}: p99 ${result.latencyMs.p99}ms exceeds ${active.maxP99Ms}ms`);
    }

    if (mode === "full") {
      if (result.kind === "read" && result.latencyMs.p50 > active.readMaxP50Ms) {
        failures.push(`${result.id}: read p50 ${result.latencyMs.p50}ms exceeds ${active.readMaxP50Ms}ms`);
      }
      if (result.kind === "read" && result.latencyMs.p95 > active.readMaxP95Ms) {
        failures.push(`${result.id}: read p95 ${result.latencyMs.p95}ms exceeds ${active.readMaxP95Ms}ms`);
      }
      if (result.latencyMs.p99 > active.allMaxP99Ms) {
        failures.push(`${result.id}: p99 ${result.latencyMs.p99}ms exceeds ${active.allMaxP99Ms}ms`);
      }
    }
  }

  return failures;
}

function collectEnvironment() {
  return {
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpus: os.cpus().map((cpu) => cpu.model.trim()),
    cpuCount: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    node: process.version,
    npmUserAgent: process.env.npm_config_user_agent ?? "",
    cwd: repoRoot
  };
}

function aggregateResults(results) {
  const totalSamples = results.reduce((sum, result) => sum + result.samples, 0);
  const totalErrors = results.reduce((sum, result) => sum + result.errors, 0);

  return {
    endpoints: results.length,
    totalSamples,
    totalErrors,
    errorRate: totalSamples ? round(totalErrors / totalSamples, 4) : 1,
    requestsPerSecond: round(
      results.reduce((sum, result) => sum + result.requestsPerSecond, 0),
      2
    ),
    peakRequestsPerSecond: results.reduce(
      (sum, result) => sum + result.peakRequestsPerSecond,
      0
    )
  };
}

async function writeReports(report) {
  await mkdir(resultsDir, { recursive: true });
  const jsonPath = path.join(resultsDir, "api-benchmark-latest.json");
  const markdownPath = path.join(resultsDir, "api-benchmark-latest.md");

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdown(report));
}

function renderMarkdown(report) {
  const lines = [
    "# API Benchmark Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Target: ${report.target.baseUrl}`,
    `Started in-process: ${report.target.startedInProcess ? "yes" : "no"}`,
    `Duration per endpoint: ${report.config.durationSeconds}s`,
    `Concurrency: ${report.config.concurrency}`,
    `Max requests per endpoint: ${report.config.maxRequestsPerEndpoint}`,
    "",
    "## Summary",
    "",
    `- Endpoints covered: ${report.aggregate.endpoints}`,
    `- Total samples: ${report.aggregate.totalSamples}`,
    `- Aggregate RPS: ${report.aggregate.requestsPerSecond}`,
    `- Peak RPS sum: ${report.aggregate.peakRequestsPerSecond}`,
    `- Error rate: ${formatPercent(report.aggregate.errorRate)}`,
    "",
    "## Endpoints",
    "",
    "| Group | Method | Path | Samples | Elapsed s | RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Error % | Statuses |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of report.endpoints) {
    lines.push(
      [
        result.group,
        result.method,
        `\`${result.path}\``,
        result.samples,
        result.elapsedSeconds,
        result.requestsPerSecond,
        result.peakRequestsPerSecond,
        result.latencyMs.p50,
        result.latencyMs.p95,
        result.latencyMs.p99,
        result.ttfbMs.p95,
        formatPercent(result.errorRate),
        formatStatuses(result.statusCounts)
      ].join(" | ").replace(/^/, "| ") + " |"
    );
  }

  lines.push("", "## Thresholds", "");

  if (report.thresholdFailures.length === 0) {
    lines.push("All active thresholds passed.");
  } else {
    for (const failure of report.thresholdFailures) {
      lines.push(`- ${failure}`);
    }
  }

  lines.push(
    "",
    "## Environment",
    "",
    `- Platform: ${report.environment.platform}`,
    `- CPU count: ${report.environment.cpuCount}`,
    `- CPU model: ${report.environment.cpus[0] ?? "unknown"}`,
    `- Total memory: ${formatBytes(report.environment.totalMemoryBytes)}`,
    `- Free memory at start: ${formatBytes(report.environment.freeMemoryBytes)}`,
    `- Node.js: ${report.environment.node}`
  );

  return `${lines.join("\n")}\n`;
}

function formatStatuses(statusCounts) {
  return Object.entries(statusCounts)
    .map(([status, count]) => `${status}:${count}`)
    .join(", ");
}

function formatPercent(value) {
  return `${round(value * 100, 2)}%`;
}

function formatBytes(value) {
  const gib = value / 1024 / 1024 / 1024;
  return `${round(gib, 2)} GiB`;
}

function printSummary(report) {
  console.log(`API benchmark ${report.mode} report written to benchmarks/results`);
  console.log(
    `${report.aggregate.endpoints} endpoints, ${report.aggregate.totalSamples} samples, ${report.aggregate.requestsPerSecond} aggregate RPS`
  );

  if (report.thresholdFailures.length > 0) {
    console.error("Threshold failures:");
    for (const failure of report.thresholdFailures) {
      console.error(`- ${failure}`);
    }
  } else {
    console.log("All active thresholds passed.");
  }
}
