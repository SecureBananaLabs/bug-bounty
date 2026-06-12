import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import thresholds from "./thresholds.json" with { type: "json" };
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "results");

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const failOnThreshold = args.has("--fail-on-threshold");

const options = {
  requestsPerEndpoint: numberFromEnv("BENCHMARK_REQUESTS_PER_ENDPOINT", smoke ? 3 : 5),
  concurrency: numberFromEnv("BENCHMARK_CONCURRENCY", smoke ? 1 : 2),
  timeoutMs: numberFromEnv("BENCHMARK_TIMEOUT_MS", 5000)
};

const benchmarkToken = signAccessToken({
  sub: "benchmark_admin",
  role: "admin",
  purpose: "api-benchmark"
});

const endpoints = [
  endpoint("GET", "/health"),
  endpoint("POST", "/api/auth/register", {
    body: () => ({
      email: `benchmark-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: "benchmark-password",
      role: "client"
    }),
    expectedStatuses: [201]
  }),
  endpoint("POST", "/api/auth/login", {
    body: () => ({ email: "client@example.com", password: "benchmark-password" })
  }),
  endpoint("GET", "/api/auth/oauth/github/callback"),
  endpoint("POST", "/api/auth/refresh"),
  endpoint("GET", "/api/users"),
  endpoint("POST", "/api/users", {
    body: () => ({ email: `user-${Date.now()}@example.com`, role: "client", fullName: "Benchmark Client" }),
    expectedStatuses: [201]
  }),
  endpoint("GET", "/api/jobs"),
  endpoint("POST", "/api/jobs", {
    body: () => ({
      title: "Build benchmark dashboard",
      description: "Synthetic payload used by the API benchmark suite.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "software",
      skills: ["node", "api", "performance"]
    }),
    expectedStatuses: [201]
  }),
  endpoint("GET", "/api/proposals"),
  endpoint("POST", "/api/proposals", {
    body: () => ({ jobId: "job_benchmark", freelancerId: "usr_benchmark", amount: 900, durationDays: 7 }),
    expectedStatuses: [201]
  }),
  endpoint("POST", "/api/payments", {
    body: () => ({ amount: 2500, currency: "usd", jobId: "job_benchmark" }),
    expectedStatuses: [201]
  }),
  endpoint("GET", "/api/reviews"),
  endpoint("POST", "/api/reviews", {
    body: () => ({ targetUserId: "usr_benchmark", rating: 5, comment: "Benchmark review payload" }),
    expectedStatuses: [201]
  }),
  endpoint("GET", "/api/messages"),
  endpoint("POST", "/api/messages", {
    body: () => ({ conversationId: "conv_benchmark", senderId: "usr_benchmark", body: "Benchmark message" }),
    expectedStatuses: [201]
  }),
  endpoint("GET", "/api/notifications"),
  endpoint("POST", "/api/notifications", {
    body: () => ({ userId: "usr_benchmark", type: "benchmark", message: "Benchmark notification" }),
    expectedStatuses: [201]
  }),
  endpoint("POST", "/api/uploads", {
    multipart: () => {
      const form = new FormData();
      form.append("file", new Blob(["benchmark upload payload"], { type: "text/plain" }), "benchmark.txt");
      return form;
    },
    expectedStatuses: [201]
  }),
  endpoint("GET", "/api/search?q=benchmark%20developer"),
  endpoint("GET", "/api/admin/metrics", {
    headers: () => ({ authorization: `Bearer ${benchmarkToken}` })
  })
];

const serverContext = await resolveServer();

try {
  const startedAt = new Date();
  const results = [];

  for (const config of endpoints) {
    results.push(await benchmarkEndpoint(serverContext.baseUrl, config, options));
  }

  const report = {
    suite: "api-benchmark",
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    targetUrl: serverContext.baseUrl,
    mode: smoke ? "smoke" : "full",
    options,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model ?? "unknown",
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem()
    },
    thresholds,
    results
  };

  const violations = collectThresholdViolations(results);
  report.thresholdViolations = violations;

  await mkdir(resultsDir, { recursive: true });
  await writeFile(path.join(resultsDir, "api-benchmark-latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(resultsDir, "api-benchmark-summary.md"), renderMarkdown(report));

  console.log(`Benchmarked ${results.length} endpoints against ${serverContext.baseUrl}`);
  console.log(`Results: ${path.relative(process.cwd(), path.join(resultsDir, "api-benchmark-summary.md"))}`);

  if (violations.length > 0) {
    console.error("Threshold violations:");
    for (const violation of violations) {
      console.error(`- ${violation.endpoint}: ${violation.message}`);
    }
    if (failOnThreshold) {
      process.exitCode = 1;
    }
  }
} finally {
  await serverContext.close();
}

function endpoint(method, route, overrides = {}) {
  return {
    name: `${method} ${route.split("?")[0]}`,
    method,
    route,
    expectedStatuses: [200],
    ...overrides
  };
}

async function resolveServer() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {
      baseUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, ""),
      close: async () => {}
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
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

async function benchmarkEndpoint(baseUrl, config, runOptions) {
  const measurements = [];
  let nextRequest = 0;

  async function worker() {
    while (nextRequest < runOptions.requestsPerEndpoint) {
      nextRequest += 1;
      measurements.push(await timeRequest(baseUrl, config, runOptions));
    }
  }

  const startedAt = performance.now();
  await Promise.all(Array.from({ length: runOptions.concurrency }, () => worker()));
  const durationMs = performance.now() - startedAt;

  const latencies = measurements.map((entry) => entry.durationMs).sort((a, b) => a - b);
  const ttfbs = measurements.map((entry) => entry.ttfbMs).sort((a, b) => a - b);
  const okCount = measurements.filter((entry) => entry.ok).length;
  const statusCounts = countBy(measurements.map((entry) => String(entry.status ?? "network-error")));
  const errorRatePct = ((measurements.length - okCount) / measurements.length) * 100;

  return {
    endpoint: config.name,
    method: config.method,
    route: config.route,
    requests: measurements.length,
    ok: okCount,
    errors: measurements.length - okCount,
    errorRatePct: round(errorRatePct),
    sustainedRps: round((measurements.length / durationMs) * 1000),
    peakRps: calculatePeakRps(measurements),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      min: round(latencies[0] ?? 0),
      max: round(latencies.at(-1) ?? 0)
    },
    ttfbMs: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    },
    statusCounts
  };
}

async function timeRequest(baseUrl, config, runOptions) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), runOptions.timeoutMs);
  const startedAt = performance.now();

  try {
    const init = buildRequest(config, controller.signal);
    const response = await fetch(`${baseUrl}${config.route}`, init);
    const headersAt = performance.now();
    await response.arrayBuffer();
    const finishedAt = performance.now();

    return {
      status: response.status,
      ok: config.expectedStatuses.includes(response.status),
      startedAt,
      durationMs: round(finishedAt - startedAt),
      ttfbMs: round(headersAt - startedAt)
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      startedAt,
      durationMs: round(performance.now() - startedAt),
      ttfbMs: round(performance.now() - startedAt),
      error: error.name
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildRequest(config, signal) {
  const headers = {
    accept: "application/json",
    ...(config.headers?.() ?? {})
  };

  const init = {
    method: config.method,
    headers,
    signal
  };

  if (config.body) {
    init.headers = { "content-type": "application/json", ...headers };
    init.body = JSON.stringify(config.body());
  }

  if (config.multipart) {
    init.body = config.multipart();
  }

  return init;
}

function collectThresholdViolations(results) {
  const violations = [];

  for (const result of results) {
    const threshold = thresholds.endpoints[result.endpoint] ?? thresholds.default;

    if (result.latencyMs.p99 > threshold.p99MaxMs) {
      violations.push({
        endpoint: result.endpoint,
        message: `p99 ${result.latencyMs.p99}ms exceeded ${threshold.p99MaxMs}ms`
      });
    }

    if (result.errorRatePct > threshold.errorRateMaxPct) {
      violations.push({
        endpoint: result.endpoint,
        message: `error rate ${result.errorRatePct}% exceeded ${threshold.errorRateMaxPct}%`
      });
    }
  }

  return violations;
}

function renderMarkdown(report) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `- Mode: ${report.mode}`,
    `- Target: ${report.targetUrl}`,
    `- Started: ${report.startedAt}`,
    `- Requests per endpoint: ${report.options.requestsPerEndpoint}`,
    `- Concurrency: ${report.options.concurrency}`,
    `- Runtime: ${report.environment.node} on ${report.environment.platform}/${report.environment.arch}`,
    `- CPU: ${report.environment.cpuModel} (${report.environment.cpuCount} logical cores)`,
    "",
    "| Endpoint | Requests | Error % | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Statuses |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of report.results) {
    lines.push([
      result.endpoint,
      result.requests,
      result.errorRatePct,
      result.sustainedRps,
      result.peakRps,
      result.latencyMs.p50,
      result.latencyMs.p95,
      result.latencyMs.p99,
      result.ttfbMs.p95,
      Object.entries(result.statusCounts).map(([status, count]) => `${status}: ${count}`).join(", ")
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("", "## Thresholds", "");
  if (report.thresholdViolations.length === 0) {
    lines.push("No threshold violations.");
  } else {
    for (const violation of report.thresholdViolations) {
      lines.push(`- ${violation.endpoint}: ${violation.message}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) {
    return 0;
  }
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return round(sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)]);
}

function calculatePeakRps(measurements) {
  if (measurements.length === 0) {
    return 0;
  }
  const buckets = new Map();
  const firstStart = Math.min(...measurements.map((entry) => entry.startedAt));

  for (const measurement of measurements) {
    const bucket = Math.floor((measurement.startedAt - firstStart) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  return Math.max(...buckets.values());
}

function countBy(values) {
  const counts = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
