import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultsDir = path.join(rootDir, "benchmarks", "results");
const thresholdsPath = path.join(rootDir, "benchmarks", "thresholds.json");

const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke");
const shouldCheckThresholds = args.has("--check-thresholds");

await loadEnvFile();

const config = {
  mode: isSmoke ? "smoke" : "full",
  requestsPerEndpoint: Number(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT ?? (isSmoke ? 2 : 5)),
  concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? (isSmoke ? 1 : 2)),
  targetUrl: process.env.BENCHMARK_TARGET_URL?.replace(/\/$/, "") ?? null
};

const endpoints = [
  {
    name: "health",
    method: "GET",
    path: "/health",
    description: "service liveness probe"
  },
  {
    name: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    json: (i) => ({
      email: `benchmark.client.${Date.now()}.${i}@example.com`,
      password: "benchmark-password-123",
      role: i % 2 === 0 ? "client" : "freelancer"
    }),
    description: "registration payload matching the auth schema"
  },
  {
    name: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    json: (i) => ({
      email: `benchmark.login.${i}@example.com`,
      password: "benchmark-password-123"
    }),
    description: "login payload matching the auth schema"
  },
  {
    name: "auth.oauth_callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback?code=benchmark-code",
    description: "OAuth callback with a provider and authorization code"
  },
  {
    name: "auth.refresh",
    method: "POST",
    path: "/api/auth/refresh",
    description: "access-token refresh endpoint"
  },
  {
    name: "users.list",
    method: "GET",
    path: "/api/users",
    description: "user collection read"
  },
  {
    name: "users.create",
    method: "POST",
    path: "/api/users",
    json: (i) => ({
      email: `benchmark.user.${Date.now()}.${i}@example.com`,
      name: `Benchmark User ${i}`,
      role: i % 2 === 0 ? "client" : "freelancer",
      hourlyRate: 65,
      timezone: "UTC"
    }),
    description: "user creation with marketplace profile fields"
  },
  {
    name: "jobs.list",
    method: "GET",
    path: "/api/jobs",
    description: "job collection read"
  },
  {
    name: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    json: (i) => ({
      title: `Build benchmark workflow ${i}`,
      description: "Implement a production-sized freelance marketplace workflow with typed API integration and review evidence.",
      budgetMin: 1200,
      budgetMax: 3200,
      categoryId: "engineering",
      skills: ["Node.js", "Express", "Performance"]
    }),
    description: "job creation payload matching the Zod job schema"
  },
  {
    name: "proposals.list",
    method: "GET",
    path: "/api/proposals",
    description: "proposal collection read"
  },
  {
    name: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    json: (i) => ({
      jobId: `job_benchmark_${i}`,
      freelancerId: `usr_freelancer_${i}`,
      bidAmount: 1850,
      estimatedDurationDays: 12,
      coverLetter: "I will deliver the implementation, validation notes, and handoff documentation with clear review checkpoints."
    }),
    description: "proposal creation with realistic bid and cover-letter size"
  },
  {
    name: "payments.create",
    method: "POST",
    path: "/api/payments",
    json: () => ({
      amount: 250000,
      currency: "usd",
      jobId: "job_benchmark_payment",
      payerId: "usr_client_benchmark",
      payeeId: "usr_freelancer_benchmark"
    }),
    description: "payment-intent payload with marketplace references"
  },
  {
    name: "reviews.list",
    method: "GET",
    path: "/api/reviews",
    description: "review collection read"
  },
  {
    name: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    json: (i) => ({
      jobId: `job_review_${i}`,
      reviewerId: "usr_client_benchmark",
      revieweeId: "usr_freelancer_benchmark",
      rating: 5,
      comment: "Clear delivery, responsive communication, and strong validation evidence for the accepted milestone."
    }),
    description: "review creation with normal marketplace feedback"
  },
  {
    name: "messages.list",
    method: "GET",
    path: "/api/messages",
    description: "message collection read"
  },
  {
    name: "messages.create",
    method: "POST",
    path: "/api/messages",
    json: (i) => ({
      senderId: "usr_client_benchmark",
      receiverId: "usr_freelancer_benchmark",
      body: `Can you share the benchmark validation notes for milestone ${i} before we approve payment?`
    }),
    description: "message creation with realistic thread text"
  },
  {
    name: "notifications.list",
    method: "GET",
    path: "/api/notifications",
    description: "notification collection read"
  },
  {
    name: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    json: (i) => ({
      userId: "usr_client_benchmark",
      type: "proposal_update",
      title: "Benchmark proposal update",
      body: `A benchmark proposal moved to review checkpoint ${i}.`
    }),
    description: "notification creation with feed-sized text"
  },
  {
    name: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    multipart: () => ({
      fieldName: "file",
      filename: "benchmark-brief.txt",
      contentType: "text/plain",
      content: "Benchmark attachment representing a short project brief and review artifact.\n"
    }),
    description: "small file upload through multipart form data"
  },
  {
    name: "search.global",
    method: "GET",
    path: "/api/search?q=marketplace%20workflow%20review",
    description: "global search with a realistic marketplace query"
  },
  {
    name: "admin.metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true,
    description: "admin metrics endpoint using a benchmark-only bearer token"
  }
];

const localServer = config.targetUrl ? null : await startLocalServer();
const baseUrl = config.targetUrl ?? localServer.baseUrl;
const authToken = await getBenchmarkToken();

try {
  const startedAt = new Date();
  const endpointResults = [];

  for (const endpoint of endpoints) {
    endpointResults.push(await benchmarkEndpoint(endpoint, baseUrl, authToken, config));
  }

  const finishedAt = new Date();
  const report = {
    tool: "node-fetch-loopback-benchmark",
    mode: config.mode,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    targetUrl: baseUrl,
    environment: collectEnvironment(),
    config: {
      requestsPerEndpoint: config.requestsPerEndpoint,
      concurrency: config.concurrency
    },
    endpoints: endpointResults,
    totals: summarizeTotals(endpointResults)
  };

  await fs.mkdir(resultsDir, { recursive: true });
  const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDir, `${stamp}-${config.mode}.json`);
  const mdPath = path.join(resultsDir, `${stamp}-${config.mode}.md`);
  const latestJsonPath = path.join(resultsDir, `latest-${config.mode}.json`);
  const latestMdPath = path.join(resultsDir, `latest-${config.mode}.md`);
  const markdown = renderMarkdown(report);

  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(mdPath, markdown);
  await fs.writeFile(latestJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(latestMdPath, markdown);

  if (shouldCheckThresholds) {
    await checkThresholds(report);
  }

  console.log(`Benchmark report written to ${mdPath}`);
  console.log(`Latest report written to ${latestMdPath}`);
} finally {
  await localServer?.close();
}

async function loadEnvFile() {
  const envFile = path.join(rootDir, process.env.BENCHMARK_ENV_FILE ?? ".env.benchmark");
  try {
    const content = await fs.readFile(envFile, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) {
        continue;
      }
      const [key, ...valueParts] = line.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function startLocalServer() {
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

async function getBenchmarkToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({ sub: "benchmark_admin", role: "admin" });
}

async function benchmarkEndpoint(endpoint, baseUrl, token, runConfig) {
  const samples = [];
  let cursor = 0;
  const startedAtMs = performance.now();
  const totalRequests = endpoint.requests ?? runConfig.requestsPerEndpoint;
  const workerCount = Math.min(runConfig.concurrency, totalRequests);

  async function worker() {
    while (cursor < totalRequests) {
      const iteration = cursor;
      cursor += 1;
      samples.push(await runRequest(endpoint, baseUrl, token, iteration, startedAtMs));
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  const durationMs = Math.max(1, performance.now() - startedAtMs);
  return summarizeEndpoint(endpoint, samples, durationMs);
}

async function runRequest(endpoint, baseUrl, token, iteration, startedAtMs) {
  const request = buildRequest(endpoint, token, iteration);
  const url = `${baseUrl}${request.path}`;
  const started = performance.now();
  let response;
  let ttfbMs = 0;
  let bytes = 0;
  let bodyText = "";
  let error = null;

  try {
    response = await fetch(url, {
      method: endpoint.method,
      headers: request.headers,
      body: request.body
    });
    ttfbMs = performance.now() - started;
    bodyText = await response.text();
    bytes = Buffer.byteLength(bodyText);
  } catch (requestError) {
    error = requestError.message;
  }

  const ended = performance.now();
  return {
    status: response?.status ?? 0,
    success: Boolean(response && response.status >= 200 && response.status < 400),
    latencyMs: ended - started,
    ttfbMs,
    bytes,
    error,
    relativeEndMs: ended - startedAtMs
  };
}

function buildRequest(endpoint, token, iteration) {
  const headers = {};
  let body = null;

  if (endpoint.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.json(iteration));
  }

  if (endpoint.multipart) {
    const multipart = endpoint.multipart(iteration);
    const boundary = `----freelanceflow-benchmark-${Date.now()}-${iteration}`;
    headers["content-type"] = `multipart/form-data; boundary=${boundary}`;
    body = Buffer.from([
      `--${boundary}`,
      `Content-Disposition: form-data; name="${multipart.fieldName}"; filename="${multipart.filename}"`,
      `Content-Type: ${multipart.contentType}`,
      "",
      multipart.content,
      `--${boundary}--`,
      ""
    ].join("\r\n"));
  }

  return { path: endpoint.path, headers, body };
}

function summarizeEndpoint(endpoint, samples, durationMs) {
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const failures = samples.filter((sample) => !sample.success);
  const buckets = new Map();

  for (const sample of samples) {
    const second = Math.floor(sample.relativeEndMs / 1000);
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    requestCount: samples.length,
    successCount: samples.length - failures.length,
    errorCount: failures.length,
    errorRatePct: percent(failures.length, samples.length),
    statusCodes: countStatusCodes(samples),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    },
    rps: {
      sustained: round(samples.length / (durationMs / 1000)),
      peak: Math.max(...buckets.values())
    },
    bytesReceived: samples.reduce((sum, sample) => sum + sample.bytes, 0),
    sampleErrors: failures.slice(0, 3).map((sample) => ({
      status: sample.status,
      error: sample.error
    }))
  };
}

function summarizeTotals(endpointResults) {
  const requestCount = endpointResults.reduce((sum, endpoint) => sum + endpoint.requestCount, 0);
  const errorCount = endpointResults.reduce((sum, endpoint) => sum + endpoint.errorCount, 0);
  const sustainedRps = endpointResults.reduce((sum, endpoint) => sum + endpoint.rps.sustained, 0);
  const peakRps = endpointResults.reduce((sum, endpoint) => sum + endpoint.rps.peak, 0);

  return {
    endpointCount: endpointResults.length,
    requestCount,
    errorCount,
    errorRatePct: percent(errorCount, requestCount),
    sustainedRps: round(sustainedRps),
    peakRps,
    worstP99LatencyMs: round(Math.max(...endpointResults.map((endpoint) => endpoint.latencyMs.p99))),
    worstP99TtfbMs: round(Math.max(...endpointResults.map((endpoint) => endpoint.ttfbMs.p99)))
  };
}

function countStatusCodes(samples) {
  return samples.reduce((counts, sample) => {
    counts[sample.status] = (counts[sample.status] ?? 0) + 1;
    return counts;
  }, {});
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return round(sortedValues[Math.min(sortedValues.length - 1, Math.max(0, index))]);
}

function percent(part, whole) {
  if (whole === 0) {
    return 0;
  }
  return round((part / whole) * 100);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function collectEnvironment() {
  return {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpus: os.cpus().map((cpu) => cpu.model),
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    nodeVersion: process.version
  };
}

function renderMarkdown(report) {
  const lines = [
    `# API Benchmark Report (${report.mode})`,
    "",
    `- Started: ${report.startedAt}`,
    `- Finished: ${report.finishedAt}`,
    `- Target: ${report.targetUrl}`,
    `- Tool: ${report.tool}`,
    `- Endpoints covered: ${report.totals.endpointCount}`,
    `- Requests: ${report.totals.requestCount}`,
    `- Error rate: ${report.totals.errorRatePct}%`,
    `- Sustained RPS: ${report.totals.sustainedRps}`,
    `- Peak RPS: ${report.totals.peakRps}`,
    `- Worst p99 latency: ${report.totals.worstP99LatencyMs} ms`,
    `- Worst p99 TTFB: ${report.totals.worstP99TtfbMs} ms`,
    "",
    "| Endpoint | Method | Path | Requests | Error rate | p50 latency | p95 latency | p99 latency | p99 TTFB | Sustained RPS | Peak RPS |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const endpoint of report.endpoints) {
    lines.push([
      endpoint.name,
      endpoint.method,
      endpoint.path.replace(/\|/g, "\\|"),
      endpoint.requestCount,
      `${endpoint.errorRatePct}%`,
      `${endpoint.latencyMs.p50} ms`,
      `${endpoint.latencyMs.p95} ms`,
      `${endpoint.latencyMs.p99} ms`,
      `${endpoint.ttfbMs.p99} ms`,
      endpoint.rps.sustained,
      endpoint.rps.peak
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("");
  lines.push("## Environment");
  lines.push("");
  lines.push(`- Node.js: ${report.environment.nodeVersion}`);
  lines.push(`- Platform: ${report.environment.platform} ${report.environment.release} ${report.environment.arch}`);
  lines.push(`- CPU: ${report.environment.cpus[0] ?? "unknown"} (${report.environment.cpus.length} logical cores)`);
  lines.push(`- Memory: ${Math.round(report.environment.freeMemoryBytes / 1024 / 1024)} MiB free / ${Math.round(report.environment.totalMemoryBytes / 1024 / 1024)} MiB total`);

  return `${lines.join("\n")}\n`;
}

async function checkThresholds(report) {
  const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
  const modeThreshold = thresholds[report.mode] ?? {};
  const failures = [];

  for (const endpoint of report.endpoints) {
    const endpointThreshold = thresholds.endpoints?.[endpoint.name] ?? {};
    const maxP99LatencyMs = endpointThreshold.p99LatencyMs ?? modeThreshold.p99LatencyMs ?? thresholds.defaults.p99LatencyMs;
    const maxErrorRatePct = endpointThreshold.errorRatePct ?? modeThreshold.errorRatePct ?? thresholds.defaults.errorRatePct;

    if (endpoint.latencyMs.p99 > maxP99LatencyMs) {
      failures.push(`${endpoint.name} p99 latency ${endpoint.latencyMs.p99} ms exceeded ${maxP99LatencyMs} ms`);
    }

    if (endpoint.errorRatePct > maxErrorRatePct) {
      failures.push(`${endpoint.name} error rate ${endpoint.errorRatePct}% exceeded ${maxErrorRatePct}%`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Benchmark threshold failures:\n${failures.join("\n")}`);
  }

  console.log("Benchmark thresholds passed.");
}
