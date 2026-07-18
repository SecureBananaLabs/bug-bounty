import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SMOKE = process.env.BENCHMARK_SMOKE === "true" || process.argv.includes("--smoke");
const REQUESTS = Number(process.env.BENCHMARK_REQUESTS ?? (SMOKE ? 2 : 20));
const CONCURRENCY = Number(process.env.BENCHMARK_CONCURRENCY ?? (SMOKE ? 1 : 4));
const TIMEOUT_MS = Number(process.env.BENCHMARK_TIMEOUT_MS ?? 5000);
const OUTPUT_DIR = process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results";
const JWT_SECRET = process.env.JWT_SECRET ?? "benchmark-secret";

const benchmarkUser = {
  email: "benchmark.freelancer@example.com",
  password: "CorrectHorseBatteryStaple1",
  role: "freelancer"
};

const adminToken = signJwt({
  sub: "benchmark-admin",
  role: "admin",
  aud: "api-benchmark",
  iat: Math.floor(Date.now() / 1000)
});

const endpoints = [
  { name: "GET /health", method: "GET", path: "/health" },
  { name: "POST /api/auth/register", method: "POST", path: "/api/auth/register", json: benchmarkUser },
  { name: "POST /api/auth/login", method: "POST", path: "/api/auth/login", json: { email: benchmarkUser.email, password: benchmarkUser.password } },
  { name: "GET /api/auth/oauth/:provider/callback", method: "GET", path: "/api/auth/oauth/github/callback?code=benchmark-code" },
  { name: "POST /api/auth/refresh", method: "POST", path: "/api/auth/refresh", json: { token: adminToken } },
  { name: "GET /api/users", method: "GET", path: "/api/users" },
  { name: "POST /api/users", method: "POST", path: "/api/users", json: { email: "client@example.com", role: "client", profile: { company: "Benchmark Co" } } },
  { name: "GET /api/jobs", method: "GET", path: "/api/jobs" },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    json: {
      title: "Benchmark landing page refresh",
      description: "Synthetic project brief used for repeatable API load testing.",
      budgetMin: 750,
      budgetMax: 1500,
      categoryId: "web",
      skills: ["Next.js", "TypeScript", "QA"]
    }
  },
  { name: "GET /api/proposals", method: "GET", path: "/api/proposals" },
  { name: "POST /api/proposals", method: "POST", path: "/api/proposals", json: { jobId: "job_benchmark", freelancerId: "usr_benchmark", bidAmount: 1200, timelineDays: 7 } },
  { name: "POST /api/payments", method: "POST", path: "/api/payments", json: { amount: 1200, currency: "usd", jobId: "job_benchmark" } },
  { name: "GET /api/reviews", method: "GET", path: "/api/reviews" },
  { name: "POST /api/reviews", method: "POST", path: "/api/reviews", json: { jobId: "job_benchmark", reviewerId: "usr_client", revieweeId: "usr_freelancer", rating: 5, body: "Delivered on time with clean evidence." } },
  { name: "GET /api/messages", method: "GET", path: "/api/messages" },
  { name: "POST /api/messages", method: "POST", path: "/api/messages", json: { threadId: "thread_benchmark", senderId: "usr_client", recipientId: "usr_freelancer", body: "Can you confirm the milestone evidence?" } },
  { name: "GET /api/notifications", method: "GET", path: "/api/notifications" },
  { name: "POST /api/notifications", method: "POST", path: "/api/notifications", json: { userId: "usr_freelancer", type: "proposal_update", title: "Proposal accepted", body: "The client accepted your milestone plan." } },
  { name: "POST /api/uploads", method: "POST", path: "/api/uploads", multipart: { field: "file", filename: "benchmark-evidence.txt", contentType: "text/plain", body: "benchmark evidence file\n" } },
  { name: "GET /api/search", method: "GET", path: "/api/search?q=typescript%20dashboard" },
  { name: "GET /api/admin/metrics", method: "GET", path: "/api/admin/metrics", headers: { authorization: `Bearer ${adminToken}` } }
];

const server = await maybeStartLocalServer();
const baseUrl = process.env.BENCHMARK_TARGET_URL || server.baseUrl;

try {
  const startedAt = new Date().toISOString();
  const results = [];
  for (const endpoint of endpoints) {
    results.push(await runEndpoint(baseUrl, endpoint));
  }

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: SMOKE ? "smoke" : "full",
    target: baseUrl,
    config: { requestsPerEndpoint: REQUESTS, concurrency: CONCURRENCY, timeoutMs: TIMEOUT_MS },
    environment: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus().length,
      node: process.version,
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024)
    },
    results
  };

  await writeReports(report);
  if (SMOKE) {
    await assertThresholds(report);
  }
} finally {
  await server.close?.();
}

async function maybeStartLocalServer() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return { baseUrl: process.env.BENCHMARK_TARGET_URL };
  }

  process.env.JWT_SECRET = JWT_SECRET;
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
  };
}

async function runEndpoint(baseUrl, endpoint) {
  const samples = [];
  let nextIndex = 0;
  const started = performance.now();

  async function worker() {
    while (nextIndex < REQUESTS) {
      const requestIndex = nextIndex++;
      samples.push(await requestOnce(baseUrl, endpoint, requestIndex));
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, REQUESTS) }, () => worker()));
  const elapsedMs = performance.now() - started;
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const failures = samples.filter((sample) => sample.status < 200 || sample.status >= 400 || sample.error);
  const statusCounts = {};

  for (const sample of samples) {
    const key = sample.error ? "error" : String(sample.status);
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: samples.length,
    statusCounts,
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99)),
      mean: round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
    },
    ttfbMs: {
      p50: round(percentile(ttfbs, 50)),
      p95: round(percentile(ttfbs, 95)),
      p99: round(percentile(ttfbs, 99))
    },
    rps: {
      sustained: round(samples.length / (elapsedMs / 1000)),
      peak: peakRps(samples)
    },
    errorRatePct: round((failures.length / samples.length) * 100)
  };
}

async function requestOnce(baseUrl, endpoint, requestIndex) {
  const url = new URL(endpoint.path, baseUrl);
  const headers = { ...(endpoint.headers ?? {}) };
  let body;

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(varyJson(endpoint.json, requestIndex));
  } else if (endpoint.multipart) {
    const boundary = `----benchmark-${crypto.randomBytes(8).toString("hex")}`;
    headers["content-type"] = `multipart/form-data; boundary=${boundary}`;
    body = buildMultipart(boundary, endpoint.multipart);
  }

  return requestRaw(url, { method: endpoint.method, headers, body });
}

function requestRaw(url, options) {
  const client = url.protocol === "https:" ? https : http;
  const startedAt = performance.now();

  return new Promise((resolve) => {
    const req = client.request(url, { method: options.method, headers: options.headers, timeout: TIMEOUT_MS }, (res) => {
      const ttfbMs = performance.now() - startedAt;
      res.resume();
      res.on("end", () => {
        resolve({
          status: res.statusCode ?? 0,
          latencyMs: performance.now() - startedAt,
          ttfbMs,
          endedAt: Date.now()
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`timeout after ${TIMEOUT_MS}ms`));
    });

    req.on("error", (error) => {
      resolve({
        status: 0,
        latencyMs: performance.now() - startedAt,
        ttfbMs: performance.now() - startedAt,
        endedAt: Date.now(),
        error: error.message
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function varyJson(value, index) {
  return JSON.parse(JSON.stringify(value).replaceAll("benchmark", `benchmark-${index}`));
}

function buildMultipart(boundary, file) {
  return Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\n` +
      `Content-Type: ${file.contentType}\r\n\r\n` +
      `${file.body}\r\n` +
      `--${boundary}--\r\n`
  );
}

function percentile(values, pct) {
  if (!values.length) return 0;
  const rank = (pct / 100) * (values.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return values[low];
  return values[low] + (values[high] - values[low]) * (rank - low);
}

function peakRps(samples) {
  const buckets = new Map();
  for (const sample of samples) {
    const second = Math.floor(sample.endedAt / 1000);
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }
  return Math.max(0, ...buckets.values());
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function signJwt(payload) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

async function writeReports(report) {
  const outputDir = path.resolve(ROOT, OUTPUT_DIR);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "api-benchmark-latest.json"), JSON.stringify(report, null, 2) + "\n");
  await fs.writeFile(path.join(outputDir, "api-benchmark-latest.md"), renderMarkdown(report));
}

function renderMarkdown(report) {
  const rows = report.results
    .map((result) => `| ${result.name} | ${result.requests} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.rps.sustained} | ${result.errorRatePct}% | ${JSON.stringify(result.statusCounts)} |`)
    .join("\n");

  return `# API Benchmark Results\n\n` +
    `Target: \`${report.target}\`\n\n` +
    `Mode: \`${report.mode}\`  \n` +
    `Started: \`${report.startedAt}\`  \n` +
    `Requests per endpoint: \`${report.config.requestsPerEndpoint}\`  \n` +
    `Concurrency: \`${report.config.concurrency}\`\n\n` +
    `| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Error rate | Statuses |\n` +
    `|---|---:|---:|---:|---:|---:|---:|---:|---|\n` +
    `${rows}\n`;
}

async function assertThresholds(report) {
  const thresholdPath = path.resolve(ROOT, "benchmarks/thresholds.json");
  const thresholds = JSON.parse(await fs.readFile(thresholdPath, "utf8"));
  const failures = [];

  for (const result of report.results) {
    const threshold = thresholds.endpoints?.[result.name] ?? thresholds.default;
    if (result.latencyMs.p99 > threshold.p99Ms) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms > ${threshold.p99Ms}ms`);
    }
    if (result.errorRatePct > threshold.errorRatePct) {
      failures.push(`${result.name} error rate ${result.errorRatePct}% > ${threshold.errorRatePct}%`);
    }
  }

  if (failures.length) {
    throw new Error(`Benchmark thresholds failed:\n${failures.join("\n")}`);
  }
}
