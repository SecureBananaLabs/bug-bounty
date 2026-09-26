import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { BENCHMARK_ENDPOINTS } from "./endpoints.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke");
const listOnly = args.has("--list");
const noWriteResults = args.has("--no-write-results");
const failOnThreshold = !args.has("--no-thresholds");

const config = {
  targetUrl: process.env.BENCHMARK_TARGET_URL,
  concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? (isSmoke ? 1 : 4)),
  durationMs: Number(process.env.BENCHMARK_DURATION_MS ?? (isSmoke ? 350 : 1500)),
  warmupRequests: Number(process.env.BENCHMARK_WARMUP_REQUESTS ?? (isSmoke ? 1 : 3)),
  benchmarkToken: process.env.BENCHMARK_AUTH_TOKEN
};

let createApp;
let signAccessToken;

if (listOnly) {
  console.table(BENCHMARK_ENDPOINTS.map(({ name, method, path, auth }) => ({
    name,
    method,
    path,
    auth: Boolean(auth)
  })));
  process.exit(0);
}

function percentile(values, rank) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((rank / 100) * sorted.length) - 1);
  return sorted[index];
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

async function startLocalServer() {
  process.env.NODE_ENV = process.env.NODE_ENV ?? "benchmark";
  ({ createApp } = await import("../apps/api/src/app.js"));
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

function buildRequest(endpoint, baseUrl, iteration, authToken) {
  const target = new URL(endpoint.path, baseUrl);
  const payload = endpoint.payload?.(iteration) ?? {};
  const headers = {
    "user-agent": "freelanceflow-api-benchmark/1.0",
    ...payload.headers
  };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  return {
    url: target,
    options: {
      method: endpoint.method,
      headers
    },
    body: payload.body
  };
}

function sendRequest(requestConfig) {
  const transport = requestConfig.url.protocol === "https:" ? https : http;
  const startedAt = performance.now();

  return new Promise((resolve) => {
    const req = transport.request(requestConfig.url, requestConfig.options, (res) => {
      const firstByteAt = performance.now();
      res.resume();
      res.on("end", () => {
        const completedAt = performance.now();
        resolve({
          status: res.statusCode ?? 0,
          ttfbMs: firstByteAt - startedAt,
          latencyMs: completedAt - startedAt,
          completedAt,
          ok: (res.statusCode ?? 500) < 400
        });
      });
    });

    req.setTimeout(10_000, () => {
      req.destroy(new Error("request timeout"));
    });

    req.on("error", () => {
      const completedAt = performance.now();
      resolve({
        status: 0,
        ttfbMs: completedAt - startedAt,
        latencyMs: completedAt - startedAt,
        completedAt,
        ok: false
      });
    });

    if (requestConfig.body) {
      req.write(requestConfig.body);
    }
    req.end();
  });
}

async function runWarmup(endpoint, baseUrl, authToken) {
  for (let i = 0; i < config.warmupRequests; i += 1) {
    await sendRequest(buildRequest(endpoint, baseUrl, i, authToken));
  }
}

async function runEndpoint(endpoint, baseUrl, authToken) {
  await runWarmup(endpoint, baseUrl, authToken);

  const startedAt = performance.now();
  const deadline = startedAt + config.durationMs;
  const samples = [];
  let iteration = 0;

  async function worker(workerId) {
    while (performance.now() < deadline) {
      const request = buildRequest(endpoint, baseUrl, iteration + workerId, authToken);
      iteration += 1;
      const result = await sendRequest(request);
      samples.push({ ...result, completedBucket: Math.floor((result.completedAt - startedAt) / 1000) });
    }
  }

  await Promise.all(Array.from({ length: config.concurrency }, (_, workerId) => worker(workerId)));

  const elapsedMs = performance.now() - startedAt;
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfbs = samples.map((sample) => sample.ttfbMs);
  const errors = samples.filter((sample) => !sample.ok).length;
  const perSecond = new Map();

  for (const sample of samples) {
    perSecond.set(sample.completedBucket, (perSecond.get(sample.completedBucket) ?? 0) + 1);
  }

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    requests: samples.length,
    errors,
    errorRatePct: samples.length ? round((errors / samples.length) * 100) : 100,
    rps: {
      sustained: round(samples.length / (elapsedMs / 1000)),
      peak: Math.max(0, ...perSecond.values())
    },
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99)),
      max: round(Math.max(0, ...latencies))
    },
    ttfbMs: {
      p50: round(percentile(ttfbs, 50)),
      p95: round(percentile(ttfbs, 95)),
      p99: round(percentile(ttfbs, 99))
    }
  };
}

async function loadThresholds() {
  const thresholdPath = path.join(__dirname, "thresholds.json");
  const raw = await fs.readFile(thresholdPath, "utf8");
  return JSON.parse(raw);
}

function evaluateThresholds(results, thresholds) {
  const failures = [];
  const defaults = thresholds.defaults ?? {};

  for (const result of results) {
    const endpointThresholds = thresholds.endpoints?.[result.name] ?? {};
    const maxP99Ms = endpointThresholds.p99Ms ?? defaults.p99Ms;
    const maxErrorRatePct = endpointThresholds.maxErrorRatePct ?? defaults.maxErrorRatePct;

    if (Number.isFinite(maxP99Ms) && result.latencyMs.p99 > maxP99Ms) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms exceeded ${maxP99Ms}ms`);
    }
    if (Number.isFinite(maxErrorRatePct) && result.errorRatePct > maxErrorRatePct) {
      failures.push(`${result.name} error rate ${result.errorRatePct}% exceeded ${maxErrorRatePct}%`);
    }
  }

  return failures;
}

function renderMarkdown(report) {
  const rows = report.results.map((result) => [
    result.name,
    `${result.method} ${result.path}`,
    result.requests,
    result.rps.sustained,
    result.rps.peak,
    result.latencyMs.p50,
    result.latencyMs.p95,
    result.latencyMs.p99,
    result.ttfbMs.p95,
    `${result.errorRatePct}%`
  ]);

  return [
    "# API Benchmark Summary",
    "",
    `Generated: ${report.generatedAt}`,
    `Target: ${report.targetUrl}`,
    `Mode: ${report.mode}`,
    `Concurrency: ${report.config.concurrency}`,
    `Duration per endpoint: ${report.config.durationMs}ms`,
    "",
    "| Endpoint | Route | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Error rate |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## Threshold Result",
    "",
    report.thresholdFailures.length
      ? report.thresholdFailures.map((failure) => `- FAIL: ${failure}`).join("\n")
      : "- PASS: all configured p99 latency and error-rate thresholds passed.",
    ""
  ].join("\n");
}

async function writeResults(report) {
  const resultsDir = path.join(__dirname, "results");
  await fs.mkdir(resultsDir, { recursive: true });
  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDir, `api-benchmark-${stamp}.json`);
  const markdownPath = path.join(resultsDir, "latest.md");

  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, renderMarkdown(report));

  return { jsonPath, markdownPath };
}

let localServer;

try {
  localServer = config.targetUrl ? null : await startLocalServer();
  const baseUrl = config.targetUrl ?? localServer.baseUrl;
  if (!config.benchmarkToken) {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "benchmark";
    ({ signAccessToken } = await import("../apps/api/src/utils/jwt.js"));
  }
  const authToken = config.benchmarkToken ?? signAccessToken({
    sub: "benchmark-admin",
    role: "admin",
    scope: "benchmark"
  });
  const thresholds = await loadThresholds();
  const results = [];

  for (const endpoint of BENCHMARK_ENDPOINTS) {
    process.stdout.write(`Benchmarking ${endpoint.method} ${endpoint.path}... `);
    const result = await runEndpoint(endpoint, baseUrl, authToken);
    results.push(result);
    process.stdout.write(`${result.requests} req, p99 ${result.latencyMs.p99}ms, errors ${result.errorRatePct}%\n`);
  }

  const thresholdFailures = evaluateThresholds(results, thresholds);
  const report = {
    generatedAt: new Date().toISOString(),
    targetUrl: baseUrl,
    mode: isSmoke ? "smoke" : "full",
    config,
    results,
    thresholdFailures
  };

  if (!noWriteResults) {
    const written = await writeResults(report);
    console.log(`Wrote JSON results to ${path.relative(repoRoot, written.jsonPath)}`);
    console.log(`Wrote Markdown summary to ${path.relative(repoRoot, written.markdownPath)}`);
  }

  if (thresholdFailures.length) {
    console.error("Benchmark threshold failures:");
    for (const failure of thresholdFailures) console.error(`- ${failure}`);
    if (failOnThreshold) process.exitCode = 1;
  }
} finally {
  await localServer?.close();
}
