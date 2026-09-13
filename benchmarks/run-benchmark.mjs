import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const enforceThresholds = args.has("--enforce-thresholds");
const runId = `bench_${Date.now()}`;
const resultsDir = path.resolve(repoRoot, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results");
const requestsPerEndpoint = Number(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT ?? (smoke ? 2 : 8));
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 1 : 2));
const timeoutMs = Number(process.env.BENCHMARK_TIMEOUT_MS ?? 10000);

const endpoints = [
  {
    name: "health",
    method: "GET",
    path: "/health",
    expectedStatus: 200
  },
  {
    name: "auth register",
    method: "POST",
    path: "/api/auth/register",
    expectedStatus: 201,
    json: ({ iteration }) => ({
      email: `bench-register-${runId}-${iteration}@example.com`,
      password: "benchmark-password-123",
      role: "client"
    })
  },
  {
    name: "auth login",
    method: "POST",
    path: "/api/auth/login",
    expectedStatus: 200,
    json: ({ iteration }) => ({
      email: `bench-login-${runId}-${iteration}@example.com`,
      password: "benchmark-password-123"
    })
  },
  {
    name: "oauth callback",
    method: "GET",
    path: "/api/auth/oauth/google/callback",
    expectedStatus: 200
  },
  {
    name: "auth refresh",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatus: 200,
    json: () => ({ refreshToken: `refresh-${runId}` })
  },
  {
    name: "users list",
    method: "GET",
    path: "/api/users",
    expectedStatus: 200
  },
  {
    name: "users create",
    method: "POST",
    path: "/api/users",
    expectedStatus: 201,
    json: ({ iteration }) => ({
      email: `bench-user-${runId}-${iteration}@example.com`,
      fullName: "Benchmark Client",
      role: "client",
      profile: { company: "Benchmark Studio", timezone: "UTC" }
    })
  },
  {
    name: "jobs list",
    method: "GET",
    path: "/api/jobs",
    expectedStatus: 200
  },
  {
    name: "jobs create",
    method: "POST",
    path: "/api/jobs",
    expectedStatus: 201,
    json: ({ iteration }) => ({
      title: `Benchmark marketplace build ${iteration}`,
      description: "Design and ship a scoped marketplace workflow with milestone review, payment state, and notification handling for performance testing.",
      budgetMin: 1200,
      budgetMax: 4800,
      categoryId: "engineering",
      skills: ["node", "nextjs", "payments", "testing"]
    })
  },
  {
    name: "proposals list",
    method: "GET",
    path: "/api/proposals",
    expectedStatus: 200
  },
  {
    name: "proposals create",
    method: "POST",
    path: "/api/proposals",
    expectedStatus: 201,
    json: ({ iteration }) => ({
      jobId: `job_${runId}_${iteration}`,
      freelancerId: "usr_benchmark_freelancer",
      bidAmount: 2400,
      coverLetter: "Benchmark proposal with relevant experience, milestones, acceptance criteria, and delivery checkpoints.",
      estimatedDurationDays: 14
    })
  },
  {
    name: "payments create",
    method: "POST",
    path: "/api/payments",
    expectedStatus: 201,
    json: ({ iteration }) => ({
      amount: 2400 + iteration,
      currency: "usd",
      milestoneId: `milestone_${runId}_${iteration}`,
      payerId: "usr_benchmark_client",
      payeeId: "usr_benchmark_freelancer"
    })
  },
  {
    name: "reviews list",
    method: "GET",
    path: "/api/reviews",
    expectedStatus: 200
  },
  {
    name: "reviews create",
    method: "POST",
    path: "/api/reviews",
    expectedStatus: 201,
    json: ({ iteration }) => ({
      jobId: `job_${runId}_${iteration}`,
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Clear delivery, fast feedback loops, and reliable milestone proof for benchmark payload coverage."
    })
  },
  {
    name: "messages list",
    method: "GET",
    path: "/api/messages",
    expectedStatus: 200
  },
  {
    name: "messages create",
    method: "POST",
    path: "/api/messages",
    expectedStatus: 201,
    json: ({ iteration }) => ({
      threadId: `thread_${runId}`,
      senderId: "usr_benchmark_client",
      recipientId: "usr_benchmark_freelancer",
      body: `Benchmark message ${iteration}: confirm scope, proof artifact, and next review checkpoint.`
    })
  },
  {
    name: "notifications list",
    method: "GET",
    path: "/api/notifications",
    expectedStatus: 200
  },
  {
    name: "notifications create",
    method: "POST",
    path: "/api/notifications",
    expectedStatus: 201,
    json: ({ iteration }) => ({
      userId: "usr_benchmark_client",
      type: "milestone",
      message: `Milestone ${iteration} is ready for review in the benchmark flow.`
    })
  },
  {
    name: "uploads create",
    method: "POST",
    path: "/api/uploads",
    expectedStatus: 201,
    multipart: ({ iteration }) => ({
      fieldName: "file",
      filename: `benchmark-proof-${iteration}.txt`,
      contentType: "text/plain",
      content: `Benchmark proof artifact ${iteration}\nScope: marketplace flow\nResult: accepted\n`
    })
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=marketplace%20payments%20review",
    expectedStatus: 200
  },
  {
    name: "admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatus: 200,
    auth: true
  }
];

const thresholds = JSON.parse(await fs.readFile(path.join(repoRoot, "benchmarks/thresholds.json"), "utf8"));
const localServer = await maybeStartLocalServer();
const baseUrl = process.env.BENCHMARK_TARGET_URL || localServer.baseUrl;
const authToken = await getBenchmarkToken();

try {
  const environment = getEnvironment();
  const startedAt = new Date().toISOString();
  const results = [];

  for (const endpoint of endpoints) {
    results.push(await runEndpoint(endpoint));
  }

  const report = {
    runId,
    mode: smoke ? "smoke" : "default",
    startedAt,
    completedAt: new Date().toISOString(),
    baseUrl,
    config: {
      requestsPerEndpoint,
      concurrency,
      timeoutMs,
      endpointCount: endpoints.length
    },
    environment,
    results,
    thresholdSummary: evaluateThresholds(results)
  };

  await fs.mkdir(resultsDir, { recursive: true });
  await fs.writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(resultsDir, "latest.md"), renderMarkdown(report));

  console.log(renderConsoleSummary(report));

  if (enforceThresholds && report.thresholdSummary.failures.length > 0) {
    console.error("Benchmark thresholds failed:");
    for (const failure of report.thresholdSummary.failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  }
} finally {
  if (localServer.server) {
    await new Promise((resolve, reject) => {
      localServer.server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function maybeStartLocalServer() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return { baseUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, ""), server: null };
  }

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  return { baseUrl: `http://127.0.0.1:${address.port}`, server };
}

async function getBenchmarkToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({ sub: "usr_benchmark_admin", role: "admin" });
}

async function runEndpoint(endpoint) {
  const startedAt = performance.now();
  const samples = [];
  let nextIteration = 0;

  async function worker() {
    while (nextIteration < requestsPerEndpoint) {
      const iteration = nextIteration;
      nextIteration += 1;
      samples.push(await requestOnce(endpoint, iteration));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, requestsPerEndpoint) }, worker));
  const durationMs = Math.max(performance.now() - startedAt, 1);
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfb = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errors = samples.filter((sample) => sample.error || sample.status !== endpoint.expectedStatus);
  const statusCounts = {};

  for (const sample of samples) {
    const key = sample.status ? String(sample.status) : "error";
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    expectedStatus: endpoint.expectedStatus,
    requests: samples.length,
    durationMs: round(durationMs),
    sustainedRps: round(samples.length / (durationMs / 1000)),
    peakRps: calculatePeakRps(samples),
    errorRatePercent: round((errors.length / samples.length) * 100),
    statusCounts,
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      p50: percentile(ttfb, 50),
      p95: percentile(ttfb, 95),
      p99: percentile(ttfb, 99)
    },
    responseBytes: samples.reduce((total, sample) => total + sample.bytes, 0)
  };
}

async function requestOnce(endpoint, iteration) {
  const url = new URL(endpoint.path, baseUrl);
  const headers = {};
  let body;

  if (endpoint.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (endpoint.json) {
    body = Buffer.from(JSON.stringify(endpoint.json({ runId, iteration })));
    headers["content-type"] = "application/json";
    headers["content-length"] = String(body.length);
  }

  if (endpoint.multipart) {
    const part = endpoint.multipart({ runId, iteration });
    const boundary = `----benchmark-${runId}-${iteration}`;
    body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="${part.fieldName}"; filename="${part.filename}"\r\n`),
      Buffer.from(`Content-Type: ${part.contentType}\r\n\r\n`),
      Buffer.from(part.content),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);
    headers["content-type"] = `multipart/form-data; boundary=${boundary}`;
    headers["content-length"] = String(body.length);
  }

  return new Promise((resolve) => {
    const startedAt = performance.now();
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(
      url,
      {
        method: endpoint.method,
        headers,
        timeout: timeoutMs
      },
      (response) => {
        const ttfbMs = performance.now() - startedAt;
        let bytes = 0;

        response.on("data", (chunk) => {
          bytes += chunk.length;
        });

        response.on("end", () => {
          resolve({
            status: response.statusCode,
            bytes,
            latencyMs: round(performance.now() - startedAt),
            ttfbMs: round(ttfbMs),
            startedAt
          });
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error(`Timed out after ${timeoutMs}ms`));
    });

    request.on("error", (error) => {
      resolve({
        status: 0,
        bytes: 0,
        latencyMs: round(performance.now() - startedAt),
        ttfbMs: round(performance.now() - startedAt),
        startedAt,
        error: error.message
      });
    });

    if (body) {
      request.write(body);
    }
    request.end();
  });
}

function evaluateThresholds(results) {
  const failures = [];
  const thresholdSet = smoke ? thresholds.smoke : thresholds.default;

  for (const result of results) {
    const endpointThreshold = thresholds.endpoints[`${result.method} ${result.path}`] ?? thresholdSet;
    if (result.latencyMs.p99 > endpointThreshold.maxP99Ms) {
      failures.push(`${result.method} ${result.path} p99 ${result.latencyMs.p99}ms > ${endpointThreshold.maxP99Ms}ms`);
    }
    if (result.errorRatePercent > endpointThreshold.maxErrorRatePercent) {
      failures.push(`${result.method} ${result.path} error rate ${result.errorRatePercent}% > ${endpointThreshold.maxErrorRatePercent}%`);
    }
  }

  return {
    passed: failures.length === 0,
    failures
  };
}

function calculatePeakRps(samples) {
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor(sample.startedAt / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Math.max(...buckets.values(), samples.length);
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const index = Math.min(values.length - 1, Math.ceil((p / 100) * values.length) - 1);
  return round(values[index]);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function getEnvironment() {
  return {
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCores: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    node: process.version,
    target: process.env.BENCHMARK_TARGET_URL ? "external" : "local-loopback"
  };
}

function renderMarkdown(report) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `- Run ID: ${report.runId}`,
    `- Mode: ${report.mode}`,
    `- Target: ${report.baseUrl}`,
    `- Started: ${report.startedAt}`,
    `- Completed: ${report.completedAt}`,
    `- Requests per endpoint: ${report.config.requestsPerEndpoint}`,
    `- Concurrency: ${report.config.concurrency}`,
    `- Threshold status: ${report.thresholdSummary.passed ? "passed" : "failed"}`,
    "",
    "## Environment",
    "",
    `- Platform: ${report.environment.platform}`,
    `- CPU: ${report.environment.cpu}`,
    `- Logical cores: ${report.environment.logicalCores}`,
    `- Memory: ${Math.round(report.environment.totalMemoryBytes / 1024 / 1024)} MiB total, ${Math.round(report.environment.freeMemoryBytes / 1024 / 1024)} MiB free at run start`,
    `- Node: ${report.environment.node}`,
    "",
    "## Endpoint Results",
    "",
    "| Endpoint | Requests | Error % | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Statuses |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of report.results) {
    lines.push(`| ${result.method} ${result.path} | ${result.requests} | ${result.errorRatePercent} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.sustainedRps} | ${result.peakRps} | ${JSON.stringify(result.statusCounts)} |`);
  }

  if (report.thresholdSummary.failures.length > 0) {
    lines.push("", "## Threshold Failures", "");
    for (const failure of report.thresholdSummary.failures) {
      lines.push(`- ${failure}`);
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function renderConsoleSummary(report) {
  const lines = [
    `Benchmark ${report.runId} (${report.mode}) against ${report.baseUrl}`,
    `Thresholds: ${report.thresholdSummary.passed ? "passed" : "failed"}`,
    "Endpoint summary:"
  ];

  for (const result of report.results) {
    lines.push(
      `- ${result.method} ${result.path}: p99 ${result.latencyMs.p99}ms, ` +
      `${result.sustainedRps} rps, errors ${result.errorRatePercent}%`
    );
  }

  return lines.join("\n");
}
