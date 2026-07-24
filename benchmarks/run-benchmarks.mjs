import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");
const envPath = path.join(__dirname, ".env.benchmark");

const routeManifest = [
  { method: "GET", path: "/health", description: "API health check" },
  { method: "POST", path: "/api/auth/register", description: "Client registration", json: registerPayload },
  { method: "POST", path: "/api/auth/login", description: "Benchmark login token", json: loginPayload },
  { method: "GET", path: "/api/auth/oauth/github/callback", description: "OAuth callback receipt" },
  { method: "POST", path: "/api/auth/refresh", description: "Access token refresh" },
  { method: "GET", path: "/api/users", description: "List users" },
  { method: "POST", path: "/api/users", description: "Create user profile", json: userPayload },
  { method: "GET", path: "/api/jobs", description: "List jobs" },
  { method: "POST", path: "/api/jobs", description: "Create job", json: jobPayload },
  { method: "GET", path: "/api/proposals", description: "List proposals" },
  { method: "POST", path: "/api/proposals", description: "Create proposal", json: proposalPayload },
  { method: "POST", path: "/api/payments", description: "Create payment intent", json: paymentPayload },
  { method: "GET", path: "/api/reviews", description: "List reviews" },
  { method: "POST", path: "/api/reviews", description: "Create review", json: reviewPayload },
  { method: "GET", path: "/api/messages", description: "List messages" },
  { method: "POST", path: "/api/messages", description: "Send message", json: messagePayload },
  { method: "GET", path: "/api/notifications", description: "List notifications" },
  { method: "POST", path: "/api/notifications", description: "Create notification", json: notificationPayload },
  { method: "POST", path: "/api/uploads", description: "Upload portfolio file", multipart: uploadPayload },
  { method: "GET", path: "/api/search?q=marketplace%20security%20review", description: "Global search" },
  { method: "GET", path: "/api/admin/metrics", description: "Admin metrics", auth: true }
];

const defaultModes = {
  full: { requestsPerEndpoint: 5, concurrency: 2 },
  smoke: { requestsPerEndpoint: 1, concurrency: 1 }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  loadEnvFile(envPath);
  process.env.JWT_SECRET ??= "benchmark-secret";

  const mode = getArgValue("--mode") ?? process.env.BENCHMARK_MODE ?? "full";
  if (!defaultModes[mode]) {
    throw new Error(`Unsupported benchmark mode: ${mode}`);
  }

  const modeConfig = defaultModes[mode];
  const requestsPerEndpoint = readPositiveInt("BENCHMARK_REQUESTS_PER_ENDPOINT", modeConfig.requestsPerEndpoint);
  const concurrency = readPositiveInt("BENCHMARK_CONCURRENCY", modeConfig.concurrency);
  const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf8"));
  const target = await resolveTarget();

  try {
    const token = await getBenchmarkToken(target.baseUrl);
    const startedAt = new Date().toISOString();
    const endpointResults = [];

    for (const endpoint of routeManifest) {
      endpointResults.push(await runEndpoint({
        endpoint,
        baseUrl: target.baseUrl,
        token,
        requestsPerEndpoint,
        concurrency
      }));
    }

    const report = {
      generatedAt: startedAt,
      mode,
      baseUrl: target.label,
      requestsPerEndpoint,
      concurrency,
      environment: environmentSnapshot(),
      routeCount: routeManifest.length,
      apiRouteCount: routeManifest.filter((route) => route.path.startsWith("/api/")).length,
      results: endpointResults
    };

    const failures = evaluateThresholds(endpointResults, thresholds);
    report.thresholdFailures = failures;

    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(path.join(resultsDir, `benchmark-${mode}.json`), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(resultsDir, `benchmark-${mode}.md`), renderMarkdown(report));

    console.log(renderConsoleSummary(report));
    if (failures.length > 0) {
      throw new Error(`Benchmark threshold failures: ${failures.map((failure) => failure.endpoint).join(", ")}`);
    }
  } finally {
    await target.close?.();
  }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

async function resolveTarget() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {
      baseUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, ""),
      label: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, "")
    };
  }

  const { createApp } = await import(pathToFileURL(path.join(rootDir, "apps/api/src/app.js")));
  const app = createApp();
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    label: "local ephemeral Express server",
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

async function getBenchmarkToken(baseUrl) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(loginPayload(0))
  });
  const body = await response.json();
  if (!response.ok || !body?.data?.token) {
    throw new Error("Unable to obtain benchmark auth token");
  }
  return body.data.token;
}

async function runEndpoint({ endpoint, baseUrl, token, requestsPerEndpoint, concurrency }) {
  const timings = [];
  const ttfbs = [];
  const completions = [];
  const errors = [];
  let nextRequest = 0;
  const started = performance.now();

  async function worker() {
    while (nextRequest < requestsPerEndpoint) {
      const requestIndex = nextRequest;
      nextRequest += 1;
      const result = await performRequest({ endpoint, baseUrl, token, requestIndex });
      timings.push(result.latencyMs);
      ttfbs.push(result.ttfbMs);
      completions.push(result.completedAtMs - started);
      if (result.error) {
        errors.push(result.error);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, requestsPerEndpoint) }, worker));

  const elapsedMs = performance.now() - started;
  const totalRequests = timings.length;
  const errorCount = errors.length;
  const errorRatePercent = totalRequests === 0 ? 100 : (errorCount / totalRequests) * 100;

  return {
    endpoint: endpointName(endpoint),
    description: endpoint.description,
    requests: totalRequests,
    errors: errorCount,
    errorRatePercent: round(errorRatePercent),
    latencyMs: {
      p50: percentile(timings, 50),
      p95: percentile(timings, 95),
      p99: percentile(timings, 99)
    },
    ttfbMs: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    },
    rps: {
      sustained: round(totalRequests / (elapsedMs / 1000)),
      peak: peakRps(completions)
    },
    sampleError: errors[0] ?? null
  };
}

async function performRequest({ endpoint, baseUrl, token, requestIndex }) {
  const request = buildRequest(endpoint, token, requestIndex);
  const url = `${baseUrl}${endpoint.path}`;
  const started = performance.now();

  try {
    const response = await fetch(url, request);
    const ttfbMs = performance.now() - started;
    await response.arrayBuffer();
    const completedAtMs = performance.now();
    const latencyMs = completedAtMs - started;
    return {
      latencyMs,
      ttfbMs,
      completedAtMs,
      error: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    const completedAtMs = performance.now();
    return {
      latencyMs: completedAtMs - started,
      ttfbMs: completedAtMs - started,
      completedAtMs,
      error: error.message
    };
  }
}

function buildRequest(endpoint, token, requestIndex) {
  const headers = {};
  const request = { method: endpoint.method, headers };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    request.body = JSON.stringify(endpoint.json(requestIndex));
  }

  if (endpoint.multipart) {
    request.body = endpoint.multipart(requestIndex);
  }

  return request;
}

function registerPayload(index) {
  return {
    email: `benchmark.client.${Date.now()}.${index}@example.com`,
    password: "benchmark-password",
    role: "client"
  };
}

function loginPayload() {
  return {
    email: "benchmark.client@example.com",
    password: "benchmark-password"
  };
}

function userPayload(index) {
  return {
    email: `benchmark.freelancer.${Date.now()}.${index}@example.com`,
    name: "Benchmark Freelancer",
    role: "freelancer",
    skills: ["node", "api-benchmarking", "marketplace"],
    hourlyRate: 85
  };
}

function jobPayload(index) {
  return {
    title: `Benchmark API integration ${index}`,
    description: "Build and validate a marketplace integration using realistic benchmark payloads.",
    budgetMin: 1200,
    budgetMax: 2800,
    categoryId: "cat_backend",
    skills: ["node", "express", "performance"]
  };
}

function proposalPayload(index) {
  return {
    jobId: `job_benchmark_${index}`,
    freelancerId: "usr_benchmark_freelancer",
    coverLetter: "I can deliver the API integration with measurable latency and reliability targets.",
    bidAmount: 1800,
    timelineDays: 10
  };
}

function paymentPayload(index) {
  return {
    amount: 25000 + index,
    currency: "usd",
    metadata: {
      jobId: `job_benchmark_${index}`,
      milestone: "benchmark-baseline"
    }
  };
}

function reviewPayload(index) {
  return {
    jobId: `job_benchmark_${index}`,
    reviewerId: "usr_benchmark_client",
    revieweeId: "usr_benchmark_freelancer",
    rating: 5,
    comment: "Clear delivery, fast responses, and measurable benchmark evidence."
  };
}

function messagePayload(index) {
  return {
    conversationId: `conv_benchmark_${index % 2}`,
    senderId: "usr_benchmark_client",
    recipientId: "usr_benchmark_freelancer",
    body: "Please confirm the milestone scope and attach the latest benchmark summary."
  };
}

function notificationPayload(index) {
  return {
    userId: "usr_benchmark_freelancer",
    type: "milestone_review",
    message: `Benchmark milestone ${index} is ready for review.`
  };
}

function uploadPayload(index) {
  const form = new FormData();
  const content = JSON.stringify({
    filename: `portfolio-sample-${index}.json`,
    summary: "Representative portfolio payload for upload benchmark",
    skills: ["api", "security", "performance"],
    samples: Array.from({ length: 8 }, (_, sample) => ({ sample, score: 90 + sample }))
  });
  form.append("file", new Blob([content], { type: "application/json" }), `portfolio-sample-${index}.json`);
  return form;
}

function endpointName(endpoint) {
  return `${endpoint.method} ${endpoint.path.split("?")[0]}`;
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return round(sorted[index]);
}

function peakRps(completions) {
  if (completions.length === 0) {
    return 0;
  }

  const bucketMs = 250;
  const buckets = new Map();
  for (const completedAt of completions) {
    const bucket = Math.floor(completedAt / bucketMs);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return round((Math.max(...buckets.values()) * 1000) / bucketMs);
}

function evaluateThresholds(results, thresholds) {
  return results.flatMap((result) => {
    const endpointThresholds = thresholds.endpoints?.[result.endpoint] ?? {};
    const p99Ms = endpointThresholds.p99Ms ?? thresholds.defaults.p99Ms;
    const errorRatePercent = endpointThresholds.errorRatePercent ?? thresholds.defaults.errorRatePercent;
    const failures = [];

    if (result.latencyMs.p99 > p99Ms) {
      failures.push({
        endpoint: result.endpoint,
        metric: "latencyMs.p99",
        actual: result.latencyMs.p99,
        threshold: p99Ms
      });
    }

    if (result.errorRatePercent > errorRatePercent) {
      failures.push({
        endpoint: result.endpoint,
        metric: "errorRatePercent",
        actual: result.errorRatePercent,
        threshold: errorRatePercent
      });
    }

    return failures;
  });
}

function renderMarkdown(report) {
  const rows = report.results.map((result) => [
    result.endpoint,
    result.requests,
    result.latencyMs.p50,
    result.latencyMs.p95,
    result.latencyMs.p99,
    result.ttfbMs.p95,
    result.rps.sustained,
    result.rps.peak,
    result.errorRatePercent
  ]);

  return [
    `# API Benchmark Report (${report.mode})`,
    "",
    `Generated: ${report.generatedAt}`,
    `Target: ${report.baseUrl}`,
    `Routes covered: ${report.apiRouteCount} /api routes plus /health`,
    `Requests per endpoint: ${report.requestsPerEndpoint}`,
    `Concurrency: ${report.concurrency}`,
    "",
    "## Environment",
    "",
    `- OS: ${report.environment.platform} ${report.environment.release} ${report.environment.arch}`,
    `- CPU: ${report.environment.cpuModel} (${report.environment.logicalCores} logical cores)`,
    `- Memory: ${report.environment.totalMemoryGB} GB total, ${report.environment.freeMemoryGB} GB free at start`,
    `- Node: ${report.environment.node}`,
    "",
    "## Results",
    "",
    "| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## Thresholds",
    "",
    report.thresholdFailures.length === 0
      ? "All configured benchmark thresholds passed."
      : report.thresholdFailures.map((failure) => `- ${failure.endpoint}: ${failure.metric} ${failure.actual} > ${failure.threshold}`).join("\n"),
    ""
  ].join("\n");
}

function renderConsoleSummary(report) {
  return [
    `Benchmark mode: ${report.mode}`,
    `Target: ${report.baseUrl}`,
    `Routes covered: ${report.apiRouteCount} /api routes plus /health`,
    `Results: benchmarks/results/benchmark-${report.mode}.json and .md`,
    `Threshold failures: ${report.thresholdFailures.length}`
  ].join("\n");
}

function environmentSnapshot() {
  const cpu = os.cpus()[0] ?? {};
  return {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpuModel: cpu.model?.trim() ?? "unknown",
    logicalCores: os.cpus().length,
    totalMemoryGB: round(os.totalmem() / 1024 / 1024 / 1024),
    freeMemoryGB: round(os.freemem() / 1024 / 1024 / 1024),
    node: process.version
  };
}

function getArgValue(name) {
  const prefix = `${name}=`;
  const arg = process.argv.find((value) => value === name || value.startsWith(prefix));
  if (!arg) {
    return null;
  }
  return arg === name ? "true" : arg.slice(prefix.length);
}

function readPositiveInt(envName, fallback) {
  const value = Number(process.env[envName] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${envName} must be a positive integer`);
  }
  return value;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
