import autocannon from "autocannon";
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { performance } from "node:perf_hooks";

const ROOT = process.cwd();
const RESULTS_DIR = path.join(ROOT, "benchmarks", "results");
const ENDPOINTS_FILE = path.join(ROOT, "benchmarks", "endpoints.json");
const THRESHOLDS_FILE = path.join(ROOT, "benchmarks", "thresholds.json");
const ENV_FILE = path.join(ROOT, ".env.benchmark");

async function loadBenchmarkEnv() {
  try {
    const raw = await fs.readFile(ENV_FILE, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      process.env[key] ??= valueParts.join("=");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function normalizeBaseUrl(value) {
  return (value || "http://127.0.0.1:4000").replace(/\/$/, "");
}

function endpointHeaders(endpoint) {
  const headers = { accept: "application/json" };
  if (endpoint.body) headers["content-type"] = "application/json";
  if (endpoint.auth && process.env.BENCHMARK_TOKEN) {
    headers.authorization = `Bearer ${process.env.BENCHMARK_TOKEN}`;
  }
  return headers;
}

function endpointBody(endpoint) {
  if (!endpoint.body) return undefined;
  return JSON.stringify(endpoint.body);
}

function requestTtfb(url, endpoint) {
  return new Promise((resolve) => {
    const started = performance.now();
    const client = url.startsWith("https:") ? https : http;
    const req = client.request(
      url,
      {
        method: endpoint.method,
        headers: endpointHeaders(endpoint),
        timeout: 5000
      },
      (res) => {
        const ttfb = performance.now() - started;
        res.resume();
        res.on("end", () => resolve({ ttfb, statusCode: res.statusCode }));
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ ttfb: null, statusCode: 0, error: "timeout" });
    });
    req.on("error", (error) => resolve({ ttfb: null, statusCode: 0, error: error.message }));

    const body = endpointBody(endpoint);
    if (body) req.write(body);
    req.end();
  });
}

async function measureTtfb(url, endpoint) {
  const probes = [];
  for (let i = 0; i < 3; i += 1) {
    probes.push(await requestTtfb(url, endpoint));
  }
  const valid = probes.map((probe) => probe.ttfb).filter((value) => Number.isFinite(value));
  if (!valid.length) return { p50_ms: null, samples: probes };
  valid.sort((a, b) => a - b);
  return {
    p50_ms: Number(valid[Math.floor(valid.length / 2)].toFixed(2)),
    samples: probes
  };
}

async function runEndpoint(endpoint, options) {
  const url = `${options.baseUrl}${endpoint.path}`;
  const body = endpointBody(endpoint);
  const ttfb = await measureTtfb(url, endpoint);
  const result = await autocannon({
    url,
    method: endpoint.method,
    headers: endpointHeaders(endpoint),
    body,
    connections: options.connections,
    duration: options.durationSeconds,
    pipelining: 1,
    timeout: 10
  });

  const requestsTotal = result.requests.total || 0;
  const failures = (result.errors || 0) + (result.timeouts || 0) + (result.non2xx || 0);
  const errorRate = requestsTotal ? (failures / requestsTotal) * 100 : 100;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    auth: Boolean(endpoint.auth),
    status: {
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx,
      status_codes: result.statusCodeStats,
      error_rate_pct: Number(errorRate.toFixed(2))
    },
    latency_ms: {
      p50: result.latency.p50,
      p95: result.latency.p95,
      p99: result.latency.p99
    },
    requests_per_second: {
      average: result.requests.average,
      max: result.requests.max,
      total: result.requests.total
    },
    ttfb_ms: ttfb
  };
}

function thresholdFor(thresholds, endpointName) {
  return thresholds[endpointName] || thresholds.default || { p99_ms: 750, error_rate_pct: 5 };
}

function evaluateThresholds(results, thresholds) {
  return results.map((result) => {
    const threshold = thresholdFor(thresholds, result.name);
    const p99Ok = result.latency_ms.p99 <= threshold.p99_ms;
    const errorRateOk = result.status.error_rate_pct <= threshold.error_rate_pct;
    return {
      endpoint: result.name,
      ok: p99Ok && errorRateOk,
      p99_ms: result.latency_ms.p99,
      p99_threshold_ms: threshold.p99_ms,
      error_rate_pct: result.status.error_rate_pct,
      error_rate_threshold_pct: threshold.error_rate_pct
    };
  });
}

function markdownSummary(report) {
  const rows = report.results
    .map((result) => {
      const gate = report.gates.find((item) => item.endpoint === result.name);
      return [
        result.name,
        `${result.method} ${result.path}`,
        result.latency_ms.p50,
        result.latency_ms.p95,
        result.latency_ms.p99,
        result.requests_per_second.average,
        result.status.error_rate_pct,
        result.ttfb_ms.p50_ms ?? "n/a",
        gate?.ok ? "pass" : "fail"
      ].join(" | ");
    })
    .join("\n");

  return `# API Benchmark Summary

Generated: ${report.generated_at}

Base URL: \`${report.config.base_url}\`

Connections: ${report.config.connections}
Duration: ${report.config.duration_seconds}s
Smoke mode: ${report.config.smoke}

Endpoint | Route | p50 ms | p95 ms | p99 ms | Avg RPS | Error % | TTFB p50 ms | Gate
--- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---
${rows}
`;
}

await loadBenchmarkEnv();

const baseUrl = normalizeBaseUrl(process.env.BENCHMARK_BASE_URL);
const smoke = process.env.BENCHMARK_SMOKE === "1";
const connections = Number(process.env.BENCHMARK_CONNECTIONS || (smoke ? 1 : 10));
const durationSeconds = Number(process.env.BENCHMARK_DURATION_SECONDS || (smoke ? 3 : 10));

const [endpoints, thresholds] = await Promise.all([
  fs.readFile(ENDPOINTS_FILE, "utf8").then(JSON.parse),
  fs.readFile(THRESHOLDS_FILE, "utf8").then(JSON.parse)
]);

const results = [];
for (const endpoint of endpoints) {
  console.log(`Benchmarking ${endpoint.method} ${endpoint.path}`);
  results.push(await runEndpoint(endpoint, { baseUrl, connections, durationSeconds }));
}

const gates = evaluateThresholds(results, thresholds);
const report = {
  generated_at: new Date().toISOString(),
  config: {
    base_url: baseUrl,
    connections,
    duration_seconds: durationSeconds,
    smoke
  },
  gates,
  results
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(path.join(RESULTS_DIR, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.join(RESULTS_DIR, "latest.md"), markdownSummary(report));

if (gates.some((gate) => !gate.ok)) {
  console.error("Benchmark thresholds failed:");
  console.error(JSON.stringify(gates.filter((gate) => !gate.ok), null, 2));
  process.exitCode = 1;
}
