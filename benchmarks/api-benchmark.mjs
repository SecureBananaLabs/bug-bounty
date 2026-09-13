import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

await loadEnvFile(resolve(repoRoot, "benchmarks/.env.benchmark"));

const smokeMode = process.env.BENCHMARK_SMOKE === "true";
const durationMs = numberEnv("BENCHMARK_DURATION_MS", smokeMode ? 350 : 2000);
const concurrency = numberEnv("BENCHMARK_CONCURRENCY", smokeMode ? 1 : 4);
const warmupRequests = numberEnv("BENCHMARK_WARMUP_REQUESTS", smokeMode ? 0 : 1);
const outputDir = resolve(repoRoot, process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results");
const thresholds = await readThresholds();

const localRuntime = await createRuntime();
const baseUrl = normalizeBaseUrl(localRuntime.baseUrl);
const benchmarkToken = process.env.BENCHMARK_AUTH_TOKEN ?? localRuntime.token;

const endpointPlans = buildEndpointPlans(benchmarkToken);
const startedAt = new Date();
const endpointResults = [];

try {
  for (const plan of endpointPlans) {
    for (let i = 0; i < warmupRequests; i += 1) {
      await timedRequest(baseUrl, plan);
    }

    endpointResults.push(await benchmarkEndpoint(baseUrl, plan));
  }
} finally {
  await localRuntime.close();
}

const finishedAt = new Date();
const report = {
  generatedAt: finishedAt.toISOString(),
  benchmarkMode: smokeMode ? "smoke" : "full",
  target: baseUrl,
  settings: {
    durationMs,
    concurrency,
    warmupRequests
  },
  summary: summarize(endpointResults),
  endpoints: endpointResults
};

await writeReports(report, startedAt);
assertThresholds(report);

function buildEndpointPlans(token) {
  const authHeaders = token ? { authorization: `Bearer ${token}` } : {};
  const json = (payloadFactory) => ({
    headers: { "content-type": "application/json" },
    bodyFactory: () => JSON.stringify(payloadFactory())
  });

  return [
    {
      name: "POST /api/auth/register",
      method: "POST",
      path: "/api/auth/register",
      ...json(() => ({
        email: uniqueEmail("register"),
        password: "correct-horse-battery-staple",
        role: "client"
      }))
    },
    {
      name: "POST /api/auth/login",
      method: "POST",
      path: "/api/auth/login",
      ...json(() => ({
        email: "client@example.com",
        password: "correct-horse-battery-staple"
      }))
    },
    {
      name: "GET /api/auth/oauth/github/callback",
      method: "GET",
      path: "/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state"
    },
    {
      name: "POST /api/auth/refresh",
      method: "POST",
      path: "/api/auth/refresh",
      ...json(() => ({ refreshToken: "benchmark-refresh-token" }))
    },
    {
      name: "GET /api/users",
      method: "GET",
      path: "/api/users"
    },
    {
      name: "POST /api/users",
      method: "POST",
      path: "/api/users",
      ...json(() => ({
        email: uniqueEmail("user"),
        fullName: "Benchmark Client",
        role: "client",
        profileVisibility: "marketplace"
      }))
    },
    {
      name: "GET /api/jobs",
      method: "GET",
      path: "/api/jobs"
    },
    {
      name: "POST /api/jobs",
      method: "POST",
      path: "/api/jobs",
      ...json(() => ({
        title: "Build a benchmark-ready dashboard",
        description: "Create a production-grade analytics dashboard with charts and export controls.",
        budgetMin: 2500,
        budgetMax: 6500,
        categoryId: "web-development",
        skills: ["nextjs", "analytics", "api-design"]
      }))
    },
    {
      name: "GET /api/proposals",
      method: "GET",
      path: "/api/proposals"
    },
    {
      name: "POST /api/proposals",
      method: "POST",
      path: "/api/proposals",
      ...json(() => ({
        jobId: "job_benchmark",
        freelancerId: "usr_freelancer",
        coverLetter: "I can ship the dashboard with typed API contracts and visual regression checks.",
        rate: 85,
        estimatedDurationDays: 14
      }))
    },
    {
      name: "POST /api/payments",
      method: "POST",
      path: "/api/payments",
      ...json(() => ({
        jobId: "job_benchmark",
        amount: 250000,
        currency: "usd",
        paymentMethodId: "pm_benchmark_card"
      }))
    },
    {
      name: "GET /api/reviews",
      method: "GET",
      path: "/api/reviews"
    },
    {
      name: "POST /api/reviews",
      method: "POST",
      path: "/api/reviews",
      ...json(() => ({
        jobId: "job_benchmark",
        reviewerId: "usr_client",
        revieweeId: "usr_freelancer",
        rating: 5,
        comment: "Clear communication, fast delivery, and strong test coverage."
      }))
    },
    {
      name: "GET /api/messages",
      method: "GET",
      path: "/api/messages"
    },
    {
      name: "POST /api/messages",
      method: "POST",
      path: "/api/messages",
      ...json(() => ({
        threadId: "thread_benchmark",
        senderId: "usr_client",
        recipientId: "usr_freelancer",
        body: "Can you confirm the benchmark export format before tomorrow?"
      }))
    },
    {
      name: "GET /api/notifications",
      method: "GET",
      path: "/api/notifications"
    },
    {
      name: "POST /api/notifications",
      method: "POST",
      path: "/api/notifications",
      ...json(() => ({
        userId: "usr_client",
        type: "proposal-submitted",
        title: "New proposal received",
        message: "A freelancer submitted a proposal for your analytics dashboard."
      }))
    },
    {
      name: "POST /api/uploads",
      method: "POST",
      path: "/api/uploads",
      bodyFactory: () => {
        const form = new FormData();
        form.append(
          "file",
          new Blob(["benchmark,csv\nlatency,p95\napi,42\n"], { type: "text/csv" }),
          "benchmark.csv"
        );
        return form;
      }
    },
    {
      name: "GET /api/search",
      method: "GET",
      path: "/api/search?q=react%20payments%20dashboard"
    },
    {
      name: "GET /api/admin/metrics",
      method: "GET",
      path: "/api/admin/metrics",
      headers: authHeaders
    }
  ];
}

async function benchmarkEndpoint(baseUrl, plan) {
  const samples = [];
  const deadline = performance.now() + durationMs;
  const startedAt = performance.now();

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (performance.now() < deadline) {
        samples.push(await timedRequest(baseUrl, plan));
      }
    })
  );

  const measuredMs = performance.now() - startedAt;
  const stats = calculateStats(samples, measuredMs);
  const threshold = thresholdFor(plan.name);

  return {
    name: plan.name,
    method: plan.method,
    path: plan.path,
    requests: samples.length,
    durationSec: round(measuredMs / 1000, 3),
    latencyMs: stats.latencyMs,
    ttfbMs: stats.ttfbMs,
    rps: stats.rps,
    errorRate: stats.errorRate,
    statusCounts: stats.statusCounts,
    threshold,
    thresholdPassed: stats.latencyMs.p99 <= threshold.p99Ms && stats.errorRate <= threshold.errorRate
  };
}

async function timedRequest(baseUrl, plan) {
  const startedAt = performance.now();
  const options = {
    method: plan.method,
    headers: { ...(plan.headers ?? {}) }
  };

  if (plan.bodyFactory) {
    const body = plan.bodyFactory();
    options.body = body;
    if (!(body instanceof FormData) && plan.headers) {
      options.headers = { ...plan.headers };
    }
  }

  try {
    const response = await fetch(`${baseUrl}${plan.path}`, options);
    const headersAt = performance.now();
    await response.arrayBuffer();
    const finishedAt = performance.now();

    return {
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      startedAt,
      latencyMs: finishedAt - startedAt,
      ttfbMs: headersAt - startedAt
    };
  } catch (error) {
    return {
      status: "network-error",
      ok: false,
      startedAt,
      latencyMs: performance.now() - startedAt,
      ttfbMs: performance.now() - startedAt,
      error: error.message
    };
  }
}

function calculateStats(samples, measuredMs) {
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errors = samples.filter((sample) => !sample.ok).length;
  const buckets = new Map();

  for (const sample of samples) {
    const bucket = Math.floor(sample.startedAt / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  return {
    latencyMs: percentiles(latencies),
    ttfbMs: percentiles(ttfbs),
    rps: {
      sustained: round(samples.length / (measuredMs / 1000), 2),
      peak: Math.max(...buckets.values(), 0)
    },
    errorRate: round(samples.length === 0 ? 1 : errors / samples.length, 4),
    statusCounts: countStatuses(samples)
  };
}

function percentiles(values) {
  return {
    p50: round(percentile(values, 50), 2),
    p95: round(percentile(values, 95), 2),
    p99: round(percentile(values, 99), 2)
  };
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.ceil((percentileValue / 100) * values.length) - 1;
  return values[Math.max(0, Math.min(index, values.length - 1))];
}

function countStatuses(samples) {
  return samples.reduce((counts, sample) => {
    const key = String(sample.status);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function summarize(results) {
  const totalRequests = results.reduce((sum, result) => sum + result.requests, 0);
  const failedEndpoints = results.filter((result) => !result.thresholdPassed);
  const totalErrors = results.reduce(
    (sum, result) =>
      sum +
      Object.entries(result.statusCounts).reduce((innerSum, [status, count]) => {
        const numericStatus = Number(status);
        return innerSum + (numericStatus >= 200 && numericStatus < 400 ? 0 : count);
      }, 0),
    0
  );

  return {
    totalEndpoints: results.length,
    totalRequests,
    totalErrors,
    errorRate: round(totalRequests === 0 ? 1 : totalErrors / totalRequests, 4),
    failedEndpoints: failedEndpoints.map((result) => result.name)
  };
}

async function writeReports(report, startedAt) {
  await mkdir(outputDir, { recursive: true });

  const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const jsonPath = resolve(outputDir, `api-benchmark-${stamp}.json`);
  const markdownPath = resolve(outputDir, `api-benchmark-${stamp}.md`);
  const markdown = renderMarkdown(report);

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, markdown);
  await writeFile(resolve(outputDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(resolve(outputDir, "latest.md"), markdown);

  console.log(`Benchmark JSON: ${jsonPath}`);
  console.log(`Benchmark Markdown: ${markdownPath}`);
}

function renderMarkdown(report) {
  const rows = report.endpoints
    .map(
      (endpoint) =>
        `| ${endpoint.name} | ${endpoint.requests} | ${endpoint.latencyMs.p50} | ${endpoint.latencyMs.p95} | ${endpoint.latencyMs.p99} | ${endpoint.ttfbMs.p95} | ${endpoint.rps.sustained} | ${endpoint.rps.peak} | ${(endpoint.errorRate * 100).toFixed(2)}% | ${endpoint.thresholdPassed ? "pass" : "fail"} |`
    )
    .join("\n");

  return `# API Benchmark Summary

Generated: ${report.generatedAt}
Mode: ${report.benchmarkMode}
Target: ${report.target}
Duration per endpoint: ${report.settings.durationMs} ms
Concurrency: ${report.settings.concurrency}

Total endpoints: ${report.summary.totalEndpoints}
Total requests: ${report.summary.totalRequests}
Overall error rate: ${(report.summary.errorRate * 100).toFixed(2)}%
Failed endpoints: ${report.summary.failedEndpoints.length === 0 ? "none" : report.summary.failedEndpoints.join(", ")}

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate | Threshold |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}
`;
}

async function createRuntime() {
  const configuredBaseUrl = process.env.BENCHMARK_BASE_URL;

  if (!configuredBaseUrl && !process.env.NODE_ENV) {
    process.env.NODE_ENV = "benchmark";
  }

  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  const token = signAccessToken({ sub: "usr_benchmark", role: "admin" });

  if (configuredBaseUrl) {
    return {
      baseUrl: configuredBaseUrl,
      token,
      close: async () => {}
    };
  }

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = await new Promise((resolveServer) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => resolveServer(listeningServer));
  });

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    token,
    close: () => new Promise((resolveClose, rejectClose) => {
      server.close((error) => {
        if (error) {
          rejectClose(error);
          return;
        }
        resolveClose();
      });
    })
  };
}

async function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = await readFile(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function readThresholds() {
  const content = await readFile(resolve(repoRoot, "benchmarks/thresholds.json"), "utf8");
  return JSON.parse(content);
}

function thresholdFor(endpointName) {
  return {
    ...thresholds.defaults,
    ...(thresholds.endpoints?.[endpointName] ?? {})
  };
}

function assertThresholds(report) {
  if (report.summary.failedEndpoints.length > 0) {
    throw new Error(`Benchmark thresholds failed for: ${report.summary.failedEndpoints.join(", ")}`);
  }
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/$/, "");
}

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function round(value, digits) {
  return Number(value.toFixed(digits));
}
