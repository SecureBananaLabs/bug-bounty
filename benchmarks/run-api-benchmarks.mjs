import autocannon from "autocannon";
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { benchmarkEndpoints } from "./endpoints.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const thresholds = JSON.parse(
  await fs.readFile(path.join(repoRoot, "benchmarks", "thresholds.json"), "utf8")
);
const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const failOnThreshold = args.has("--fail-on-threshold");

await loadBenchmarkEnv();

const options = {
  connections: numberFromEnv("BENCHMARK_CONNECTIONS", smoke ? 1 : 4),
  duration: numberFromEnv("BENCHMARK_DURATION_SECONDS", smoke ? 1 : 10),
  requestsPerEndpoint: numberFromEnv("BENCHMARK_REQUESTS_PER_ENDPOINT", smoke ? 3 : 8),
  pipelining: numberFromEnv("BENCHMARK_PIPELINING", 1),
  resultsDir: process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results"
};

let server;
let baseUrl = process.env.BENCHMARK_TARGET_URL;

if (!baseUrl) {
  const app = createApp();
  server = await listen(app);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
}

const authToken =
  process.env.BENCHMARK_TOKEN ||
  signAccessToken({ sub: "usr_benchmark_admin", role: "admin", purpose: "benchmark" });

const results = [];

try {
  for (const endpoint of benchmarkEndpoints) {
    const requestOptions = buildRequest(endpoint, authToken);
    const url = new URL(endpoint.path, baseUrl).toString();
    const ttfbMs = await measureTtfb(url, requestOptions);

    const result = await autocannon({
      url,
      method: endpoint.method,
      connections: options.connections,
      duration: options.duration,
      amount: options.requestsPerEndpoint,
      pipelining: options.pipelining,
      headers: requestOptions.headers,
      body: requestOptions.body,
      timeout: 10,
      renderProgressBar: false
    });

    results.push(toEndpointResult(endpoint, result, ttfbMs));
  }
} finally {
  if (server) {
    await close(server);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  targetUrl: baseUrl,
  mode: smoke ? "smoke" : "full",
  options,
  thresholds,
  endpoints: results,
  summary: summarize(results)
};

const thresholdFailures = evaluateThresholds(results, thresholds);
const outputDir = path.resolve(repoRoot, options.resultsDir);
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "latest.md"), renderMarkdown(report, thresholdFailures));

console.log(renderConsoleSummary(report, thresholdFailures));

if (failOnThreshold && thresholdFailures.length > 0) {
  process.exitCode = 1;
}

async function loadBenchmarkEnv() {
  const envPath = path.join(repoRoot, "benchmarks", ".env.benchmark");

  try {
    const content = await fs.readFile(envPath, "utf8");

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;

      const [key, ...valueParts] = line.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").trim();
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function numberFromEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function listen(app) {
  return new Promise((resolve) => {
    const candidate = app.listen(0, "127.0.0.1", () => resolve(candidate));
  });
}

function close(candidate) {
  return new Promise((resolve, reject) => {
    candidate.close((error) => (error ? reject(error) : resolve()));
  });
}

function buildRequest(endpoint, authToken) {
  const headers = {};
  let body;

  if (endpoint.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (endpoint.multipart) {
    const boundary = `benchmark-${endpoint.id}`;
    body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${endpoint.multipart.fieldName}"; filename="${endpoint.multipart.filename}"`,
      `Content-Type: ${endpoint.multipart.contentType}`,
      "",
      endpoint.multipart.content,
      `--${boundary}--`,
      ""
    ].join("\r\n");

    headers["content-type"] = `multipart/form-data; boundary=${boundary}`;
  } else if (endpoint.body) {
    body = JSON.stringify(endpoint.body);
    headers["content-type"] = "application/json";
  }

  return { method: endpoint.method, headers, body };
}

function measureTtfb(url, requestOptions) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const client = url.startsWith("https:") ? https : http;
    const target = new URL(url);
    const req = client.request(
      target,
      {
        method: requestOptions.method,
        headers: requestOptions.headers,
        timeout: 5000
      },
      (res) => {
        const ttfbMs = performance.now() - startedAt;
        res.resume();
        res.on("end", () => resolve(round(ttfbMs)));
      }
    );

    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });

    if (requestOptions.body) {
      req.write(requestOptions.body);
    }

    req.end();
  });
}

function toEndpointResult(endpoint, result, ttfbMs) {
  const totalRequests = result.requests.total || 0;
  const errors = (result.errors || 0) + (result.timeouts || 0);
  const non2xx = result.non2xx || 0;

  return {
    id: endpoint.id,
    description: endpoint.description,
    method: endpoint.method,
    path: endpoint.path,
    requests: totalRequests,
    p50Ms: round(result.latency.p50),
    p95Ms: round(result.latency.p95 ?? result.latency.p97_5 ?? result.latency.p90),
    p99Ms: round(result.latency.p99),
    averageRps: round(result.requests.average),
    peakRps: round(result.requests.max),
    errors,
    errorRate: totalRequests > 0 ? round(errors / totalRequests) : 0,
    non2xx,
    ttfbMs
  };
}

function summarize(results) {
  const totalRequests = results.reduce((sum, result) => sum + result.requests, 0);
  const totalErrors = results.reduce((sum, result) => sum + result.errors, 0);
  const totalNon2xx = results.reduce((sum, result) => sum + result.non2xx, 0);
  const highestP99 = Math.max(...results.map((result) => result.p99Ms));

  return {
    endpointCount: results.length,
    totalRequests,
    totalErrors,
    totalNon2xx,
    highestP99Ms: highestP99
  };
}

function evaluateThresholds(results, config) {
  const failures = [];

  for (const result of results) {
    const endpointThreshold = {
      ...config.defaults,
      ...(config.endpoints[result.id] ?? {})
    };

    if (result.p99Ms > endpointThreshold.p99Ms) {
      failures.push(`${result.id} p99 ${result.p99Ms}ms > ${endpointThreshold.p99Ms}ms`);
    }

    if (result.errorRate > endpointThreshold.errorRate) {
      failures.push(`${result.id} errorRate ${result.errorRate} > ${endpointThreshold.errorRate}`);
    }

    if (result.non2xx > endpointThreshold.non2xx) {
      failures.push(`${result.id} non2xx ${result.non2xx} > ${endpointThreshold.non2xx}`);
    }
  }

  return failures;
}

function renderMarkdown(report, thresholdFailures) {
  const rows = report.endpoints
    .map((endpoint) =>
      [
        endpoint.id,
        `${endpoint.method} ${endpoint.path}`,
        endpoint.requests,
        endpoint.p50Ms,
        endpoint.p95Ms,
        endpoint.p99Ms,
        endpoint.averageRps,
        endpoint.peakRps,
        endpoint.errorRate,
        endpoint.non2xx,
        endpoint.ttfbMs ?? "n/a"
      ].join(" | ")
    )
    .join("\n");

  const failures =
    thresholdFailures.length === 0
      ? "No threshold failures."
      : thresholdFailures.map((failure) => `- ${failure}`).join("\n");

  return `# API Benchmark Summary

- Generated: ${report.generatedAt}
- Target: ${report.targetUrl}
- Mode: ${report.mode}
- Connections: ${report.options.connections}
- Duration per endpoint: ${report.options.duration}s
- Request cap per endpoint: ${report.options.requestsPerEndpoint}
- Endpoints covered: ${report.summary.endpointCount}
- Total requests: ${report.summary.totalRequests}
- Total errors: ${report.summary.totalErrors}
- Total non-2xx: ${report.summary.totalNon2xx}
- Highest p99: ${report.summary.highestP99Ms}ms

## Thresholds

${failures}

## Endpoint Results

Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | Avg RPS | Peak RPS | Error rate | Non-2xx | TTFB ms
--- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---:
${rows}
`;
}

function renderConsoleSummary(report, thresholdFailures) {
  return [
    `Benchmarked ${report.summary.endpointCount} endpoints against ${report.targetUrl}`,
    `Total requests: ${report.summary.totalRequests}`,
    `Total errors: ${report.summary.totalErrors}`,
    `Total non-2xx: ${report.summary.totalNon2xx}`,
    `Highest p99: ${report.summary.highestP99Ms}ms`,
    `Threshold failures: ${thresholdFailures.length}`
  ].join("\n");
}

function round(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
