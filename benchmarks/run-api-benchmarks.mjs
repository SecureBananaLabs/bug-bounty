import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");
const envPath = path.join(repoRoot, ".env.benchmark");

const isSmoke = process.argv.includes("--smoke") || process.env.BENCHMARK_MODE === "smoke";

await loadEnvFile(envPath);

const defaults = {
  iterations: Number(process.env.BENCHMARK_ITERATIONS ?? (isSmoke ? 2 : 8)),
  warmup: Number(process.env.BENCHMARK_WARMUP ?? (isSmoke ? 1 : 1)),
  concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? (isSmoke ? 1 : 3))
};

const benchmarkToken = process.env.BENCHMARK_AUTH_TOKEN || signAccessToken({
  sub: "benchmark-admin",
  role: "admin",
  purpose: "api-benchmark"
});

const endpoints = [
  {
    name: "health",
    method: "GET",
    path: "/health",
    description: "Service health probe"
  },
  {
    name: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    description: "Client account registration",
    json: (i) => ({
      email: `benchmark-client-${Date.now()}-${i}@example.test`,
      password: "benchmark-password-123",
      role: "client"
    })
  },
  {
    name: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    description: "Credential login with realistic email/password body",
    json: () => ({
      email: "benchmark-client@example.test",
      password: "benchmark-password-123"
    })
  },
  {
    name: "auth.oauth.github.callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state",
    description: "OAuth provider callback"
  },
  {
    name: "auth.refresh",
    method: "POST",
    path: "/api/auth/refresh",
    description: "Refresh-token endpoint"
  },
  {
    name: "users.list",
    method: "GET",
    path: "/api/users",
    description: "List marketplace users"
  },
  {
    name: "users.create",
    method: "POST",
    path: "/api/users",
    description: "Create freelancer profile",
    json: (i) => ({
      id: `bench-user-${i}`,
      name: "Benchmark Freelancer",
      role: "freelancer",
      skills: ["node", "api", "performance"],
      hourlyRate: 85
    })
  },
  {
    name: "jobs.list",
    method: "GET",
    path: "/api/jobs",
    description: "List project postings"
  },
  {
    name: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    description: "Create project posting with production-like fields",
    json: (i) => ({
      title: `Benchmark API load audit ${i}`,
      description: "Measure latency, throughput, error rate, and regression risk for marketplace API endpoints.",
      budgetMin: 500,
      budgetMax: 2500,
      categoryId: "engineering",
      skills: ["node", "express", "benchmarking", "observability"]
    })
  },
  {
    name: "proposals.list",
    method: "GET",
    path: "/api/proposals",
    description: "List job proposals"
  },
  {
    name: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    description: "Submit proposal body with estimate and cover note",
    json: (i) => ({
      jobId: `bench-job-${i}`,
      freelancerId: `bench-freelancer-${i}`,
      coverLetter: "I can benchmark, profile, and harden this API with reproducible performance reports.",
      bidAmount: 1200,
      estimatedDays: 5
    })
  },
  {
    name: "payments.create",
    method: "POST",
    path: "/api/payments",
    description: "Create payment intent payload",
    json: (i) => ({
      amount: 150000,
      currency: "usd",
      jobId: `bench-job-${i}`,
      clientId: "bench-client",
      freelancerId: "bench-freelancer"
    })
  },
  {
    name: "reviews.list",
    method: "GET",
    path: "/api/reviews",
    description: "List reviews"
  },
  {
    name: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    description: "Create project review",
    json: (i) => ({
      jobId: `bench-job-${i}`,
      reviewerId: "bench-client",
      revieweeId: "bench-freelancer",
      rating: 5,
      comment: "Clear delivery, good communication, and reliable API benchmarking artifacts."
    })
  },
  {
    name: "messages.list",
    method: "GET",
    path: "/api/messages",
    description: "List conversation messages"
  },
  {
    name: "messages.create",
    method: "POST",
    path: "/api/messages",
    description: "Send conversation message",
    json: (i) => ({
      conversationId: `bench-conversation-${i % 3}`,
      senderId: "bench-client",
      recipientId: "bench-freelancer",
      body: "Can you share the latest p95 and p99 latency report for the staging API?"
    })
  },
  {
    name: "notifications.list",
    method: "GET",
    path: "/api/notifications",
    description: "List notifications"
  },
  {
    name: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    description: "Create notification payload",
    json: (i) => ({
      userId: "bench-client",
      type: "benchmark_report_ready",
      title: "Benchmark report ready",
      body: `API benchmark run ${i} completed successfully.`
    })
  },
  {
    name: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    description: "Upload small report attachment",
    formData: () => {
      const form = new FormData();
      form.append("file", new Blob(["benchmark fixture\n"], { type: "text/plain" }), "benchmark-report.txt");
      return form;
    }
  },
  {
    name: "search.global",
    method: "GET",
    path: "/api/search?q=api%20benchmark%20node%20express",
    description: "Global marketplace search"
  },
  {
    name: "admin.metrics",
    method: "GET",
    path: "/api/admin/metrics",
    description: "Protected admin metrics using benchmark JWT",
    headers: () => ({
      Authorization: `Bearer ${benchmarkToken}`
    })
  }
];

const serverContext = await getServerContext();
const thresholds = await readJson(thresholdsPath);
const startedAt = new Date();
const results = [];

try {
  for (const endpoint of endpoints) {
    results.push(await benchmarkEndpoint(endpoint, serverContext.baseUrl));
  }
} finally {
  if (serverContext.close) {
    await serverContext.close();
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: isSmoke ? "smoke" : "full",
  targetUrl: serverContext.baseUrl,
  defaults,
  environment: captureEnvironment(),
  endpoints: results,
  summary: summarize(results)
};

report.thresholds = evaluateThresholds(report, thresholds, isSmoke);

await fs.mkdir(resultsDir, { recursive: true });
await fs.writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.join(resultsDir, "latest.md"), renderMarkdown(report, startedAt));

const failures = report.thresholds.failures;
console.log(`Benchmarked ${results.length} endpoints in ${report.mode} mode against ${serverContext.baseUrl}`);
console.log(`Results: benchmarks/results/latest.json and benchmarks/results/latest.md`);
if (failures.length > 0) {
  console.error("Benchmark threshold failures:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}

async function getServerContext() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {
      baseUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, ""),
      close: null
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
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

async function benchmarkEndpoint(endpoint, baseUrl) {
  for (let i = 0; i < defaults.warmup; i += 1) {
    await requestEndpoint(endpoint, baseUrl, i);
  }

  const samples = [];
  let nextIndex = 0;
  const started = performance.now();
  const workers = Array.from({ length: defaults.concurrency }, async () => {
    while (nextIndex < defaults.iterations) {
      const sampleIndex = nextIndex;
      nextIndex += 1;
      samples.push(await requestEndpoint(endpoint, baseUrl, sampleIndex));
    }
  });
  await Promise.all(workers);
  const elapsedMs = performance.now() - started;

  samples.sort((a, b) => a.startedAt - b.startedAt);
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errorCount = samples.filter((sample) => sample.status < 200 || sample.status >= 400 || sample.error).length;
  const statusCounts = countBy(samples.map((sample) => sample.status || "error"));

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    requests: samples.length,
    concurrency: defaults.concurrency,
    durationMs: round(elapsedMs),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      max: percentile(latencies, 100)
    },
    ttfbMs: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    },
    rps: {
      sustained: round(samples.length / Math.max(elapsedMs / 1000, 0.001)),
      peak: peakRps(samples)
    },
    errorRatePercent: round((errorCount / Math.max(samples.length, 1)) * 100),
    statusCounts
  };
}

async function requestEndpoint(endpoint, baseUrl, index) {
  const url = `${baseUrl}${endpoint.path}`;
  const headers = {
    Accept: "application/json",
    ...(endpoint.headers ? endpoint.headers(index) : {})
  };
  const options = {
    method: endpoint.method,
    headers
  };

  if (endpoint.json) {
    options.headers = {
      ...options.headers,
      "Content-Type": "application/json"
    };
    options.body = JSON.stringify(endpoint.json(index));
  } else if (endpoint.formData) {
    options.body = endpoint.formData(index);
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(url, options);
    const ttfbAt = performance.now();
    await response.arrayBuffer();
    const endedAt = performance.now();
    return {
      startedAt,
      status: response.status,
      ttfbMs: round(ttfbAt - startedAt),
      latencyMs: round(endedAt - startedAt)
    };
  } catch (error) {
    const endedAt = performance.now();
    return {
      startedAt,
      status: 0,
      ttfbMs: round(endedAt - startedAt),
      latencyMs: round(endedAt - startedAt),
      error: error.message
    };
  }
}

function summarize(endpointResults) {
  const totalRequests = endpointResults.reduce((sum, endpoint) => sum + endpoint.requests, 0);
  const totalErrors = endpointResults.reduce((sum, endpoint) => {
    return sum + Math.round((endpoint.errorRatePercent / 100) * endpoint.requests);
  }, 0);
  return {
    endpointCount: endpointResults.length,
    totalRequests,
    overallErrorRatePercent: round((totalErrors / Math.max(totalRequests, 1)) * 100),
    slowestP99: endpointResults.reduce((slowest, endpoint) => {
      return endpoint.latencyMs.p99 > slowest.latencyMs.p99 ? endpoint : slowest;
    }, endpointResults[0])
  };
}

function evaluateThresholds(report, thresholds, smokeMode) {
  const config = smokeMode ? thresholds.smoke : thresholds.full;
  const failures = [];
  if (!config) {
    return { mode: smokeMode ? "smoke" : "full", failures: [] };
  }

  for (const endpoint of report.endpoints) {
    const endpointThreshold = {
      ...config.defaults,
      ...(config.endpoints?.[endpoint.name] ?? {})
    };
    if (endpoint.latencyMs.p99 > endpointThreshold.maxP99Ms) {
      failures.push(`${endpoint.name} p99 ${endpoint.latencyMs.p99}ms exceeded ${endpointThreshold.maxP99Ms}ms`);
    }
    if (endpoint.errorRatePercent > endpointThreshold.maxErrorRatePercent) {
      failures.push(`${endpoint.name} error rate ${endpoint.errorRatePercent}% exceeded ${endpointThreshold.maxErrorRatePercent}%`);
    }
  }

  return {
    mode: smokeMode ? "smoke" : "full",
    config,
    failures
  };
}

function renderMarkdown(report, startedAt) {
  const lines = [
    "# API Benchmark Results",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Mode: ${report.mode}`,
    `- Target: ${report.targetUrl}`,
    `- Started: ${startedAt.toISOString()}`,
    `- Endpoints covered: ${report.summary.endpointCount}`,
    `- Total requests: ${report.summary.totalRequests}`,
    `- Overall error rate: ${report.summary.overallErrorRatePercent}%`,
    `- Slowest p99: ${report.summary.slowestP99.name} (${report.summary.slowestP99.latencyMs.p99} ms)`,
    "",
    "## Environment",
    "",
    `- Platform: ${report.environment.platform}`,
    `- CPU: ${report.environment.cpu}`,
    `- RAM: ${report.environment.totalMemoryGb} GB total / ${report.environment.freeMemoryGb} GB free at capture`,
    `- Node.js: ${report.environment.node}`,
    "",
    "## Endpoint Metrics",
    "",
    "| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const endpoint of report.endpoints) {
    const statuses = Object.entries(endpoint.statusCounts).map(([status, count]) => `${status}:${count}`).join(", ");
    lines.push(`| ${endpoint.name} | ${endpoint.method} | \`${endpoint.path}\` | ${endpoint.requests} | ${endpoint.latencyMs.p50} | ${endpoint.latencyMs.p95} | ${endpoint.latencyMs.p99} | ${endpoint.ttfbMs.p95} | ${endpoint.rps.sustained} | ${endpoint.rps.peak} | ${endpoint.errorRatePercent} | ${statuses} |`);
  }

  lines.push("", "## Threshold Gate", "");
  if (report.thresholds.failures.length === 0) {
    lines.push("- Passed: all configured p99 and error-rate thresholds were met.");
  } else {
    for (const failure of report.thresholds.failures) {
      lines.push(`- Failed: ${failure}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) {
    return 0;
  }
  if (percentileValue === 100) {
    return round(sortedValues[sortedValues.length - 1]);
  }
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return round(sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))]);
}

function peakRps(samples) {
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor(sample.startedAt / 100);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  const peakPer100Ms = Math.max(...buckets.values(), 0);
  return round(peakPer100Ms * 10);
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function captureEnvironment() {
  const cpus = os.cpus();
  return {
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: cpus.length > 0 ? `${cpus[0].model} (${cpus.length} logical cores)` : "unknown",
    totalMemoryGb: round(os.totalmem() / 1024 / 1024 / 1024),
    freeMemoryGb: round(os.freemem() / 1024 / 1024 / 1024),
    node: process.version
  };
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
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

function round(value) {
  return Math.round(value * 100) / 100;
}
