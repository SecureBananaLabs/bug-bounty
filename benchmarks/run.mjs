import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import autocannon from "autocannon";
import { buildBenchmarkEndpoints } from "./endpoints.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");

const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke") || process.env.BENCHMARK_SMOKE === "1";

await loadEnvFile(path.join(repoRoot, ".env.benchmark"));
await loadEnvFile(path.join(repoRoot, ".env.benchmark.local"));

const config = {
  mode: isSmoke ? "smoke" : "full",
  connections: intEnv("BENCHMARK_CONNECTIONS", isSmoke ? 1 : 5),
  amount: intEnv("BENCHMARK_AMOUNT", isSmoke ? 2 : 50),
  duration: intEnv("BENCHMARK_DURATION", 0),
  pipelining: intEnv("BENCHMARK_PIPELINING", 1),
  timeoutSeconds: intEnv("BENCHMARK_TIMEOUT_SECONDS", 10),
  ttfbSamples: intEnv("BENCHMARK_TTFB_SAMPLES", isSmoke ? 1 : 5)
};

let targetUrl = normalizeBaseUrl(process.env.BENCHMARK_TARGET_URL);
let localServer;

if (!targetUrl) {
  process.env.NODE_ENV ??= "benchmark";
  process.env.BENCHMARK_DISABLE_RATE_LIMIT ??= "1";
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  localServer = await listen(app);
  targetUrl = `http://127.0.0.1:${localServer.address().port}`;
}

const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
const authToken =
  process.env.BENCHMARK_AUTH_TOKEN ||
  signAccessToken({
    sub: "benchmark_agent",
    role: "admin",
    scope: "benchmark"
  });

const runId = Date.now();
const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
const endpoints = buildBenchmarkEndpoints({ authToken, runId });
const results = [];

try {
  for (const endpoint of endpoints) {
    const result = await benchmarkEndpoint(endpoint, targetUrl, config);
    results.push(result);
    const status = result.threshold.passed ? "PASS" : "FAIL";
    console.log(
      `${status} ${result.method} ${result.path} p99=${result.metrics.latency.p99Ms}ms errorRate=${result.metrics.errorRatePercent}%`
    );
  }
} finally {
  if (localServer) {
    await closeServer(localServer);
  }
}

const report = {
  metadata: {
    generatedAt: new Date().toISOString(),
    targetUrl,
    mode: config.mode,
    nodeVersion: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCores: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    rateLimitDisabled: process.env.BENCHMARK_DISABLE_RATE_LIMIT === "1"
  },
  config,
  thresholds,
  endpoints: results
};

await fs.mkdir(resultsDir, { recursive: true });
const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
const baseName = `benchmark-${config.mode}-${stamp}`;
const jsonPath = path.join(resultsDir, `${baseName}.json`);
const markdownPath = path.join(resultsDir, `${baseName}.md`);
const markdown = renderMarkdown(report);

await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(markdownPath, markdown);

console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
console.log(`Wrote ${path.relative(repoRoot, markdownPath)}`);
console.log(markdown);

const failures = results.filter((result) => !result.threshold.passed);
if (failures.length > 0) {
  console.error(`Benchmark threshold failures: ${failures.length}`);
  process.exitCode = 1;
}

async function benchmarkEndpoint(endpoint, baseUrl, runConfig) {
  const url = new URL(endpoint.path, baseUrl).toString();
  const options = {
    url,
    method: endpoint.method,
    headers: endpoint.headers ?? {},
    body: endpoint.body,
    connections: runConfig.connections,
    pipelining: runConfig.pipelining,
    timeout: runConfig.timeoutSeconds,
    renderProgressBar: false,
    renderResultsTable: false,
    renderLatencyTable: false,
    renderStatusCodes: false
  };

  if (runConfig.duration > 0) {
    options.duration = runConfig.duration;
  } else {
    options.amount = runConfig.amount;
  }

  const raw = await autocannon(options);
  const ttfb = await measureTtfb(endpoint, baseUrl, runConfig);
  const metrics = normalizeAutocannonResult(raw, ttfb);
  const threshold = evaluateThreshold(endpoint, metrics);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    protected: Boolean(endpoint.protected),
    payloadBytes: endpoint.body ? Buffer.byteLength(endpoint.body) : 0,
    metrics,
    threshold,
    statusCodeStats: raw.statusCodeStats ?? {},
    raw: {
      durationSeconds: raw.duration,
      requests: raw.requests,
      latency: raw.latency,
      errors: raw.errors,
      timeouts: raw.timeouts,
      non2xx: raw.non2xx
    }
  };
}

function normalizeAutocannonResult(raw, ttfb) {
  const totalRequests = raw.requests?.total ?? 0;
  const failedRequests = (raw.errors ?? 0) + (raw.timeouts ?? 0) + (raw.non2xx ?? 0);
  const errorRatePercent = totalRequests === 0 ? 100 : (failedRequests / totalRequests) * 100;

  return {
    totalRequests,
    latency: {
      p50Ms: round(raw.latency?.p50 ?? 0),
      p95Ms: round(raw.latency?.p95 ?? raw.latency?.p97_5 ?? 0),
      p95Source: raw.latency?.p95 === undefined ? "autocannon.p97_5" : "autocannon.p95",
      p99Ms: round(raw.latency?.p99 ?? 0),
      averageMs: round(raw.latency?.average ?? 0),
      maxMs: round(raw.latency?.max ?? 0)
    },
    requestsPerSecond: {
      sustained: round(raw.requests?.average ?? 0),
      peak: round(raw.requests?.max ?? 0)
    },
    errorRatePercent: round(errorRatePercent),
    failedRequests,
    ttfb: {
      samples: ttfb.samples,
      p50Ms: percentile(ttfb.samples, 50),
      p95Ms: percentile(ttfb.samples, 95),
      p99Ms: percentile(ttfb.samples, 99),
      averageMs: average(ttfb.samples),
      maxMs: ttfb.samples.length ? round(Math.max(...ttfb.samples)) : 0
    }
  };
}

function evaluateThreshold(endpoint, metrics) {
  const key = `${endpoint.method} ${endpoint.path.split("?")[0]}`;
  const endpointThreshold = thresholds.endpoints?.[key] ?? {};
  const active = {
    p99LatencyMs: endpointThreshold.p99LatencyMs ?? thresholds.defaults.p99LatencyMs,
    errorRatePercent: endpointThreshold.errorRatePercent ?? thresholds.defaults.errorRatePercent
  };
  const failures = [];

  if (metrics.latency.p99Ms > active.p99LatencyMs) {
    failures.push(`p99 ${metrics.latency.p99Ms}ms > ${active.p99LatencyMs}ms`);
  }
  if (metrics.errorRatePercent > active.errorRatePercent) {
    failures.push(`error rate ${metrics.errorRatePercent}% > ${active.errorRatePercent}%`);
  }

  return {
    key,
    active,
    passed: failures.length === 0,
    failures
  };
}

async function measureTtfb(endpoint, baseUrl, runConfig) {
  const samples = [];
  for (let i = 0; i < runConfig.ttfbSamples; i += 1) {
    samples.push(await singleTtfbRequest(endpoint, baseUrl, runConfig.timeoutSeconds));
  }
  return { samples };
}

function singleTtfbRequest(endpoint, baseUrl, timeoutSeconds) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.path, baseUrl);
    const transport = url.protocol === "https:" ? https : http;
    const body = endpoint.body ?? "";
    const headers = {
      ...(endpoint.headers ?? {})
    };

    if (body && !hasHeader(headers, "content-length")) {
      headers["content-length"] = Buffer.byteLength(body);
    }

    const started = performance.now();
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: endpoint.method,
        headers,
        timeout: timeoutSeconds * 1000
      },
      (response) => {
        const elapsed = performance.now() - started;
        response.resume();
        response.on("end", () => resolve(round(elapsed)));
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error(`TTFB request timed out after ${timeoutSeconds}s`));
    });
    request.on("error", reject);

    if (body) {
      request.write(body);
    }
    request.end();
  });
}

function renderMarkdown(report) {
  const rows = report.endpoints.map((endpoint) => {
    const metric = endpoint.metrics;
    return [
      `${endpoint.method} ${endpoint.path}`,
      endpoint.threshold.passed ? "pass" : "fail",
      metric.latency.p50Ms,
      metric.latency.p95Ms,
      metric.latency.p99Ms,
      metric.requestsPerSecond.sustained,
      metric.requestsPerSecond.peak,
      metric.errorRatePercent,
      metric.ttfb.p95Ms,
      renderStatusCodes(endpoint.statusCodeStats)
    ];
  });

  const failed = report.endpoints.filter((endpoint) => !endpoint.threshold.passed);
  const lines = [
    `# API Benchmark Report`,
    "",
    `Generated: ${report.metadata.generatedAt}`,
    `Target: ${report.metadata.targetUrl}`,
    `Mode: ${report.metadata.mode}`,
    `Node: ${report.metadata.nodeVersion}`,
    `Host: ${report.metadata.platform}, ${report.metadata.logicalCores} logical cores, ${Math.round(report.metadata.totalMemoryBytes / 1024 / 1024 / 1024)} GiB RAM`,
    `Rate limit disabled: ${report.metadata.rateLimitDisabled ? "yes" : "no"}`,
    "",
    "| Endpoint | Gate | p50 ms | p95 ms | p99 ms | Sustained RPS | Peak RPS | Error % | TTFB p95 ms | Statuses |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    failed.length === 0 ? "All benchmark thresholds passed." : `${failed.length} benchmark thresholds failed.`
  ];

  if (failed.length > 0) {
    lines.push("");
    lines.push("## Threshold Failures");
    for (const endpoint of failed) {
      lines.push(`- ${endpoint.method} ${endpoint.path}: ${endpoint.threshold.failures.join(", ")}`);
    }
  }

  lines.push("");
  return `${lines.join("\n")}`;
}

function renderStatusCodes(statusCodeStats) {
  const entries = Object.entries(statusCodeStats ?? {});
  if (entries.length === 0) {
    return "n/a";
  }
  return entries
    .map(([status, value]) => {
      const count = typeof value === "object" && value !== null ? value.count : value;
      return `${status}: ${count}`;
    })
    .join(", ");
}

async function loadEnvFile(filePath) {
  let content;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function intEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeBaseUrl(value) {
  if (!value) {
    return "";
  }
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function hasHeader(headers, name) {
  return Object.keys(headers).some((key) => key.toLowerCase() === name.toLowerCase());
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return round(sorted[Math.max(0, Math.min(sorted.length - 1, index))]);
}

function round(value) {
  return Number(value.toFixed(2));
}
