import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const smokeMode = process.argv.includes("--smoke");

await loadEnvFile(path.join(rootDir, ".env.benchmark"));

const startedAt = new Date();
const config = {
  requestsPerEndpoint: numberFromEnv("BENCHMARK_REQUESTS_PER_ENDPOINT", smokeMode ? 1 : 5),
  concurrency: numberFromEnv("BENCHMARK_CONCURRENCY", smokeMode ? 1 : 2),
  timeoutMs: numberFromEnv("BENCHMARK_TIMEOUT_MS", 5000),
  resultsDir: process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results",
  mode: smokeMode ? "smoke" : "full"
};

const benchmarkToken = process.env.BENCHMARK_AUTH_TOKEN ?? createJwt(
  { sub: "benchmark_admin", role: "admin", purpose: "api-benchmark" },
  process.env.JWT_SECRET ?? "development-secret"
);

const routes = [
  endpoint("health", "GET", "/health"),
  endpoint("auth.register", "POST", "/api/auth/register", {
    json: () => ({
      email: `benchmark-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  }),
  endpoint("auth.login", "POST", "/api/auth/login", {
    json: () => ({ email: "benchmark@example.com", password: "benchmark-password" })
  }),
  endpoint("auth.oauthCallback", "GET", "/api/auth/oauth/github/callback"),
  endpoint("auth.refresh", "POST", "/api/auth/refresh"),
  endpoint("users.list", "GET", "/api/users"),
  endpoint("users.create", "POST", "/api/users", {
    json: () => ({
      email: `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      role: "freelancer",
      status: "active",
      profile: {
        headline: "Full-stack freelancer for marketplace builds",
        hourlyRate: 95,
        skills: ["node", "react", "api"]
      }
    })
  }),
  endpoint("jobs.list", "GET", "/api/jobs"),
  endpoint("jobs.create", "POST", "/api/jobs", {
    json: () => ({
      title: "Build marketplace API dashboard",
      description: "Create a production-ready dashboard for marketplace operations and reporting.",
      budgetMin: 2500,
      budgetMax: 7500,
      categoryId: "software-development",
      skills: ["node", "react", "postgres", "analytics"]
    })
  }),
  endpoint("proposals.list", "GET", "/api/proposals"),
  endpoint("proposals.create", "POST", "/api/proposals", {
    json: () => ({
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver the scoped implementation with tests and weekly milestones.",
      proposedBudget: 4200,
      estimatedDays: 14
    })
  }),
  endpoint("payments.create", "POST", "/api/payments", {
    json: () => ({ amount: 125000, currency: "usd", metadata: { source: "benchmark" } })
  }),
  endpoint("reviews.list", "GET", "/api/reviews"),
  endpoint("reviews.create", "POST", "/api/reviews", {
    json: () => ({
      jobId: "job_benchmark",
      reviewerId: "usr_client",
      revieweeId: "usr_freelancer",
      rating: 5,
      comment: "Clear communication, fast delivery, and strong test coverage."
    })
  }),
  endpoint("messages.list", "GET", "/api/messages"),
  endpoint("messages.create", "POST", "/api/messages", {
    json: () => ({
      conversationId: "conv_benchmark",
      senderId: "usr_client",
      recipientId: "usr_freelancer",
      body: "Can you share the latest milestone update and remaining risks?"
    })
  }),
  endpoint("notifications.list", "GET", "/api/notifications"),
  endpoint("notifications.create", "POST", "/api/notifications", {
    json: () => ({
      userId: "usr_benchmark",
      type: "proposal_update",
      message: "Your proposal moved to review."
    })
  }),
  endpoint("uploads.create", "POST", "/api/uploads", {
    multipart: () => ({
      fieldName: "file",
      filename: "benchmark.txt",
      contentType: "text/plain",
      body: "benchmark upload payload for API performance measurement"
    })
  }),
  endpoint("search.global", "GET", "/api/search?q=react%20api%20marketplace"),
  endpoint("admin.metrics", "GET", "/api/admin/metrics", { auth: true })
];

let server;
const targetUrl = process.env.BENCHMARK_TARGET_URL ?? await startLocalServer();

try {
  const results = [];
  for (const route of routes) {
    results.push(await benchmarkRoute(targetUrl, route, config));
  }

  const report = buildReport({
    startedAt,
    targetUrl,
    config,
    routes: results,
    environment: environmentSnapshot()
  });

  const outputDir = path.resolve(rootDir, config.resultsDir);
  await fs.mkdir(outputDir, { recursive: true });
  const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(outputDir, `benchmark-${stamp}.json`);
  const markdownPath = path.join(outputDir, `benchmark-${stamp}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, markdownSummary(report));

  const failures = await thresholdFailures(report);
  console.log(`Benchmark complete: ${jsonPath}`);
  console.log(`Markdown summary: ${markdownPath}`);
  if (failures.length > 0) {
    console.error("Threshold failures:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  }
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

function endpoint(name, method, urlPath, options = {}) {
  return { name, method, path: urlPath, ...options };
}

async function startLocalServer() {
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

async function benchmarkRoute(baseUrl, route, options) {
  const samples = [];
  const total = options.requestsPerEndpoint;
  let next = 0;
  const started = performance.now();

  async function worker() {
    while (next < total) {
      next += 1;
      samples.push(await sendRequest(baseUrl, route, options.timeoutMs));
    }
  }

  const workers = Array.from({ length: Math.min(options.concurrency, total) }, () => worker());
  await Promise.all(workers);
  const ended = performance.now();

  return summarizeRoute(route, samples, started, ended);
}

function sendRequest(baseUrl, route, timeoutMs) {
  return new Promise((resolve) => {
    const url = new URL(route.path, baseUrl);
    const headers = { "User-Agent": "freelanceflow-api-benchmark/1.0" };
    let body;

    if (route.auth) {
      headers.Authorization = `Bearer ${benchmarkToken}`;
    }

    if (route.json) {
      body = Buffer.from(JSON.stringify(route.json()));
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = body.length;
    } else if (route.multipart) {
      const part = route.multipart();
      const boundary = `benchmark-${crypto.randomBytes(8).toString("hex")}`;
      body = Buffer.concat([
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="${part.fieldName}"; filename="${part.filename}"\r\n`),
        Buffer.from(`Content-Type: ${part.contentType}\r\n\r\n`),
        Buffer.from(part.body),
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ]);
      headers["Content-Type"] = `multipart/form-data; boundary=${boundary}`;
      headers["Content-Length"] = body.length;
    }

    const transport = url.protocol === "https:" ? https : http;
    const started = performance.now();
    let firstByteAt;
    let bytes = 0;
    let settled = false;

    const req = transport.request(
      url,
      { method: route.method, headers, timeout: timeoutMs },
      (res) => {
        firstByteAt = performance.now();
        res.on("data", (chunk) => {
          bytes += chunk.length;
        });
        res.on("end", () => {
          settled = true;
          const ended = performance.now();
          resolve({
            statusCode: res.statusCode ?? 0,
            latencyMs: ended - started,
            ttfbMs: (firstByteAt ?? ended) - started,
            bytes,
            ok: (res.statusCode ?? 500) < 400,
            completedAtMs: ended
          });
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error(`Request timed out after ${timeoutMs}ms`)));
    req.on("error", (error) => {
      if (settled) return;
      const ended = performance.now();
      resolve({
        statusCode: 0,
        latencyMs: ended - started,
        ttfbMs: ended - started,
        bytes,
        ok: false,
        error: error.message,
        completedAtMs: ended
      });
    });

    if (body) req.write(body);
    req.end();
  });
}

function summarizeRoute(route, samples, started, ended) {
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfb = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errors = samples.filter((sample) => !sample.ok).length;
  const durationSec = Math.max((ended - started) / 1000, 0.001);
  return {
    name: route.name,
    method: route.method,
    path: route.path,
    requests: samples.length,
    statusCodes: countStatusCodes(samples),
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99))
    },
    ttfbMs: {
      p95: round(percentile(ttfb, 95))
    },
    requestsPerSecond: {
      sustained: round(samples.length / durationSec),
      peakOneSecond: peakOneSecond(samples, started)
    },
    errorRatePercent: round((errors / Math.max(samples.length, 1)) * 100),
    bytesRead: samples.reduce((total, sample) => total + sample.bytes, 0)
  };
}

function buildReport({ startedAt, targetUrl, config, routes, environment }) {
  return {
    startedAt: startedAt.toISOString(),
    targetUrl,
    mode: config.mode,
    requestsPerEndpoint: config.requestsPerEndpoint,
    concurrency: config.concurrency,
    environment,
    routes,
    summary: {
      routeCount: routes.length,
      requestCount: routes.reduce((total, route) => total + route.requests, 0),
      maxP99Ms: round(Math.max(...routes.map((route) => route.latencyMs.p99))),
      maxErrorRatePercent: round(Math.max(...routes.map((route) => route.errorRatePercent)))
    }
  };
}

function markdownSummary(report) {
  const rows = report.routes.map((route) => [
    route.name,
    `${route.method} ${route.path}`,
    route.requests,
    route.latencyMs.p50,
    route.latencyMs.p95,
    route.latencyMs.p99,
    route.ttfbMs.p95,
    route.requestsPerSecond.sustained,
    route.requestsPerSecond.peakOneSecond,
    route.errorRatePercent
  ]);

  return `# API Benchmark Summary

- Started: ${report.startedAt}
- Target: ${report.targetUrl}
- Mode: ${report.mode}
- Requests per endpoint: ${report.requestsPerEndpoint}
- Concurrency: ${report.concurrency}
- Routes covered: ${report.summary.routeCount}
- Total requests: ${report.summary.requestCount}
- Max p99 latency: ${report.summary.maxP99Ms} ms
- Max error rate: ${report.summary.maxErrorRatePercent}%

| Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.map((row) => `| ${row.join(" | ")} |`).join("\n")}
`;
}

async function thresholdFailures(report) {
  const thresholdPath = path.resolve(rootDir, "benchmarks/thresholds.json");
  const thresholds = JSON.parse(await fs.readFile(thresholdPath, "utf8"));
  const active = thresholds[report.mode]?.default ?? {};
  const failures = [];
  for (const route of report.routes) {
    if (active.p99Ms !== undefined && route.latencyMs.p99 > active.p99Ms) {
      failures.push(`${route.name} p99 ${route.latencyMs.p99}ms exceeded ${active.p99Ms}ms`);
    }
    if (active.errorRatePercent !== undefined && route.errorRatePercent > active.errorRatePercent) {
      failures.push(`${route.name} error rate ${route.errorRatePercent}% exceeded ${active.errorRatePercent}%`);
    }
  }
  return failures;
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function createJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + 15 * 60, ...payload };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedBody = base64Url(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64url");
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function numberFromEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function percentile(values, target) {
  if (values.length === 0) return 0;
  const index = Math.min(values.length - 1, Math.ceil((target / 100) * values.length) - 1);
  return values[index];
}

function peakOneSecond(samples, started) {
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor((sample.completedAtMs - started) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Math.max(0, ...buckets.values());
}

function countStatusCodes(samples) {
  return samples.reduce((counts, sample) => {
    const key = String(sample.statusCode);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function environmentSnapshot() {
  return {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    cpus: os.cpus().length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024)
  };
}
