import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke") || process.env.BENCHMARK_SMOKE === "1";

await loadBenchmarkEnv();

const thresholds = JSON.parse(
  await readFile(path.join(__dirname, "thresholds.json"), "utf8")
);

const settings = {
  mode: isSmoke ? "smoke" : "full",
  concurrency: numberFromEnv("BENCHMARK_CONCURRENCY", isSmoke ? 1 : 2),
  iterations: numberFromEnv("BENCHMARK_ITERATIONS", isSmoke ? 1 : 4),
  warmup: numberFromEnv("BENCHMARK_WARMUP", isSmoke ? 0 : 1),
  resultsDir: path.resolve(
    rootDir,
    process.env.BENCHMARK_RESULTS_DIR || "benchmarks/results"
  )
};

const localServer = await resolveTargetServer();
const baseUrl = localServer.baseUrl;
const authToken = await resolveAuthToken();
const endpoints = buildEndpoints(authToken);

try {
  await mkdir(settings.resultsDir, { recursive: true });

  const endpointResults = [];
  for (const endpoint of endpoints) {
    const result = await benchmarkEndpoint(baseUrl, endpoint, settings);
    endpointResults.push(result);
    logEndpoint(result);
  }

  const run = {
    runId: makeRunId(settings.mode),
    generatedAt: new Date().toISOString(),
    mode: settings.mode,
    target: localServer.local ? "local" : "remote",
    baseUrl,
    settings,
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    endpoints: endpointResults
  };

  run.thresholds = evaluateThresholds(endpointResults, thresholds, settings.mode);

  const jsonPath = path.join(settings.resultsDir, `${run.runId}.json`);
  const mdPath = path.join(settings.resultsDir, `${run.runId}.md`);
  await writeFile(jsonPath, `${JSON.stringify(run, null, 2)}\n`);
  await writeFile(mdPath, renderMarkdown(run));

  console.log(`\nBenchmark results written to:`);
  console.log(`- ${path.relative(rootDir, jsonPath)}`);
  console.log(`- ${path.relative(rootDir, mdPath)}`);

  if (run.thresholds.failures.length > 0) {
    console.error("\nBenchmark threshold failures:");
    for (const failure of run.thresholds.failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  }
} finally {
  await localServer.close();
}

async function loadBenchmarkEnv() {
  const envPath = path.join(rootDir, ".env.benchmark");
  if (!existsSync(envPath)) {
    return;
  }

  const contents = await readFile(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function resolveTargetServer() {
  const configuredBaseUrl = process.env.BENCHMARK_BASE_URL?.replace(/\/+$/, "");
  if (configuredBaseUrl) {
    return {
      baseUrl: configuredBaseUrl,
      local: false,
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
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    local: true,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function resolveAuthToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({
    sub: "benchmark_admin",
    role: "admin",
    purpose: "api-benchmark"
  });
}

function buildEndpoints(authToken) {
  return [
    {
      name: "health",
      method: "GET",
      path: "/health",
      expectedStatuses: [200]
    },
    {
      name: "auth register",
      method: "POST",
      path: "/api/auth/register",
      expectedStatuses: [201],
      json: (requestId) => ({
        email: `benchmark-${requestId}@example.com`,
        password: "benchmark-password",
        role: "client"
      })
    },
    {
      name: "auth login",
      method: "POST",
      path: "/api/auth/login",
      expectedStatuses: [200],
      json: () => ({
        email: "existing-client@example.com",
        password: "benchmark-password"
      })
    },
    {
      name: "auth oauth callback",
      method: "GET",
      path: "/api/auth/oauth/github/callback",
      expectedStatuses: [200]
    },
    {
      name: "auth refresh",
      method: "POST",
      path: "/api/auth/refresh",
      expectedStatuses: [200]
    },
    {
      name: "users list",
      method: "GET",
      path: "/api/users",
      expectedStatuses: [200]
    },
    {
      name: "users create",
      method: "POST",
      path: "/api/users",
      expectedStatuses: [201],
      json: (requestId) => ({
        email: `bench-user-${requestId}@example.com`,
        name: "Benchmark User",
        role: "freelancer",
        skills: ["node", "api-benchmarking"],
        hourlyRate: 85
      })
    },
    {
      name: "jobs list",
      method: "GET",
      path: "/api/jobs",
      expectedStatuses: [200]
    },
    {
      name: "jobs create",
      method: "POST",
      path: "/api/jobs",
      expectedStatuses: [201],
      json: (requestId) => ({
        title: `Build benchmark dashboard ${requestId}`,
        description:
          "Create a performance dashboard that tracks API latency, throughput, and reliability for production releases.",
        budgetMin: 1500,
        budgetMax: 4500,
        categoryId: "cat_engineering",
        skills: ["node", "observability", "performance"]
      })
    },
    {
      name: "proposals list",
      method: "GET",
      path: "/api/proposals",
      expectedStatuses: [200]
    },
    {
      name: "proposals create",
      method: "POST",
      path: "/api/proposals",
      expectedStatuses: [201],
      json: (requestId) => ({
        jobId: `job_${requestId}`,
        freelancerId: "usr_benchmark_freelancer",
        coverLetter:
          "I can build the requested API benchmark suite with repeatable metrics and a CI smoke gate.",
        bidAmount: 2200,
        estimatedDays: 5
      })
    },
    {
      name: "payments create",
      method: "POST",
      path: "/api/payments",
      expectedStatuses: [201],
      json: (requestId) => ({
        jobId: `job_${requestId}`,
        proposalId: `prp_${requestId}`,
        amount: 2200,
        currency: "usd"
      })
    },
    {
      name: "reviews list",
      method: "GET",
      path: "/api/reviews",
      expectedStatuses: [200]
    },
    {
      name: "reviews create",
      method: "POST",
      path: "/api/reviews",
      expectedStatuses: [201],
      json: (requestId) => ({
        jobId: `job_${requestId}`,
        reviewerId: "usr_benchmark_client",
        revieweeId: "usr_benchmark_freelancer",
        rating: 5,
        comment: "Delivered the API performance suite with clear reporting."
      })
    },
    {
      name: "messages list",
      method: "GET",
      path: "/api/messages",
      expectedStatuses: [200]
    },
    {
      name: "messages create",
      method: "POST",
      path: "/api/messages",
      expectedStatuses: [201],
      json: (requestId) => ({
        conversationId: `conv_${requestId}`,
        senderId: "usr_benchmark_client",
        recipientId: "usr_benchmark_freelancer",
        body: "Can you share the latest p95 latency numbers for the API benchmark run?"
      })
    },
    {
      name: "notifications list",
      method: "GET",
      path: "/api/notifications",
      expectedStatuses: [200]
    },
    {
      name: "notifications create",
      method: "POST",
      path: "/api/notifications",
      expectedStatuses: [201],
      json: (requestId) => ({
        userId: "usr_benchmark_client",
        type: "benchmark.completed",
        title: "Benchmark completed",
        message: `API benchmark run ${requestId} completed successfully.`
      })
    },
    {
      name: "uploads create",
      method: "POST",
      path: "/api/uploads",
      expectedStatuses: [201],
      formData: (requestId) => {
        const form = new FormData();
        form.append(
          "file",
          new Blob([`benchmark upload ${requestId}\n`], { type: "text/plain" }),
          `benchmark-${requestId}.txt`
        );
        return form;
      }
    },
    {
      name: "search",
      method: "GET",
      path: "/api/search?q=api%20benchmark",
      expectedStatuses: [200]
    },
    {
      name: "admin metrics",
      method: "GET",
      path: "/api/admin/metrics",
      expectedStatuses: [200],
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  ];
}

async function benchmarkEndpoint(baseUrl, endpoint, options) {
  for (let index = 0; index < options.warmup; index += 1) {
    await sendRequest(baseUrl, endpoint, `warmup-${index}`);
  }

  const startedAt = performance.now();
  const measurements = [];

  const workers = Array.from({ length: options.concurrency }, (_, workerIndex) =>
    runWorker(baseUrl, endpoint, options.iterations, workerIndex, measurements)
  );

  await Promise.all(workers);
  const completedAt = performance.now();

  return summarizeEndpoint(endpoint, measurements, completedAt - startedAt);
}

async function runWorker(baseUrl, endpoint, iterations, workerIndex, measurements) {
  for (let index = 0; index < iterations; index += 1) {
    const requestId = `${Date.now()}-${workerIndex}-${index}`;
    measurements.push(await sendRequest(baseUrl, endpoint, requestId));
  }
}

async function sendRequest(baseUrl, endpoint, requestId) {
  const url = `${baseUrl}${endpoint.path}`;
  const headers = { ...(endpoint.headers || {}) };
  const init = {
    method: endpoint.method,
    headers
  };

  if (endpoint.json) {
    init.body = JSON.stringify(endpoint.json(requestId));
    headers["content-type"] = "application/json";
  }

  if (endpoint.formData) {
    init.body = endpoint.formData(requestId);
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(url, init);
    const ttfbMs = performance.now() - startedAt;
    await response.arrayBuffer();
    const durationMs = performance.now() - startedAt;
    return {
      status: response.status,
      ok: endpoint.expectedStatuses.includes(response.status),
      ttfbMs,
      durationMs,
      completedAt: performance.now()
    };
  } catch (error) {
    const durationMs = performance.now() - startedAt;
    return {
      status: 0,
      ok: false,
      error: error.message,
      ttfbMs: durationMs,
      durationMs,
      completedAt: performance.now()
    };
  }
}

function summarizeEndpoint(endpoint, measurements, durationMs) {
  const latencies = measurements.map((measurement) => measurement.durationMs);
  const ttfbValues = measurements.map((measurement) => measurement.ttfbMs);
  const failures = measurements.filter((measurement) => !measurement.ok);
  const totalRequests = measurements.length;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    expectedStatuses: endpoint.expectedStatuses,
    totalRequests,
    successfulRequests: totalRequests - failures.length,
    failedRequests: failures.length,
    statuses: countStatuses(measurements),
    errorRatePercent: round((failures.length / totalRequests) * 100, 2),
    durationMs: round(durationMs, 2),
    sustainedRps: round(totalRequests / (durationMs / 1000), 2),
    peakRps: round(calculatePeakRps(measurements), 2),
    latencyMs: {
      p50: round(percentile(latencies, 50), 2),
      p95: round(percentile(latencies, 95), 2),
      p99: round(percentile(latencies, 99), 2)
    },
    ttfbMs: {
      p50: round(percentile(ttfbValues, 50), 2),
      p95: round(percentile(ttfbValues, 95), 2),
      p99: round(percentile(ttfbValues, 99), 2)
    }
  };
}

function countStatuses(measurements) {
  return measurements.reduce((statuses, measurement) => {
    const key = String(measurement.status);
    statuses[key] = (statuses[key] || 0) + 1;
    return statuses;
  }, {});
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = (percentileValue / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const weight = rank - lower;

  if (upper >= sorted.length) {
    return sorted[sorted.length - 1];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function calculatePeakRps(measurements) {
  const completed = measurements
    .map((measurement) => measurement.completedAt)
    .sort((a, b) => a - b);
  let peak = 0;
  let left = 0;

  for (let right = 0; right < completed.length; right += 1) {
    while (completed[right] - completed[left] > 1000) {
      left += 1;
    }
    peak = Math.max(peak, right - left + 1);
  }

  return peak;
}

function evaluateThresholds(results, config, mode) {
  const defaults = mode === "smoke" ? config.smoke : config.default;
  const failures = [];
  const evaluated = results.map((result) => {
    const endpointKey = `${result.method} ${result.path}`;
    const endpointThreshold = {
      ...defaults,
      ...(config.endpoints?.[endpointKey] || {})
    };

    if (result.latencyMs.p99 > endpointThreshold.p99Ms) {
      failures.push(
        `${endpointKey} p99 ${result.latencyMs.p99}ms exceeds ${endpointThreshold.p99Ms}ms`
      );
    }

    if (result.errorRatePercent > endpointThreshold.errorRatePercent) {
      failures.push(
        `${endpointKey} error rate ${result.errorRatePercent}% exceeds ${endpointThreshold.errorRatePercent}%`
      );
    }

    return {
      endpoint: endpointKey,
      thresholds: endpointThreshold,
      passed:
        result.latencyMs.p99 <= endpointThreshold.p99Ms &&
        result.errorRatePercent <= endpointThreshold.errorRatePercent
    };
  });

  return { evaluated, failures };
}

function renderMarkdown(run) {
  const lines = [
    `# API Benchmark Results`,
    "",
    `- Run ID: \`${run.runId}\``,
    `- Generated: ${run.generatedAt}`,
    `- Mode: ${run.mode}`,
    `- Target: ${run.target}`,
    `- Base URL: \`${run.baseUrl}\``,
    `- Concurrency: ${run.settings.concurrency}`,
    `- Iterations per worker: ${run.settings.iterations}`,
    "",
    "| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % | Statuses |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of run.endpoints) {
    lines.push(
      `| \`${result.method} ${result.path}\` | ${result.totalRequests} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.sustainedRps} | ${result.peakRps} | ${result.errorRatePercent} | ${formatStatuses(result.statuses)} |`
    );
  }

  lines.push("");
  lines.push("## Thresholds");
  lines.push("");

  if (run.thresholds.failures.length === 0) {
    lines.push("All endpoints passed configured thresholds.");
  } else {
    for (const failure of run.thresholds.failures) {
      lines.push(`- ${failure}`);
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function formatStatuses(statuses) {
  return Object.entries(statuses)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");
}

function logEndpoint(result) {
  console.log(
    `${result.method.padEnd(4)} ${result.path.padEnd(32)} p99=${String(
      result.latencyMs.p99
    ).padStart(7)}ms rps=${String(result.sustainedRps).padStart(7)} errors=${
      result.errorRatePercent
    }%`
  );
}

function makeRunId(mode) {
  return `${new Date().toISOString().replace(/[:.]/g, "-")}-${mode}`;
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
