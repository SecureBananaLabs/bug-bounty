#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const DEFAULT_SCENARIOS = [
  { name: "health", method: "GET", path: "/health" },
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    body: () => ({
      email: `benchmark-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "benchmark-password",
      role: "client",
    }),
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: "benchmark@example.com",
      password: "benchmark-password",
    },
  },
  { name: "auth-oauth-callback", method: "GET", path: "/api/auth/github/callback" },
  { name: "auth-refresh", method: "POST", path: "/api/auth/refresh" },
  { name: "list-jobs", method: "GET", path: "/api/jobs" },
  {
    name: "create-job",
    method: "POST",
    path: "/api/jobs",
    body: {
      title: "Benchmark job",
      description: "Measure marketplace API create-job latency.",
      budgetMin: 1000,
      budgetMax: 2500,
      categoryId: "cat_benchmark",
      skills: ["node", "api"],
    },
  },
  { name: "list-users", method: "GET", path: "/api/users" },
  {
    name: "create-user",
    method: "POST",
    path: "/api/users",
    body: {
      name: "Benchmark User",
      email: "benchmark@example.com",
      role: "client",
    },
  },
  { name: "list-proposals", method: "GET", path: "/api/proposals" },
  {
    name: "create-proposal",
    method: "POST",
    path: "/api/proposals",
    body: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark",
      coverLetter: "Benchmark proposal payload.",
      bid: 1200,
    },
  },
  { name: "list-messages", method: "GET", path: "/api/messages" },
  {
    name: "send-message",
    method: "POST",
    path: "/api/messages",
    body: {
      senderId: "usr_benchmark",
      recipientId: "usr_target",
      message: "Benchmark message payload.",
    },
  },
  {
    name: "create-payment",
    method: "POST",
    path: "/api/payments",
    body: { amount: 4900, currency: "usd" },
  },
  { name: "list-reviews", method: "GET", path: "/api/reviews" },
  {
    name: "create-review",
    method: "POST",
    path: "/api/reviews",
    body: {
      jobId: "job_benchmark",
      reviewerId: "usr_benchmark",
      revieweeId: "usr_target",
      rating: 5,
      comment: "Benchmark review payload.",
    },
  },
  { name: "list-notifications", method: "GET", path: "/api/notifications" },
  {
    name: "create-notification",
    method: "POST",
    path: "/api/notifications",
    body: {
      userId: "usr_benchmark",
      type: "benchmark",
      message: "Benchmark notification payload.",
    },
  },
  {
    name: "upload-file",
    method: "POST",
    path: "/api/uploads",
    multipart: {
      fieldName: "file",
      filename: "benchmark.txt",
      contentType: "text/plain",
      content: "benchmark upload payload\n",
    },
  },
  { name: "search", method: "GET", path: "/api/search?q=node" },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true,
  },
];

const args = parseArgs(process.argv.slice(2));
const options = {
  baseUrl: args.url,
  durationMs: seconds(args.duration ?? "15"),
  warmupMs: seconds(args.warmup ?? "3"),
  concurrency: number(args.concurrency ?? "8"),
  output: args.output ?? "benchmarks/results/api-benchmark.json",
  summary: args.summary ?? "benchmarks/results/api-benchmark.md",
  thresholds: await loadThresholds(args.thresholds ?? "benchmarks/thresholds.json"),
  startLocal: args["start-local"] !== "false",
  jwtSecret: args["jwt-secret"] ?? process.env.JWT_SECRET ?? "benchmark-secret",
};

const localServer = options.baseUrl ? null : await startLocalApi(options.startLocal);
const baseUrl = options.baseUrl ?? localServer.baseUrl;

try {
  await warmup(baseUrl, options.warmupMs);
  const results = await runBenchmark(baseUrl, options.durationMs, options.concurrency);
  const report = buildReport(results, options);
  await writeJson(options.output, report);
  await writeFileEnsured(options.summary, renderMarkdown(report), "utf8");
  console.log(renderConsole(report));

  const exitCode =
    report.summary.errorRate > options.thresholds.maxErrorRate ||
    report.summary.p99Ms > options.thresholds.maxP99Ms
      ? 1
      : 0;
  process.exitCode = exitCode;
} finally {
  localServer?.stop();
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const [rawKey, rawValue] = item.slice(2).split("=");
    parsed[rawKey] = rawValue ?? argv[index + 1] ?? "true";
    if (!rawValue && argv[index + 1] && !argv[index + 1].startsWith("--")) index += 1;
  }
  return parsed;
}

function seconds(value) {
  return Math.max(1, Number(value)) * 1000;
}

function number(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid numeric option: ${value}`);
  return parsed;
}

async function startLocalApi(enabled) {
  if (!enabled) {
    throw new Error("Pass --url or enable --start-local.");
  }

  const port = await getFreePort();
  const serverPath = resolve("apps/api/src/server.js");
  const child = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "benchmark",
      JWT_SECRET: process.env.JWT_SECRET ?? "benchmark-secret",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const log = createWriteStream("benchmarks/results/local-api.log", { flags: "a" });
  child.stdout.pipe(log);
  child.stderr.pipe(log);

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHealth(baseUrl, child);
  return {
    baseUrl,
    stop: () => child.kill("SIGTERM"),
  };
}

async function getFreePort() {
  return new Promise((resolvePromise, reject) => {
    const server = http.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePromise(port));
    });
    server.on("error", reject);
  });
}

async function waitForHealth(baseUrl, child) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Local API exited with code ${child.exitCode}`);
    try {
      const response = await request({ method: "GET", url: `${baseUrl}/health` });
      if (response.statusCode === 200) return;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Local API did not become healthy within 10 seconds");
}

async function warmup(baseUrl, warmupMs) {
  const endAt = Date.now() + warmupMs;
  while (Date.now() < endAt) {
    await Promise.all(DEFAULT_SCENARIOS.map((scenario) => runScenario(baseUrl, scenario)));
  }
}

async function runBenchmark(baseUrl, durationMs, concurrency) {
  const samples = [];
  const endAt = Date.now() + durationMs;
  const workers = Array.from({ length: concurrency }, (_, workerIndex) =>
    workerLoop(workerIndex, baseUrl, endAt, samples),
  );
  await Promise.all(workers);
  return samples;
}

async function workerLoop(workerIndex, baseUrl, endAt, samples) {
  let cursor = workerIndex;
  while (Date.now() < endAt) {
    const scenario = DEFAULT_SCENARIOS[cursor % DEFAULT_SCENARIOS.length];
    const sample = await runScenario(baseUrl, scenario);
    samples.push(sample);
    cursor += 1;
  }
}

async function runScenario(baseUrl, scenario) {
  const startedAt = performance.now();
  const startedAtMs = Date.now();
  try {
    const response = await request({
      method: scenario.method,
      url: `${baseUrl}${scenario.path}`,
      body: typeof scenario.body === "function" ? scenario.body() : scenario.body,
      multipart: scenario.multipart,
      headers: scenario.auth ? { Authorization: `Bearer ${createBenchmarkToken()}` } : {},
    });
    const endedAt = performance.now();
    return {
      scenario: scenario.name,
      method: scenario.method,
      path: scenario.path,
      statusCode: response.statusCode,
      ok: response.statusCode >= 200 && response.statusCode < 400,
      latencyMs: endedAt - startedAt,
      ttfbMs: response.ttfbMs,
      bytes: response.bytes,
      startedAtMs,
    };
  } catch (error) {
    const endedAt = performance.now();
    return {
      scenario: scenario.name,
      method: scenario.method,
      path: scenario.path,
      statusCode: 0,
      ok: false,
      latencyMs: endedAt - startedAt,
      ttfbMs: endedAt - startedAt,
      bytes: 0,
      startedAtMs,
      error: error.message,
    };
  }
}

function request({ method, url, body, multipart, headers = {} }) {
  const parsed = new URL(url);
  const multipartPayload = multipart ? buildMultipartPayload(multipart) : null;
  const payload = multipartPayload?.body ?? (body ? Buffer.from(JSON.stringify(body)) : null);
  const transport = parsed.protocol === "https:" ? https : http;
  const startedAt = performance.now();

  return new Promise((resolvePromise, reject) => {
    const req = transport.request(
      {
        method,
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        headers: {
          Accept: "application/json",
          ...headers,
          ...(multipartPayload
            ? {
                "Content-Type": `multipart/form-data; boundary=${multipartPayload.boundary}`,
                "Content-Length": payload.length,
              }
            : {}),
          ...(payload
          && !multipartPayload
            ? {
                "Content-Type": "application/json",
                "Content-Length": payload.length,
              }
            : {}),
        },
      },
      (res) => {
        const firstByteAt = performance.now();
        let bytes = 0;
        res.on("data", (chunk) => {
          bytes += chunk.length;
        });
        res.on("end", () => {
          resolvePromise({
            statusCode: res.statusCode ?? 0,
            ttfbMs: firstByteAt - startedAt,
            bytes,
          });
        });
      },
    );
    req.setTimeout(10_000, () => req.destroy(new Error("request timed out")));
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function buildMultipartPayload(file) {
  const boundary = `bench-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const chunks = [
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"\r\n` +
        `Content-Type: ${file.contentType}\r\n\r\n`,
    ),
    Buffer.from(file.content),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ];
  return { boundary, body: Buffer.concat(chunks) };
}

function buildReport(samples, options) {
  const durationSeconds = options.durationMs / 1000;
  const scenarioReports = Object.fromEntries(
    DEFAULT_SCENARIOS.map((scenario) => {
      const scenarioSamples = samples.filter((sample) => sample.scenario === scenario.name);
      return [scenario.name, summarize(scenarioSamples, durationSeconds)];
    }),
  );

  return {
    generatedAt: new Date().toISOString(),
    options: {
      durationSeconds,
      warmupSeconds: options.warmupMs / 1000,
      concurrency: options.concurrency,
      thresholds: options.thresholds,
    },
    summary: summarize(samples, durationSeconds),
    scenarios: scenarioReports,
  };
}

function summarize(samples, durationSeconds) {
  const count = samples.length;
  const failures = samples.filter((sample) => !sample.ok).length;
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfb = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const peakRps = calculatePeakRps(samples);
  return {
    requests: count,
    failures,
    errorRate: count ? failures / count : 1,
    sustainedRps: count / durationSeconds,
    peakRps,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    ttfbP50Ms: percentile(ttfb, 50),
    ttfbP95Ms: percentile(ttfb, 95),
  };
}

function calculatePeakRps(samples) {
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor(sample.startedAtMs / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Math.max(0, ...buckets.values());
}

function percentile(sortedValues, percentileValue) {
  if (!sortedValues.length) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.ceil((percentileValue / 100) * sortedValues.length) - 1,
  );
  return Number(sortedValues[index].toFixed(2));
}

function renderConsole(report) {
  return [
    "API benchmark complete",
    `Requests: ${report.summary.requests}`,
    `Sustained RPS: ${report.summary.sustainedRps.toFixed(2)}`,
    `Peak RPS: ${report.summary.peakRps.toFixed(2)}`,
    `p95: ${report.summary.p95Ms.toFixed(2)} ms`,
    `p99: ${report.summary.p99Ms.toFixed(2)} ms`,
    `TTFB p95: ${report.summary.ttfbP95Ms.toFixed(2)} ms`,
    `Error rate: ${(report.summary.errorRate * 100).toFixed(2)}%`,
  ].join("\n");
}

async function loadThresholds(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return {
      maxErrorRate: 0.02,
      maxP99Ms: 1000,
    };
  }
}

function createBenchmarkToken() {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      sub: "benchmark-user",
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", options.jwtSecret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function renderMarkdown(report) {
  const rows = Object.entries(report.scenarios)
    .map(
      ([name, summary]) =>
        `| ${name} | ${summary.requests} | ${summary.sustainedRps.toFixed(2)} | ${summary.peakRps.toFixed(2)} | ${summary.p50Ms} | ${summary.p95Ms} | ${summary.p99Ms} | ${summary.ttfbP95Ms} | ${(summary.errorRate * 100).toFixed(2)}% |`,
    )
    .join("\n");

  return `# API Benchmark Results

Generated: ${report.generatedAt}

## Summary

| Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Error rate |
|---:|---:|---:|---:|---:|---:|---:|---:|
| ${report.summary.requests} | ${report.summary.sustainedRps.toFixed(2)} | ${report.summary.peakRps.toFixed(2)} | ${report.summary.p50Ms} | ${report.summary.p95Ms} | ${report.summary.p99Ms} | ${report.summary.ttfbP95Ms} | ${(report.summary.errorRate * 100).toFixed(2)}% |

## Scenario Breakdown

| Scenario | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Error rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
${rows}
`;
}

async function writeJson(path, value) {
  await writeFileEnsured(path, JSON.stringify(value, null, 2), "utf8");
}

async function writeFileEnsured(path, contents, encoding) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, encoding);
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
