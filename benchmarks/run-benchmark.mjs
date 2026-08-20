import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");
const isSmoke = process.argv.includes("--smoke");

const requestsPerEndpoint = Number(process.env.BENCHMARK_REQUESTS ?? (isSmoke ? 3 : 8));
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (isSmoke ? 1 : 4));

const benchmarkToken = signAccessToken({
  sub: "benchmark-admin",
  role: "admin",
  purpose: "api-benchmark"
});

function jsonHeaders(extra = {}) {
  return {
    "content-type": "application/json",
    ...extra
  };
}

function jsonBody(payload) {
  return JSON.stringify(payload);
}

function benchmarkFileForm() {
  const form = new FormData();
  form.set(
    "file",
    new Blob(["benchmark upload payload\n"], { type: "text/plain" }),
    "benchmark.txt"
  );
  return form;
}

const endpointSpecs = [
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    body: () => jsonBody({
      email: `bench-register-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "benchmark-password",
      role: "freelancer"
    }),
    headers: () => jsonHeaders()
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    body: () => jsonBody({ email: "bench-client@example.com", password: "benchmark-password" }),
    headers: () => jsonHeaders()
  },
  {
    name: "GET /api/auth/oauth/:provider/callback",
    method: "GET",
    path: "/api/auth/oauth/google/callback"
  },
  {
    name: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh"
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
    body: () => jsonBody({ name: "Benchmark Client", role: "client", email: "bench-user@example.com" }),
    headers: () => jsonHeaders()
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
    body: () => jsonBody({
      title: "Benchmark API Buildout",
      description: "Synthetic benchmark job with realistic payload shape.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "automation",
      skills: ["node", "api", "benchmarking"]
    }),
    headers: () => jsonHeaders()
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
    body: () => jsonBody({ jobId: "job_benchmark", freelancerId: "usr_benchmark", rate: 75, coverLetter: "Benchmark proposal payload." }),
    headers: () => jsonHeaders()
  },
  {
    name: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    body: () => jsonBody({ amount: 100000, currency: "usd", metadata: { source: "benchmark" } }),
    headers: () => jsonHeaders()
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
    body: () => jsonBody({ jobId: "job_benchmark", rating: 5, body: "Benchmark review payload." }),
    headers: () => jsonHeaders()
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
    body: () => jsonBody({ threadId: "thr_benchmark", senderId: "usr_benchmark", body: "Benchmark message payload." }),
    headers: () => jsonHeaders()
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
    body: () => jsonBody({ userId: "usr_benchmark", type: "benchmark", title: "Benchmark notification", body: "Synthetic notification payload." }),
    headers: () => jsonHeaders()
  },
  {
    name: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    body: benchmarkFileForm
  },
  {
    name: "GET /api/search",
    method: "GET",
    path: "/api/search?q=automation"
  },
  {
    name: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: () => ({ authorization: `Bearer ${benchmarkToken}` })
  }
];

function percentile(values, pct) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

async function startLocalApp() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return { baseUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/+$/, ""), close: async () => {} };
  }

  const app = createApp();
  const server = await new Promise((resolve) => {
    const started = app.listen(0, "127.0.0.1", () => resolve(started));
  });
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

async function runOneRequest(baseUrl, spec) {
  const start = performance.now();
  let ttfbMs = 0;
  let status = 0;
  let ok = false;
  let error = "";

  try {
    const response = await fetch(`${baseUrl}${spec.path}`, {
      method: spec.method,
      headers: spec.headers?.(),
      body: spec.body?.()
    });
    ttfbMs = performance.now() - start;
    status = response.status;
    await response.arrayBuffer();
    ok = response.ok;
  } catch (requestError) {
    error = requestError instanceof Error ? requestError.message : String(requestError);
  }

  return {
    latencyMs: performance.now() - start,
    ttfbMs,
    status,
    ok,
    error
  };
}

async function runEndpoint(baseUrl, spec) {
  const started = performance.now();
  let nextRequest = 0;
  const samples = [];

  async function worker() {
    while (nextRequest < requestsPerEndpoint) {
      nextRequest += 1;
      samples.push(await runOneRequest(baseUrl, spec));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, requestsPerEndpoint) }, worker));

  const durationSeconds = (performance.now() - started) / 1000;
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfbs = samples.map((sample) => sample.ttfbMs).filter(Boolean);
  const failures = samples.filter((sample) => !sample.ok);
  const statusCounts = samples.reduce((acc, sample) => {
    acc[sample.status] = (acc[sample.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    name: spec.name,
    method: spec.method,
    path: spec.path,
    requests: samples.length,
    durationSeconds: round(durationSeconds),
    sustainedRps: round(samples.length / Math.max(durationSeconds, 0.001)),
    peakRps: round(samples.length / Math.max(durationSeconds, 0.001)),
    errorRatePercent: round((failures.length / Math.max(samples.length, 1)) * 100),
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99))
    },
    ttfbMs: {
      p50: round(percentile(ttfbs, 50)),
      p95: round(percentile(ttfbs, 95)),
      p99: round(percentile(ttfbs, 99))
    },
    statusCounts,
    sampleErrors: failures.map((failure) => failure.error).filter(Boolean).slice(0, 3)
  };
}

async function loadThresholds() {
  const raw = await fs.readFile(thresholdsPath, "utf8");
  const thresholds = JSON.parse(raw);

  if (process.env.BENCHMARK_P99_THRESHOLD_MS) {
    thresholds.default.p99Ms = Number(process.env.BENCHMARK_P99_THRESHOLD_MS);
  }
  if (process.env.BENCHMARK_ERROR_RATE_THRESHOLD) {
    thresholds.default.errorRatePercent = Number(process.env.BENCHMARK_ERROR_RATE_THRESHOLD);
  }

  return thresholds;
}

function thresholdFor(result, thresholds) {
  return {
    ...thresholds.default,
    ...(thresholds.endpoints?.[result.name] ?? {})
  };
}

function evaluate(results, thresholds) {
  return results.flatMap((result) => {
    const threshold = thresholdFor(result, thresholds);
    const failures = [];
    if (result.latencyMs.p99 > threshold.p99Ms) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms > ${threshold.p99Ms}ms`);
    }
    if (result.errorRatePercent > threshold.errorRatePercent) {
      failures.push(`${result.name} error rate ${result.errorRatePercent}% > ${threshold.errorRatePercent}%`);
    }
    return failures;
  });
}

function markdownReport(report) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Target: ${report.target}`,
    `Requests per endpoint: ${report.requestsPerEndpoint}`,
    `Concurrency: ${report.concurrency}`,
    "",
    "## Environment",
    "",
    `- CPU: ${report.environment.cpu}`,
    `- Platform: ${report.environment.platform}`,
    `- Node: ${report.environment.node}`,
    `- Memory: ${report.environment.memoryGiB} GiB total`,
    "",
    "## Results",
    "",
    "| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Error % | Statuses |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...report.results.map((result) => (
      `| ${result.name} | ${result.requests} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.sustainedRps} | ${result.errorRatePercent} | ${Object.entries(result.statusCounts).map(([status, count]) => `${status}:${count}`).join(", ")} |`
    )),
    "",
    "## Regression Gate",
    "",
    report.failures.length === 0 ? "Passed." : report.failures.map((failure) => `- ${failure}`).join("\n")
  ];

  return `${lines.join("\n")}\n`;
}

async function main() {
  const { baseUrl, close } = await startLocalApp();
  const thresholds = await loadThresholds();

  try {
    const results = [];
    for (const spec of endpointSpecs) {
      results.push(await runEndpoint(baseUrl, spec));
    }

    const report = {
      generatedAt: new Date().toISOString(),
      mode: isSmoke ? "smoke" : "full",
      target: baseUrl,
      requestsPerEndpoint,
      concurrency,
      thresholds,
      environment: {
        cpu: os.cpus()[0]?.model ?? "unknown",
        platform: `${os.type()} ${os.release()} ${os.arch()}`,
        node: process.version,
        memoryGiB: round(os.totalmem() / 1024 / 1024 / 1024)
      },
      results,
      failures: evaluate(results, thresholds)
    };

    await fs.mkdir(resultsDir, { recursive: true });
    await fs.writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
    await fs.writeFile(path.join(resultsDir, "latest.md"), markdownReport(report));

    console.log(markdownReport(report));

    if (report.failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await close();
  }
}

await main();
