import autocannon from "autocannon";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultsDir = path.join(rootDir, "benchmarks", "results");
const envPath = path.join(rootDir, ".env.benchmark");
const thresholdsPath = path.join(rootDir, "benchmarks", "thresholds.json");

await loadBenchmarkEnv();

const isSmoke = process.argv.includes("--smoke") || process.env.BENCHMARK_MODE === "smoke";
const mode = isSmoke ? "smoke" : "full";
const duration = numberFromEnv("BENCHMARK_DURATION_SECONDS", isSmoke ? 1 : 3);
const connections = numberFromEnv("BENCHMARK_CONNECTIONS", isSmoke ? 1 : 2);
const jwtSecret = process.env.JWT_SECRET || "development-secret";

process.env.JWT_SECRET = jwtSecret;
process.env.BENCHMARK_DISABLE_RATE_LIMIT = process.env.BENCHMARK_DISABLE_RATE_LIMIT ?? "true";

const benchmarkToken = jwt.sign(
  { sub: "bench_user", role: "admin", scope: "benchmark" },
  jwtSecret,
  { expiresIn: "10m" }
);

const endpoints = [
  {
    name: "auth register",
    method: "POST",
    path: "/api/auth/register",
    body: {
      email: "benchmark.register@example.com",
      password: "CorrectHorseBatteryStaple!2026",
      role: "client"
    }
  },
  {
    name: "auth login",
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: "benchmark.login@example.com",
      password: "CorrectHorseBatteryStaple!2026"
    }
  },
  { name: "auth oauth callback", method: "GET", path: "/api/auth/oauth/github/callback" },
  { name: "auth refresh", method: "POST", path: "/api/auth/refresh", body: {} },
  { name: "users list", method: "GET", path: "/api/users" },
  {
    name: "users create",
    method: "POST",
    path: "/api/users",
    body: {
      email: "new.freelancer@example.com",
      name: "Benchmark Freelancer",
      role: "freelancer",
      skills: ["node", "react", "payments"],
      hourlyRate: 85
    }
  },
  { name: "jobs list", method: "GET", path: "/api/jobs" },
  {
    name: "jobs create",
    method: "POST",
    path: "/api/jobs",
    body: {
      title: "Build a payment reconciliation dashboard",
      description: "Benchmark payload representing a realistic client job brief with requirements, milestones, and acceptance criteria.",
      budgetMin: 2800,
      budgetMax: 3600,
      categoryId: "cat_payments",
      skills: ["node", "postgres", "stripe"]
    }
  },
  { name: "proposals list", method: "GET", path: "/api/proposals" },
  {
    name: "proposals create",
    method: "POST",
    path: "/api/proposals",
    body: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver the benchmarked workflow with observability, tests, and clear rollout notes.",
      bidAmount: 2800,
      estimatedDays: 12
    }
  },
  {
    name: "payments create",
    method: "POST",
    path: "/api/payments",
    body: {
      amount: 120000,
      currency: "usd",
      jobId: "job_benchmark",
      metadata: { invoice: "bench-2026-05", payer: "client" }
    }
  },
  { name: "reviews list", method: "GET", path: "/api/reviews" },
  {
    name: "reviews create",
    method: "POST",
    path: "/api/reviews",
    body: {
      jobId: "job_benchmark",
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Fast delivery, strong communication, and production-quality implementation."
    }
  },
  { name: "messages list", method: "GET", path: "/api/messages" },
  {
    name: "messages create",
    method: "POST",
    path: "/api/messages",
    body: {
      conversationId: "conv_benchmark",
      senderId: "usr_benchmark_client",
      recipientId: "usr_benchmark_freelancer",
      text: "Please confirm the deployment checklist and performance budget before release."
    }
  },
  { name: "notifications list", method: "GET", path: "/api/notifications" },
  {
    name: "notifications create",
    method: "POST",
    path: "/api/notifications",
    body: {
      userId: "usr_benchmark_freelancer",
      type: "proposal.accepted",
      message: "Your proposal was accepted and escrow has been funded."
    }
  },
  { name: "search", method: "GET", path: "/api/search?q=node%20stripe%20freelancer" },
  {
    name: "uploads create",
    method: "POST",
    path: "/api/uploads",
    rawBody: multipartBody("file", "benchmark-spec.txt", "Benchmark upload payload for endpoint coverage.\n"),
    headers: { "content-type": "multipart/form-data; boundary=bench-boundary" }
  },
  {
    name: "admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: { authorization: `Bearer ${benchmarkToken}` }
  }
];

let server;
const baseUrl = await resolveBaseUrl();

try {
  await fs.mkdir(resultsDir, { recursive: true });
  const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
  const activeThreshold = thresholds[mode] ?? thresholds.default;
  const startedAt = new Date();
  const results = [];

  for (const endpoint of endpoints) {
    const result = await benchmarkEndpoint(baseUrl, endpoint);
    results.push(result);
    console.log(`${result.passed ? "PASS" : "FAIL"} ${endpoint.method} ${endpoint.path} p99=${result.metrics.p99Ms}ms rps=${result.metrics.sustainedRps}`);
  }

  const summary = {
    mode,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    target: baseUrl,
    durationSeconds: duration,
    connections,
    threshold: activeThreshold,
    environment: environmentSnapshot(),
    totals: summarize(results),
    results
  };

  const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDir, `${mode}-${stamp}.json`);
  const mdPath = path.join(resultsDir, `${mode}-${stamp}.md`);
  const latestJson = path.join(resultsDir, `${mode}-latest.json`);
  const latestMd = path.join(resultsDir, `${mode}-latest.md`);
  const markdown = renderMarkdown(summary);

  await fs.writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(mdPath, markdown);
  await fs.writeFile(latestJson, `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(latestMd, markdown);

  const failures = results.filter((result) => violates(result, activeThreshold));
  if (failures.length > 0) {
    console.error(`Benchmark threshold failures: ${failures.map((item) => item.name).join(", ")}`);
    process.exitCode = 1;
  }
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function loadBenchmarkEnv() {
  try {
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const [key, ...valueParts] = trimmed.split("=");
      process.env[key] ??= valueParts.join("=").replace(/^["']|["']$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function resolveBaseUrl() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return process.env.BENCHMARK_TARGET_URL.replace(/\/$/, "");
  }

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function benchmarkEndpoint(base, endpoint) {
  const url = `${base}${endpoint.path}`;
  const body = endpoint.rawBody ?? (endpoint.body ? JSON.stringify(endpoint.body) : undefined);
  const headers = {
    ...(body && !endpoint.rawBody ? { "content-type": "application/json" } : {}),
    ...(endpoint.headers ?? {})
  };

  const ttfbMs = await measureTtfb(url, endpoint.method, headers, body);
  const result = await autocannon({
    url,
    method: endpoint.method,
    connections,
    duration,
    amount: isSmoke ? 1 : undefined,
    headers,
    body
  });

  const requests = result.requests ?? {};
  const latency = result.latency ?? {};
  const errors = result.errors + result.timeouts + result.non2xx;
  const total = Math.max(result.requests.total, 1);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    statusCode: result["2xx"] > 0 ? "2xx" : result.non2xx > 0 ? "non-2xx" : "none",
    passed: errors === 0,
    metrics: {
      p50Ms: round(latency.p50),
      p95Ms: round(latency.p95),
      p99Ms: round(latency.p99),
      sustainedRps: round(requests.average),
      peakRps: round(requests.max),
      errorRate: round(errors / total, 4),
      ttfbMs: round(ttfbMs)
    },
    raw: {
      requests: result.requests.total,
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx
    }
  };
}

function measureTtfb(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const started = process.hrtime.bigint();
    const request = http.request(url, { method, headers }, (response) => {
      resolve(Number(process.hrtime.bigint() - started) / 1_000_000);
      response.resume();
    });
    request.on("error", reject);
    request.setTimeout(5000, () => {
      request.destroy(new Error(`TTFB timeout for ${method} ${url}`));
    });
    if (body) {
      request.write(body);
    }
    request.end();
  });
}

function multipartBody(field, filename, content) {
  return [
    "--bench-boundary",
    `Content-Disposition: form-data; name="${field}"; filename="${filename}"`,
    "Content-Type: text/plain",
    "",
    content,
    "--bench-boundary--",
    ""
  ].join("\r\n");
}

function violates(result, threshold) {
  return result.metrics.p99Ms > threshold.maxP99Ms ||
    result.metrics.errorRate > threshold.maxErrorRate ||
    result.metrics.sustainedRps < threshold.minSustainedRps;
}

function summarize(results) {
  const failed = results.filter((result) => !result.passed);
  return {
    endpointCount: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    maxP99Ms: round(Math.max(...results.map((result) => result.metrics.p99Ms))),
    averageSustainedRps: round(results.reduce((sum, result) => sum + result.metrics.sustainedRps, 0) / results.length),
    averageErrorRate: round(results.reduce((sum, result) => sum + result.metrics.errorRate, 0) / results.length, 4)
  };
}

function environmentSnapshot() {
  const cpus = os.cpus();
  return {
    cpu: cpus[0]?.model ?? "unknown",
    logicalCores: cpus.length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    node: process.version,
    network: "loopback/local target by default"
  };
}

function renderMarkdown(summary) {
  const rows = summary.results.map((result) => {
    const metrics = result.metrics;
    return `| ${result.method} ${result.path} | ${metrics.p50Ms} | ${metrics.p95Ms} | ${metrics.p99Ms} | ${metrics.sustainedRps} | ${metrics.peakRps} | ${(metrics.errorRate * 100).toFixed(2)}% | ${metrics.ttfbMs} | ${result.passed ? "pass" : "fail"} |`;
  }).join("\n");

  return `# API Benchmark Report

- Mode: ${summary.mode}
- Target: ${summary.target}
- Started: ${summary.startedAt}
- Duration per endpoint: ${summary.durationSeconds}s
- Connections: ${summary.connections}
- Endpoints covered: ${summary.totals.endpointCount}
- Max p99: ${summary.totals.maxP99Ms} ms
- Average sustained RPS: ${summary.totals.averageSustainedRps}
- Average error rate: ${(summary.totals.averageErrorRate * 100).toFixed(2)}%

## Environment

- CPU model and cores: ${summary.environment.cpu}, ${summary.environment.logicalCores} logical cores
- RAM: ${summary.environment.totalMemoryMb} MB total, ${summary.environment.freeMemoryMb} MB free during benchmark
- OS: ${summary.environment.os}
- Runtime: Node.js ${summary.environment.node}
- Network: ${summary.environment.network}

## Results

| Endpoint | p50 ms | p95 ms | p99 ms | Sustained RPS | Peak RPS | Error rate | TTFB ms | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}
`;
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(value.toFixed(digits));
}
