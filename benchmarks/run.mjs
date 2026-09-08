import autocannon from "autocannon";
import jwt from "jsonwebtoken";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

await loadEnvFile(path.join(repoRoot, ".env.benchmark"));

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const failOnThreshold = args.has("--fail-on-threshold");
const endpointsPath = path.join(__dirname, "endpoints.json");
const thresholdsPath = path.join(__dirname, "thresholds.json");

const endpoints = JSON.parse(await fs.readFile(endpointsPath, "utf8"));
const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
const outputDir = path.resolve(repoRoot, process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results");

let server;
let baseUrl = getFlagValue("--base-url") ?? process.env.BENCHMARK_TARGET_URL;

if (!baseUrl) {
  process.env.BENCHMARK_DISABLE_RATE_LIMIT ??= "true";
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  server = await listen(app, Number(process.env.BENCHMARK_PORT ?? 0));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
}

const config = {
  baseUrl: stripTrailingSlash(baseUrl),
  duration: Number(getFlagValue("--duration") ?? process.env.BENCHMARK_DURATION ?? (smoke ? 3 : 10)),
  connections: Number(getFlagValue("--connections") ?? process.env.BENCHMARK_CONNECTIONS ?? (smoke ? 2 : 20)),
  pipelining: Number(getFlagValue("--pipelining") ?? process.env.BENCHMARK_PIPELINING ?? 1)
};

const authToken = process.env.BENCHMARK_AUTH_TOKEN || jwt.sign(
  { sub: "benchmark-user", role: "admin", purpose: "api-benchmark" },
  process.env.BENCHMARK_JWT_SECRET ?? process.env.JWT_SECRET ?? "development-secret",
  { expiresIn: "1h" }
);

const startedAt = new Date();
const results = [];

try {
  for (const endpoint of endpoints) {
    results.push(await runEndpoint(endpoint));
  }
} finally {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

const report = buildReport(results);
await fs.mkdir(outputDir, { recursive: true });
const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
const jsonPath = path.join(outputDir, `benchmark-${stamp}.json`);
const mdPath = path.join(outputDir, `benchmark-${stamp}.md`);
await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
await fs.writeFile(mdPath, toMarkdown(report));

console.log(`Benchmark complete: ${jsonPath}`);
console.log(`Markdown summary: ${mdPath}`);

const failures = results.flatMap((result) => result.thresholdFailures);
if (failures.length > 0) {
  console.error("Threshold failures:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}

async function runEndpoint(endpoint) {
  const request = buildRequest(endpoint);
  const result = await autocannon({
    url: `${config.baseUrl}${endpoint.path}`,
    method: endpoint.method,
    duration: config.duration,
    connections: config.connections,
    pipelining: config.pipelining,
    headers: request.headers,
    body: request.body
  });

  const totalRequests = result.requests.total || 0;
  const failedRequests = (result.errors || 0) + (result.timeouts || 0) + (result.non2xx || 0);
  const summary = {
    id: endpoint.id,
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    totalRequests,
    sustainedRps: round(result.requests.average),
    peakRps: round(result.requests.max ?? result.requests.average),
    p50LatencyMs: round(result.latency.p50),
    p95LatencyMs: round(result.latency.p95),
    p99LatencyMs: round(result.latency.p99),
    ttfbP50Ms: round(result.latency.p50),
    ttfbP95Ms: round(result.latency.p95),
    ttfbP99Ms: round(result.latency.p99),
    errorRatePercent: totalRequests === 0 ? 100 : round((failedRequests / totalRequests) * 100, 4),
    errors: result.errors || 0,
    timeouts: result.timeouts || 0,
    non2xx: result.non2xx || 0
  };

  summary.thresholdFailures = evaluateThresholds(summary);
  return summary;
}

function buildRequest(endpoint) {
  const headers = {};
  let body;

  if (endpoint.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (endpoint.multipart) {
    const boundary = `benchmark-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    headers["content-type"] = `multipart/form-data; boundary=${boundary}`;
    body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${endpoint.multipart.field}"; filename="${endpoint.multipart.filename}"`,
      `Content-Type: ${endpoint.multipart.contentType}`,
      "",
      endpoint.multipart.content,
      `--${boundary}--`,
      ""
    ].join("\r\n");
  } else if (endpoint.payload !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.payload);
  }

  return { headers, body };
}

function evaluateThresholds(result) {
  const limit = {
    ...thresholds.defaults,
    ...(thresholds.endpoints?.[result.id] ?? {})
  };
  const failures = [];

  if (result.p99LatencyMs > limit.p99Ms) {
    failures.push(`${result.id}: p99 ${result.p99LatencyMs}ms exceeds ${limit.p99Ms}ms`);
  }
  if (result.errorRatePercent > limit.errorRatePercent) {
    failures.push(`${result.id}: error rate ${result.errorRatePercent}% exceeds ${limit.errorRatePercent}%`);
  }

  return failures;
}

function buildReport(endpointResults) {
  return {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    config,
    environment: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus().map((cpu) => cpu.model),
      cpuCount: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem(),
      nodeVersion: process.version,
      network: config.baseUrl.startsWith("http://127.0.0.1") ? "loopback" : "external target"
    },
    results: endpointResults
  };
}

function toMarkdown(report) {
  const rows = report.results.map((result) => [
    result.id,
    `${result.method} ${result.path}`,
    result.totalRequests,
    result.sustainedRps,
    result.peakRps,
    result.p50LatencyMs,
    result.p95LatencyMs,
    result.p99LatencyMs,
    result.errorRatePercent,
    result.thresholdFailures.length ? result.thresholdFailures.join("<br>") : "pass"
  ]);

  return [
    "# API Benchmark Summary",
    "",
    `- Started: ${report.startedAt}`,
    `- Finished: ${report.finishedAt}`,
    `- Target: ${report.config.baseUrl}`,
    `- Duration per endpoint: ${report.config.duration}s`,
    `- Connections: ${report.config.connections}`,
    `- Pipelining: ${report.config.pipelining}`,
    `- OS: ${report.environment.platform} ${report.environment.release} ${report.environment.arch}`,
    `- CPU: ${report.environment.cpuCount} cores, ${report.environment.cpus[0] ?? "unknown"}`,
    `- RAM: ${Math.round(report.environment.totalMemoryBytes / 1024 / 1024)} MB total`,
    `- Node.js: ${report.environment.nodeVersion}`,
    `- Network: ${report.environment.network}`,
    "",
    "| Endpoint | Route | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | Error % | Gate |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    ""
  ].join("\n");
}

function loadEnvFile(envPath) {
  return fs.readFile(envPath, "utf8")
    .then((content) => {
      for (const line of content.split(/\r?\n/)) {
        if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
        const [rawKey, ...rawValue] = line.split("=");
        const key = rawKey.trim();
        if (!key || process.env[key] !== undefined) continue;
        process.env[key] = rawValue.join("=").trim();
      }
    })
    .catch(() => {});
}

function getFlagValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function listen(app, port) {
  return new Promise((resolve) => {
    const localServer = app.listen(port, () => resolve(localServer));
  });
}

function round(value, digits = 2) {
  return typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

function stripTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
