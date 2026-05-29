import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");

const args = new Set(process.argv.slice(2));
const smokeMode = args.has("--smoke");
const writeResults = !args.has("--no-write-results");

await loadBenchmarkEnv();

const config = {
  concurrency: numberEnv(smokeMode ? "BENCHMARK_SMOKE_CONCURRENCY" : "BENCHMARK_CONCURRENCY", smokeMode ? 2 : 6),
  requestsPerEndpoint: numberEnv(smokeMode ? "BENCHMARK_SMOKE_REQUESTS_PER_ENDPOINT" : "BENCHMARK_REQUESTS_PER_ENDPOINT", smokeMode ? 3 : 30),
  timeoutMs: numberEnv("BENCHMARK_TIMEOUT_MS", 5000),
  targetUrl: process.env.BENCHMARK_TARGET_URL?.trim() || "",
  benchmarkToken:
    process.env.BENCHMARK_ADMIN_TOKEN?.trim() ||
    signAccessToken({ sub: "benchmark_admin", role: "admin", scope: "benchmark" })
};

const routes = [
  route("GET", "/health"),
  route("POST", "/api/auth/register", {
    email: uniqueEmail("benchmark-register"),
    password: "BenchmarkPass123!",
    role: "client"
  }),
  route("POST", "/api/auth/login", {
    email: "benchmark@example.com",
    password: "BenchmarkPass123!"
  }),
  route("GET", "/api/auth/oauth/github/callback"),
  route("POST", "/api/auth/refresh"),
  route("GET", "/api/users"),
  route("POST", "/api/users", {
    email: uniqueEmail("benchmark-user"),
    name: "Benchmark User",
    role: "freelancer"
  }),
  route("GET", "/api/jobs"),
  route("POST", "/api/jobs", {
    title: "Benchmark landing page build",
    description: "Create a responsive landing page for benchmark traffic validation.",
    budgetMin: 800,
    budgetMax: 1200,
    categoryId: "design-development",
    skills: ["Next.js", "Design Systems"]
  }),
  route("GET", "/api/proposals"),
  route("POST", "/api/proposals", {
    jobId: "job_benchmark",
    freelancerId: "usr_benchmark",
    amount: 900,
    coverLetter: "I can deliver this benchmark project with production-ready tests."
  }),
  route("POST", "/api/payments", {
    amount: 900,
    currency: "usd",
    jobId: "job_benchmark"
  }),
  route("GET", "/api/reviews"),
  route("POST", "/api/reviews", {
    targetUserId: "usr_benchmark",
    rating: 5,
    comment: "Reliable delivery and clear communication."
  }),
  route("GET", "/api/messages"),
  route("POST", "/api/messages", {
    recipientId: "usr_benchmark",
    body: "Benchmark message payload for realistic API traffic."
  }),
  route("GET", "/api/notifications"),
  route("POST", "/api/notifications", {
    userId: "usr_benchmark",
    type: "proposal",
    message: "A new proposal was submitted."
  }),
  route("POST", "/api/uploads", null, {
    headers: { "content-type": "multipart/form-data; boundary=benchmark-boundary" },
    rawBody:
      "--benchmark-boundary\r\n" +
      'Content-Disposition: form-data; name="file"; filename="benchmark.txt"\r\n' +
      "Content-Type: text/plain\r\n\r\n" +
      "benchmark upload payload\r\n" +
      "--benchmark-boundary--\r\n"
  }),
  route("GET", "/api/search?q=designer"),
  route("GET", "/api/admin/metrics", null, {
    headers: { authorization: `Bearer ${config.benchmarkToken}` }
  })
];

let server;
let baseUrl = config.targetUrl.replace(/\/$/, "");

if (!baseUrl) {
  server = await startLocalServer();
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));

try {
  const startedAt = new Date().toISOString();
  const routeResults = [];

  for (const target of routes) {
    routeResults.push(await benchmarkRoute(baseUrl, target));
  }

  const report = {
    startedAt,
    completedAt: new Date().toISOString(),
    mode: smokeMode ? "smoke" : "full",
    config: {
      baseUrl,
      concurrency: config.concurrency,
      requestsPerEndpoint: config.requestsPerEndpoint,
      timeoutMs: config.timeoutMs
    },
    summary: summarize(routeResults),
    routes: routeResults
  };

  const thresholdFailures = evaluateThresholds(routeResults, thresholds);
  report.thresholdFailures = thresholdFailures;

  if (writeResults) {
    await writeReports(report);
  }

  printConsoleSummary(report);

  if (thresholdFailures.length > 0) {
    console.error("\nBenchmark threshold failures:");
    for (const failure of thresholdFailures) {
      console.error(`- ${failure.route}: ${failure.metric} ${failure.actual} exceeded ${failure.expected}`);
    }
    process.exitCode = 1;
  }
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

function route(method, pathname, jsonBody, options = {}) {
  return {
    method,
    path: pathname,
    headers: {
      "x-benchmark-run": "1",
      ...(jsonBody ? { "content-type": "application/json" } : {}),
      ...(options.headers || {})
    },
    body: options.rawBody ?? (jsonBody ? JSON.stringify(jsonBody) : undefined)
  };
}

async function benchmarkRoute(base, target) {
  const latencies = [];
  const ttfbs = [];
  const statusCounts = {};
  let errors = 0;
  let completed = 0;
  let peakRps = 0;
  const started = performance.now();
  const perSecond = new Map();

  const queue = Array.from({ length: config.requestsPerEndpoint }, (_, index) => index);

  await Promise.all(
    Array.from({ length: Math.min(config.concurrency, queue.length) }, async () => {
      while (queue.length > 0) {
        queue.shift();
        const result = await requestOnce(base, target);
        completed += 1;
        const second = Math.floor((performance.now() - started) / 1000);
        perSecond.set(second, (perSecond.get(second) || 0) + 1);
        peakRps = Math.max(peakRps, perSecond.get(second));

        if (result.error) {
          errors += 1;
          continue;
        }

        latencies.push(result.latencyMs);
        ttfbs.push(result.ttfbMs);
        statusCounts[result.statusCode] = (statusCounts[result.statusCode] || 0) + 1;
        if (result.statusCode >= 400) {
          errors += 1;
        }
      }
    })
  );

  const durationSeconds = Math.max((performance.now() - started) / 1000, 0.001);
  const key = `${target.method} ${target.path}`;

  return {
    route: key,
    method: target.method,
    path: target.path,
    requests: completed,
    errors,
    errorRate: completed ? errors / completed : 1,
    sustainedRps: completed / durationSeconds,
    peakRps,
    latencyMs: percentiles(latencies),
    ttfbMs: percentiles(ttfbs),
    statusCounts
  };
}

function requestOnce(base, target) {
  return new Promise((resolve) => {
    const url = new URL(target.path, base);
    const client = url.protocol === "https:" ? https : http;
    const body = target.body;
    const headers = { ...target.headers };

    if (body && !headers["content-length"]) {
      headers["content-length"] = Buffer.byteLength(body);
    }

    const started = performance.now();
    let ttfb;

    const req = client.request(
      url,
      {
        method: target.method,
        headers,
        timeout: config.timeoutMs
      },
      (res) => {
        ttfb = performance.now() - started;
        res.resume();
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            ttfbMs: ttfb,
            latencyMs: performance.now() - started
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("request timed out"));
    });

    req.on("error", (error) => {
      resolve({ error: error.message });
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function percentiles(values) {
  if (values.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  return {
    p50: round(pickPercentile(sorted, 0.5)),
    p95: round(pickPercentile(sorted, 0.95)),
    p99: round(pickPercentile(sorted, 0.99)),
    min: round(sorted[0]),
    max: round(sorted[sorted.length - 1])
  };
}

function pickPercentile(sorted, percentile) {
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * percentile) - 1);
  return sorted[index];
}

function summarize(routeResults) {
  const totalRequests = routeResults.reduce((sum, result) => sum + result.requests, 0);
  const totalErrors = routeResults.reduce((sum, result) => sum + result.errors, 0);
  return {
    endpoints: routeResults.length,
    totalRequests,
    totalErrors,
    errorRate: totalRequests ? totalErrors / totalRequests : 1,
    slowestP99Route: [...routeResults].sort((a, b) => b.latencyMs.p99 - a.latencyMs.p99)[0]?.route ?? null
  };
}

function evaluateThresholds(routeResults, thresholdsConfig) {
  const failures = [];
  for (const result of routeResults) {
    const routeThresholds = {
      ...thresholdsConfig.defaults,
      ...(thresholdsConfig.routes?.[result.route] || {})
    };

    if (result.latencyMs.p99 > routeThresholds.p99Ms) {
      failures.push({
        route: result.route,
        metric: "p99Ms",
        actual: result.latencyMs.p99,
        expected: routeThresholds.p99Ms
      });
    }

    if (result.errorRate > routeThresholds.errorRate) {
      failures.push({
        route: result.route,
        metric: "errorRate",
        actual: round(result.errorRate),
        expected: routeThresholds.errorRate
      });
    }

    if (result.sustainedRps < routeThresholds.minSustainedRps) {
      failures.push({
        route: result.route,
        metric: "minSustainedRps",
        actual: round(result.sustainedRps),
        expected: routeThresholds.minSustainedRps
      });
    }
  }
  return failures;
}

async function writeReports(report) {
  await fs.mkdir(resultsDir, { recursive: true });
  const stamp = report.startedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDir, `${stamp}.json`);
  const markdownPath = path.join(resultsDir, `${stamp}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, markdownReport(report));
  await fs.writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(resultsDir, "latest.md"), markdownReport(report));
}

function markdownReport(report) {
  const lines = [
    "# API Benchmark Report",
    "",
    `- Mode: ${report.mode}`,
    `- Started: ${report.startedAt}`,
    `- Completed: ${report.completedAt}`,
    `- Base URL: ${report.config.baseUrl}`,
    `- Concurrency: ${report.config.concurrency}`,
    `- Requests per endpoint: ${report.config.requestsPerEndpoint}`,
    `- Endpoints covered: ${report.summary.endpoints}`,
    `- Total requests: ${report.summary.totalRequests}`,
    `- Total errors: ${report.summary.totalErrors}`,
    `- Overall error rate: ${percent(report.summary.errorRate)}`,
    `- Slowest p99 route: ${report.summary.slowestP99Route}`,
    "",
    "| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error Rate | Statuses |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of report.routes) {
    lines.push(
      `| ${result.route} | ${result.requests} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${round(result.sustainedRps)} | ${result.peakRps} | ${percent(result.errorRate)} | ${formatStatuses(result.statusCounts)} |`
    );
  }

  if (report.thresholdFailures.length > 0) {
    lines.push("", "## Threshold Failures", "");
    for (const failure of report.thresholdFailures) {
      lines.push(`- ${failure.route}: ${failure.metric} ${failure.actual} exceeded ${failure.expected}`);
    }
  } else {
    lines.push("", "## Thresholds", "", "All configured thresholds passed.");
  }

  lines.push("");
  return lines.join("\n");
}

function printConsoleSummary(report) {
  console.log(`Benchmarked ${report.summary.endpoints} endpoints with ${report.summary.totalRequests} requests.`);
  console.log(`Overall error rate: ${percent(report.summary.errorRate)}`);
  console.log(`Slowest p99 route: ${report.summary.slowestP99Route}`);
  if (writeResults) {
    console.log(`Reports written to ${path.relative(repoRoot, resultsDir)}`);
  }
}

function formatStatuses(statusCounts) {
  return Object.entries(statusCounts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([status, count]) => `${status}:${count}`)
    .join(", ");
}

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function percent(value) {
  return `${round(value * 100)}%`;
}

async function startLocalServer() {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

async function loadBenchmarkEnv() {
  const envPath = path.join(repoRoot, ".env.benchmark");
  try {
    const contents = await fs.readFile(envPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equals = trimmed.indexOf("=");
      if (equals === -1) continue;
      const key = trimmed.slice(0, equals).trim();
      const value = trimmed.slice(equals + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}
