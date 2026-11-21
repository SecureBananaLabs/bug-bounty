import autocannon from "autocannon";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const endpointsPath = path.join(__dirname, "endpoints.json");
const thresholdsPath = path.join(__dirname, "thresholds.json");

loadEnvFile(path.join(repoRoot, ".env.benchmark"));

const args = new Set(process.argv.slice(2));
const smokeMode = args.has("--smoke") || process.env.BENCHMARK_MODE === "smoke";
const failOnThreshold =
  args.has("--fail-on-threshold") ||
  process.env.BENCHMARK_FAIL_ON_THRESHOLD === "true";
const shouldStartServer = process.env.BENCHMARK_START_SERVER !== "false";
const isolateManagedEndpoints = process.env.BENCHMARK_ISOLATE_ENDPOINTS !== "false";

if (shouldStartServer && !process.env.BENCHMARK_DISABLE_RATE_LIMIT) {
  process.env.BENCHMARK_DISABLE_RATE_LIMIT = "true";
}
const requestCount = numberFromEnv("BENCHMARK_REQUESTS_PER_ENDPOINT", smokeMode ? 10 : 100);
const latencySampleCount = numberFromEnv(
  "BENCHMARK_LATENCY_SAMPLES",
  smokeMode ? 10 : Math.min(50, requestCount)
);
const connections = numberFromEnv("BENCHMARK_CONNECTIONS", smokeMode ? 1 : 5);
const pipelining = numberFromEnv("BENCHMARK_PIPELINING", 1);
const configuredBaseUrl = trimTrailingSlash(
  process.env.BENCHMARK_BASE_URL || "http://127.0.0.1:4000"
);
const resultsDir = path.resolve(
  repoRoot,
  process.env.BENCHMARK_RESULTS_DIR || "benchmarks/results"
);

const endpoints = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));
const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf8"));

fs.mkdirSync(resultsDir, { recursive: true });

const runStartedAt = new Date();
const runId = runStartedAt.toISOString().replace(/[:.]/g, "-");
const results = [];
let sharedServer;
let sharedBaseUrl = configuredBaseUrl;

try {
  if (shouldStartServer && !isolateManagedEndpoints) {
    const serverContext = await startServer();
    sharedServer = serverContext.server;
    sharedBaseUrl = serverContext.baseUrl;
  }

  for (const endpoint of endpoints) {
    let endpointServer;
    let endpointBaseUrl = sharedBaseUrl;

    if (shouldStartServer && isolateManagedEndpoints) {
      const serverContext = await startServer();
      endpointServer = serverContext.server;
      endpointBaseUrl = serverContext.baseUrl;
    }

    const authToken = await resolveAuthToken(endpointBaseUrl);
    const result = await runEndpoint(endpointBaseUrl, endpoint, authToken);
    results.push(result);
    console.log(
      `${result.name}: p99=${result.latency.p99Ms}ms rps=${result.requestsPerSecond.average} errors=${result.errorRatePercent}%`
    );

    if (endpointServer) {
      await closeServer(endpointServer);
    }
  }
} finally {
  if (sharedServer) {
    await closeServer(sharedServer);
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  mode: smokeMode ? "smoke" : "full",
  baseUrl: shouldStartServer ? "managed local API server" : sharedBaseUrl,
  isolatedManagedEndpoints: shouldStartServer && isolateManagedEndpoints,
  requestsPerEndpoint: requestCount,
  latencySamplesPerEndpoint: latencySampleCount,
  connections,
  pipelining,
  endpointCount: endpoints.length,
  results
};

const jsonPath = path.join(resultsDir, `api-benchmark-${runId}.json`);
const markdownPath = path.join(resultsDir, `api-benchmark-${runId}.md`);
fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(markdownPath, renderMarkdown(summary));

console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
console.log(`Wrote ${path.relative(repoRoot, markdownPath)}`);

const thresholdFailures = results.filter((result) => {
  const endpointThreshold =
    thresholds.endpoints?.[result.name]?.p99Ms ?? thresholds.defaultP99Ms;
  return result.latency.p99Ms > endpointThreshold;
});

if (thresholdFailures.length > 0) {
  console.warn("P99 threshold failures:");
  for (const failure of thresholdFailures) {
    const endpointThreshold =
      thresholds.endpoints?.[failure.name]?.p99Ms ?? thresholds.defaultP99Ms;
    console.warn(`- ${failure.name}: ${failure.latency.p99Ms}ms > ${endpointThreshold}ms`);
  }
  if (failOnThreshold) {
    process.exitCode = 1;
  }
}

async function runEndpoint(baseUrl, endpoint, authToken) {
  const url = `${baseUrl}${endpoint.path}`;
  const request = buildRequest(endpoint, authToken);

  const autocannonResult = await new Promise((resolve, reject) => {
    autocannon(
      {
        url,
        method: endpoint.method,
        connections,
        pipelining,
        amount: requestCount,
        headers: request.headers,
        body: request.body
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });

  const latencySample = await measureLatencySamples(url, endpoint, authToken);
  const ttfbMs = await measureTtfb(url, endpoint, authToken);
  const totalRequests = autocannonResult.requests.total || 0;
  const failedRequests =
    (autocannonResult.non2xx || 0) +
    (autocannonResult.errors || 0) +
    (autocannonResult.timeouts || 0);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    latency: {
      p50Ms: latencySample.p50Ms,
      p95Ms: latencySample.p95Ms,
      p99Ms: latencySample.p99Ms
    },
    requestsPerSecond: {
      average: round(autocannonResult.requests.average),
      peak: round(autocannonResult.requests.max)
    },
    errorRatePercent: round(totalRequests === 0 ? 0 : (failedRequests / totalRequests) * 100),
    ttfbMs: round(ttfbMs),
    totals: {
      requests: totalRequests,
      non2xx: autocannonResult.non2xx || 0,
      errors: autocannonResult.errors || 0,
      timeouts: autocannonResult.timeouts || 0
    }
  };
}

async function measureLatencySamples(url, endpoint, authToken) {
  const samples = [];
  const workerCount = Math.min(connections, latencySampleCount);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < latencySampleCount) {
        nextIndex += 1;
        const request = buildRequest(endpoint, authToken);
        const started = performance.now();
        const response = await fetch(url, {
          method: endpoint.method,
          headers: request.headers,
          body: request.body
        });
        await response.arrayBuffer();
        samples.push(performance.now() - started);
      }
    })
  );

  samples.sort((left, right) => left - right);

  return {
    p50Ms: round(percentile(samples, 50)),
    p95Ms: round(percentile(samples, 95)),
    p99Ms: round(percentile(samples, 99))
  };
}

function buildRequest(endpoint, authToken) {
  const headers = { ...(endpoint.headers || {}) };
  let body;

  if (endpoint.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (endpoint.multipart) {
    const boundary = "----freelanceflow-benchmark";
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
  } else if (endpoint.body) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.body);
  }

  return { headers, body };
}

async function measureTtfb(url, endpoint, authToken) {
  const request = buildRequest(endpoint, authToken);
  const started = performance.now();
  const response = await fetch(url, {
    method: endpoint.method,
    headers: request.headers,
    body: request.body
  });
  await response.arrayBuffer();
  return performance.now() - started;
}

async function resolveAuthToken(baseUrl) {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "bench-admin@example.com",
      password: "benchmark-password"
    })
  });

  if (!response.ok) {
    throw new Error(`Could not create benchmark auth token: HTTP ${response.status}`);
  }

  const payload = await response.json();
  return payload.data?.token ?? payload.token;
}

async function startServer() {
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function renderMarkdown(summary) {
  const lines = [
    "# API Benchmark Results",
    "",
    `- Generated: ${summary.generatedAt}`,
    `- Mode: ${summary.mode}`,
    `- Base URL: ${summary.baseUrl}`,
    `- Requests per endpoint: ${summary.requestsPerEndpoint}`,
    `- Connections: ${summary.connections}`,
    `- Pipelining: ${summary.pipelining}`,
    "",
    "| Endpoint | Method | p50 ms | p95 ms | p99 ms | Avg RPS | Peak RPS | Error % | TTFB ms |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|"
  ];

  for (const result of summary.results) {
    lines.push(
      `| ${result.path} | ${result.method} | ${result.latency.p50Ms} | ${result.latency.p95Ms} | ${result.latency.p99Ms} | ${result.requestsPerSecond.average} | ${result.requestsPerSecond.peak} | ${result.errorRatePercent} | ${result.ttfbMs} |`
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function trimTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function round(value) {
  return Math.round(Number(value) * 100) / 100;
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sortedValues.length) - 1)
  );
  return sortedValues[index];
}
