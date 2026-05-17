#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const outputDir = getArgValue("--output-dir") ?? resolve(repoRoot, "benchmarks", "results");

await loadBenchmarkEnv();

const targetUrl = process.env.BENCHMARK_TARGET_URL;
const requestsPerEndpoint = Number(process.env.BENCHMARK_REQUESTS ?? (smoke ? 2 : 5));
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 1 : 2));
const benchmarkToken =
  process.env.BENCHMARK_TOKEN ??
  signAccessToken({ sub: "benchmark-user", role: "admin", purpose: "benchmark" });

const endpoints = [
  { name: "auth_register", method: "POST", path: "/api/auth/register", json: () => userPayload("register") },
  { name: "auth_login", method: "POST", path: "/api/auth/login", json: () => userPayload("login") },
  { name: "auth_oauth_callback", method: "GET", path: "/api/auth/oauth/github/callback?code=benchmark-code" },
  { name: "auth_refresh", method: "POST", path: "/api/auth/refresh", json: () => ({}) },
  { name: "users_list", method: "GET", path: "/api/users" },
  { name: "users_create", method: "POST", path: "/api/users", json: () => ({ email: uniqueEmail("user"), role: "client" }) },
  { name: "jobs_list", method: "GET", path: "/api/jobs" },
  { name: "jobs_create", method: "POST", path: "/api/jobs", json: jobPayload },
  { name: "proposals_list", method: "GET", path: "/api/proposals" },
  { name: "proposals_create", method: "POST", path: "/api/proposals", json: proposalPayload },
  { name: "payments_create", method: "POST", path: "/api/payments", json: paymentPayload },
  { name: "reviews_list", method: "GET", path: "/api/reviews" },
  { name: "reviews_create", method: "POST", path: "/api/reviews", json: reviewPayload },
  { name: "messages_list", method: "GET", path: "/api/messages" },
  { name: "messages_create", method: "POST", path: "/api/messages", json: messagePayload },
  { name: "notifications_list", method: "GET", path: "/api/notifications" },
  { name: "notifications_create", method: "POST", path: "/api/notifications", json: notificationPayload },
  { name: "uploads_create", method: "POST", path: "/api/uploads", multipart: uploadPayload },
  { name: "search", method: "GET", path: "/api/search?q=developer&category=automation" },
  {
    name: "admin_metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: () => ({ authorization: `Bearer ${benchmarkToken}` })
  }
];

const thresholds = JSON.parse(
  await readFile(resolve(repoRoot, "benchmarks", "thresholds.json"), "utf8")
);

let server;
let baseUrl = targetUrl;

if (!baseUrl) {
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolvePromise, reject) => {
    server.once("listening", resolvePromise);
    server.once("error", reject);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
}

try {
  await mkdir(outputDir, { recursive: true });
  const startedAt = new Date();
  const results = [];

  for (const endpoint of endpoints) {
    results.push(await benchmarkEndpoint(endpoint, baseUrl));
  }

  const summary = {
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    targetUrl: targetUrl ? redactUrl(baseUrl) : "local in-process server",
    mode: smoke ? "smoke" : "baseline",
    requestsPerEndpoint,
    concurrency,
    endpointCount: endpoints.length,
    results
  };

  const timestamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const jsonPath = resolve(outputDir, `benchmark-${smoke ? "smoke" : "baseline"}-${timestamp}.json`);
  const markdownPath = resolve(outputDir, `benchmark-${smoke ? "smoke" : "baseline"}-${timestamp}.md`);

  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdown(summary));

  const failures = findThresholdFailures(results, thresholds);
  console.log(`Wrote benchmark JSON: ${jsonPath}`);
  console.log(`Wrote benchmark summary: ${markdownPath}`);
  console.table(results.map(compactResult));

  if (failures.length > 0) {
    console.error("Benchmark threshold failures:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  }
} finally {
  if (server) {
    await new Promise((resolvePromise, reject) => {
      server.close((error) => (error ? reject(error) : resolvePromise()));
    });
  }
}

function getArgValue(name) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

async function loadBenchmarkEnv() {
  try {
    const envPath = resolve(repoRoot, ".env.benchmark");
    const content = await readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=");
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function benchmarkEndpoint(endpoint, base) {
  const latencies = [];
  const ttfbs = [];
  const statuses = new Map();
  let errors = 0;
  const total = Math.max(1, requestsPerEndpoint);
  let nextIndex = 0;
  const startedAt = performance.now();

  async function worker() {
    while (nextIndex < total) {
      const requestIndex = nextIndex++;
      try {
        const result = await sendRequest(endpoint, base, requestIndex);
        latencies.push(result.durationMs);
        ttfbs.push(result.ttfbMs);
        statuses.set(result.statusCode, (statuses.get(result.statusCode) ?? 0) + 1);
        if (result.statusCode >= 500) {
          errors += 1;
        }
      } catch {
        errors += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));
  const totalMs = performance.now() - startedAt;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: total,
    peakRps: round((total / totalMs) * 1000),
    sustainedRps: round((total / totalMs) * 1000),
    errorRate: round((errors / total) * 100),
    statusCodes: Object.fromEntries([...statuses.entries()].sort(([a], [b]) => a - b)),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    }
  };
}

function sendRequest(endpoint, base, requestIndex) {
  const url = new URL(endpoint.path, base);
  const isHttps = url.protocol === "https:";
  const transport = isHttps ? https : http;
  const headers = { ...(endpoint.headers ? endpoint.headers(requestIndex) : {}) };
  let body;

  if (endpoint.json) {
    body = Buffer.from(JSON.stringify(endpoint.json(requestIndex)));
    headers["content-type"] = "application/json";
    headers["content-length"] = body.length;
  }

  if (endpoint.multipart) {
    const multipart = endpoint.multipart(requestIndex);
    body = multipart.body;
    headers["content-type"] = multipart.contentType;
    headers["content-length"] = body.length;
  }

  return new Promise((resolvePromise, reject) => {
    const start = performance.now();
    let firstByteAt;
    const req = transport.request(
      {
        method: endpoint.method,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        headers
      },
      (res) => {
        res.once("data", () => {
          firstByteAt ??= performance.now();
        });
        res.on("data", () => {});
        res.on("end", () => {
          const end = performance.now();
          resolvePromise({
            statusCode: res.statusCode ?? 0,
            durationMs: round(end - start),
            ttfbMs: round((firstByteAt ?? end) - start)
          });
        });
      }
    );

    req.on("error", reject);
    req.setTimeout(10_000, () => {
      req.destroy(new Error("benchmark request timed out"));
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function userPayload(kind) {
  return {
    email: uniqueEmail(kind),
    password: "benchmark-password",
    role: "client"
  };
}

function jobPayload(index) {
  return {
    title: `Benchmark automation job ${index}`,
    description: "Benchmark payload representing a realistic client automation request.",
    budgetMin: 500,
    budgetMax: 1500,
    categoryId: "automation",
    skills: ["node", "api", "benchmarking"]
  };
}

function proposalPayload(index) {
  return {
    jobId: `job_${index}`,
    freelancerId: `usr_freelancer_${index}`,
    coverLetter: "I can deliver this benchmarked integration with milestones and clear acceptance checks.",
    amount: 900,
    timelineDays: 7
  };
}

function paymentPayload(index) {
  return {
    invoiceId: `inv_${index}`,
    amount: 90000,
    currency: "usd",
    method: "card"
  };
}

function reviewPayload(index) {
  return {
    jobId: `job_${index}`,
    reviewerId: `usr_client_${index}`,
    revieweeId: `usr_freelancer_${index}`,
    rating: 5,
    comment: "Clear communication, scoped delivery, and measurable performance improvements."
  };
}

function messagePayload(index) {
  return {
    conversationId: `conv_${index}`,
    senderId: `usr_client_${index}`,
    recipientId: `usr_freelancer_${index}`,
    body: "Can you share the benchmark summary and next recommended regression threshold?"
  };
}

function notificationPayload(index) {
  return {
    userId: `usr_${index}`,
    type: "benchmark",
    title: "Benchmark completed",
    body: "Your API benchmark report is ready for review."
  };
}

function uploadPayload(index) {
  const boundary = `----freelanceflow-benchmark-${Date.now()}-${index}`;
  const content = Buffer.from("benchmark upload fixture\n");
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="file"; filename="benchmark.txt"\r\n'),
    Buffer.from("Content-Type: text/plain\r\n\r\n"),
    content,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body
  };
}

function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`;
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return round(sorted[index]);
}

function round(value) {
  return Number(value.toFixed(2));
}

function compactResult(result) {
  return {
    endpoint: result.name,
    requests: result.requests,
    p50: result.latencyMs.p50,
    p95: result.latencyMs.p95,
    p99: result.latencyMs.p99,
    ttfbP95: result.ttfbMs.p95,
    rps: result.sustainedRps,
    errorRate: result.errorRate
  };
}

function findThresholdFailures(results, thresholdConfig) {
  const globalThresholds = thresholdConfig.global ?? {};
  const endpointThresholds = thresholdConfig.endpoints ?? {};
  const failures = [];

  for (const result of results) {
    const effective = { ...globalThresholds, ...(endpointThresholds[result.name] ?? {}) };
    if (effective.maxP99LatencyMs !== undefined && result.latencyMs.p99 > effective.maxP99LatencyMs) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms > ${effective.maxP99LatencyMs}ms`);
    }
    if (effective.maxErrorRatePercent !== undefined && result.errorRate > effective.maxErrorRatePercent) {
      failures.push(`${result.name} error rate ${result.errorRate}% > ${effective.maxErrorRatePercent}%`);
    }
  }

  return failures;
}

function renderMarkdown(summary) {
  const rows = summary.results
    .map(
      (result) =>
        `| ${result.name} | ${result.method} ${result.path} | ${result.requests} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.sustainedRps} | ${result.errorRate}% |`
    )
    .join("\n");

  return `# API Benchmark Summary

- Target: ${summary.targetUrl}
- Mode: ${summary.mode}
- Started: ${summary.startedAt}
- Completed: ${summary.completedAt}
- Endpoints: ${summary.endpointCount}
- Requests per endpoint: ${summary.requestsPerEndpoint}
- Concurrency: ${summary.concurrency}

| Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Error rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

function redactUrl(value) {
  const url = new URL(value);
  url.username = "";
  url.password = "";
  return url.toString();
}
