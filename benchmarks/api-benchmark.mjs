import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

const DEFAULT_BASE_URL = "http://127.0.0.1:4000";

const config = {
  baseUrl: process.env.BENCHMARK_BASE_URL ?? DEFAULT_BASE_URL,
  concurrency: readPositiveInt("BENCHMARK_CONCURRENCY", 10),
  durationMs: readPositiveInt("BENCHMARK_DURATION_MS", 10_000),
  warmupMs: readNonNegativeInt("BENCHMARK_WARMUP_MS", 1_000),
  maxRequestsPerEndpoint: readNonNegativeInt("BENCHMARK_MAX_REQUESTS_PER_ENDPOINT", 0),
  outputDir: process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results",
  token: process.env.BENCHMARK_TOKEN ?? ""
};

const endpointDefinitions = [
  {
    name: "health",
    method: "GET",
    path: "/health"
  },
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    json: () => ({
      email: `bench-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    json: {
      email: "benchmark@example.com",
      password: "benchmark-password"
    }
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "users-list",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "users-create",
    method: "POST",
    path: "/api/users",
    json: () => ({
      email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      name: "Benchmark Client",
      role: "client"
    })
  },
  {
    name: "jobs-list",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    json: {
      title: "Build a marketplace dashboard",
      description: "Create a responsive dashboard for tracking freelance work.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "cat_web",
      skills: ["react", "node", "analytics"]
    }
  },
  {
    name: "proposals-list",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    json: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver the dashboard with milestone-based updates.",
      bidAmount: 900,
      estimatedDurationDays: 14
    }
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    json: {
      proposalId: "prp_benchmark",
      amount: 900,
      currency: "usd"
    }
  },
  {
    name: "reviews-list",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    json: {
      contractId: "ctr_benchmark",
      rating: 5,
      comment: "Clear communication and delivery quality during benchmark data setup."
    }
  },
  {
    name: "messages-list",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "messages-create",
    method: "POST",
    path: "/api/messages",
    json: {
      threadId: "thr_benchmark",
      senderId: "usr_client",
      recipientId: "usr_freelancer",
      body: "Can you share the milestone update before Friday?"
    }
  },
  {
    name: "notifications-list",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    json: {
      userId: "usr_client",
      type: "proposal_received",
      title: "New proposal received",
      body: "A freelancer submitted a proposal for your dashboard project."
    }
  },
  {
    name: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    formData: () => {
      const form = new FormData();
      form.append(
        "file",
        new Blob(["benchmark file payload"], { type: "text/plain" }),
        "benchmark.txt"
      );
      return form;
    }
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search",
    query: {
      q: "react marketplace dashboard"
    }
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];

const benchmarkToken = await getBenchmarkToken();
const results = [];

for (const endpoint of endpointDefinitions) {
  process.stdout.write(`Benchmarking ${endpoint.name}... `);
  await runWorkers(endpoint, config.warmupMs, true);
  const result = await runWorkers(endpoint, config.durationMs, false);
  results.push(result);
  process.stdout.write(
    `${result.sustainedRps.toFixed(1)} rps, p95 ${result.latency.p95.toFixed(1)}ms, error ${(result.errorRate * 100).toFixed(2)}%\n`
  );
}

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl: config.baseUrl,
  concurrency: config.concurrency,
  durationMs: config.durationMs,
  warmupMs: config.warmupMs,
  maxRequestsPerEndpoint: config.maxRequestsPerEndpoint,
  endpoints: results
};

await writeReports(summary);

async function runWorkers(endpoint, durationMs, warmup) {
  const deadline = performance.now() + durationMs;
  const samples = [];
  const requestBudget = {
    remaining: config.maxRequestsPerEndpoint > 0 && !warmup ? config.maxRequestsPerEndpoint : Number.POSITIVE_INFINITY
  };
  const workers = Array.from({ length: config.concurrency }, () =>
    runWorker(endpoint, deadline, warmup, samples, requestBudget)
  );

  await Promise.all(workers);
  return summarizeEndpoint(endpoint, samples, durationMs);
}

async function runWorker(endpoint, deadline, warmup, samples, requestBudget) {
  while (performance.now() < deadline) {
    if (!warmup) {
      if (requestBudget.remaining <= 0) {
        return;
      }
      requestBudget.remaining -= 1;
    }

    const sample = await requestEndpoint(endpoint);
    if (!warmup) {
      samples.push(sample);
    }
  }
}

async function requestEndpoint(endpoint) {
  const url = new URL(endpoint.path, config.baseUrl);
  for (const [key, value] of Object.entries(endpoint.query ?? {})) {
    url.searchParams.set(key, String(value));
  }

  const headers = {};
  const request = {
    method: endpoint.method,
    headers
  };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${benchmarkToken}`;
  }

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    request.body = JSON.stringify(
      typeof endpoint.json === "function" ? endpoint.json() : endpoint.json
    );
  }

  if (endpoint.formData) {
    request.body = endpoint.formData();
  }

  const start = performance.now();
  try {
    const response = await fetch(url, request);
    const ttfb = performance.now() - start;
    await response.arrayBuffer();
    const latency = performance.now() - start;
    const success = isAcceptedStatus(endpoint, response.status);
    return {
      success,
      startedAt: start,
      status: response.status,
      latency,
      ttfb,
      error: success ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    const latency = performance.now() - start;
    return {
      success: false,
      startedAt: start,
      status: 0,
      latency,
      ttfb: latency,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function isAcceptedStatus(endpoint, status) {
  const accepted = endpoint.acceptedStatuses ?? [];
  return (status >= 200 && status < 400) || accepted.includes(status);
}

async function getBenchmarkToken() {
  if (config.token) {
    return config.token;
  }

  const response = await fetch(new URL("/api/auth/register", config.baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email: `benchmark-user-${Date.now()}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  });

  if (!response.ok) {
    throw new Error(`Unable to create benchmark token: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const token = payload?.data?.token;
  if (!token) {
    throw new Error("Unable to create benchmark token: response did not include data.token");
  }

  return token;
}

function summarizeEndpoint(endpoint, samples, durationMs) {
  const totalRequests = samples.length;
  const successfulRequests = samples.filter((sample) => sample.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const latencies = samples.map((sample) => sample.latency).sort((a, b) => a - b);
  const ttfb = samples.map((sample) => sample.ttfb).sort((a, b) => a - b);
  const statusCodes = countBy(samples.map((sample) => sample.status));
  const errorMessages = countBy(samples.filter((sample) => sample.error).map((sample) => sample.error));
  const oneSecondBuckets = bucketSamples(samples);
  const peakRps = oneSecondBuckets.length > 0 ? Math.max(...oneSecondBuckets) : 0;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRate: totalRequests === 0 ? 1 : failedRequests / totalRequests,
    sustainedRps: totalRequests / (durationMs / 1000),
    peakRps,
    latency: percentileSummary(latencies),
    ttfb: percentileSummary(ttfb),
    statusCodes,
    errorMessages
  };
}

function percentileSummary(values) {
  if (values.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
  }

  const sum = values.reduce((total, value) => total + value, 0);
  return {
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    p99: percentile(values, 0.99),
    min: values[0],
    max: values[values.length - 1],
    avg: sum / values.length
  };
}

function percentile(sortedValues, ratio) {
  const index = Math.min(sortedValues.length - 1, Math.ceil(sortedValues.length * ratio) - 1);
  return sortedValues[Math.max(0, index)];
}

function bucketSamples(samples) {
  if (samples.length === 0) {
    return [];
  }

  const firstStart = Math.min(...samples.map((sample) => sample.startedAt));
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor((sample.startedAt - firstStart) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return [...buckets.values()];
}

function countBy(values) {
  return values.reduce((counts, value) => {
    const key = String(value);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

async function writeReports(summary) {
  const outputDir = path.resolve(process.cwd(), config.outputDir);
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "api-benchmark-results.json"),
    `${JSON.stringify(summary, null, 2)}\n`
  );
  await writeFile(path.join(outputDir, "api-benchmark-report.md"), renderMarkdown(summary));
  process.stdout.write(`Reports written to ${outputDir}\n`);
}

function renderMarkdown(summary) {
  const lines = [
    "# API Benchmark Report",
    "",
    `Generated: ${summary.generatedAt}`,
    `Base URL: ${summary.baseUrl}`,
    `Concurrency: ${summary.concurrency}`,
    `Measured duration per endpoint: ${summary.durationMs}ms`,
    `Warmup per endpoint: ${summary.warmupMs}ms`,
    `Request cap per endpoint: ${summary.maxRequestsPerEndpoint || "none"}`,
    "",
    "## Endpoint Summary",
    "",
    "| Endpoint | Method | Path | Sustained RPS | Peak RPS | p50 | p95 | p99 | TTFB p95 | Error rate |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const result of summary.endpoints) {
    lines.push(
      `| ${result.name} | ${result.method} | \`${result.path}\` | ${result.sustainedRps.toFixed(1)} | ${result.peakRps.toFixed(1)} | ${result.latency.p50.toFixed(1)}ms | ${result.latency.p95.toFixed(1)}ms | ${result.latency.p99.toFixed(1)}ms | ${result.ttfb.p95.toFixed(1)}ms | ${(result.errorRate * 100).toFixed(2)}% |`
    );
  }

  lines.push("", "## Bottlenecks", "");
  const ranked = [...summary.endpoints].sort((a, b) => {
    if (b.errorRate !== a.errorRate) {
      return b.errorRate - a.errorRate;
    }
    return b.latency.p95 - a.latency.p95;
  });

  ranked.slice(0, 10).forEach((result, index) => {
    const severity = result.errorRate > 0.05 ? "CRITICAL" : result.latency.p95 > 500 ? "WARNING" : "OK";
    lines.push(
      `${index + 1}. **${result.name}** - ${severity}, p95 ${result.latency.p95.toFixed(1)}ms, error rate ${(result.errorRate * 100).toFixed(2)}%`
    );
  });

  lines.push("", "## Status Codes", "");
  for (const result of summary.endpoints) {
    lines.push(`- **${result.name}**: ${JSON.stringify(result.statusCodes)}`);
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function readPositiveInt(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readNonNegativeInt(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
