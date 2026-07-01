import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";

const args = new Set(process.argv.slice(2));
const namedArgs = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--") && arg.includes("="))
    .map((arg) => {
      const [key, ...value] = arg.slice(2).split("=");
      return [key, value.join("=")];
    })
);

const smoke = args.has("--smoke");
const checkThresholds = args.has("--check-thresholds");
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

loadBenchmarkEnv();

const endpoints = JSON.parse(await readFile("benchmarks/endpoints.json", "utf8"));
const thresholds = JSON.parse(await readFile("benchmarks/thresholds.json", "utf8"));

const outputDir =
  namedArgs["output-dir"] ?? process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results";
const durationMs = Number(
  namedArgs.duration ?? process.env.BENCHMARK_DURATION_MS ?? (smoke ? 1000 : 5000)
);
const concurrency = Number(
  namedArgs.concurrency ?? process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 1 : 5)
);

let localServer;
const targetUrl = await resolveTargetUrl();
const authToken = process.env.BENCHMARK_AUTH_TOKEN || createBenchmarkJwt();

try {
  const startedAt = new Date().toISOString();
  const results = [];

  for (const endpoint of endpoints) {
    results.push(await benchmarkEndpoint(endpoint, targetUrl, authToken, durationMs, concurrency));
  }

  const report = {
    startedAt,
    completedAt: new Date().toISOString(),
    targetUrl,
    durationMs,
    concurrency,
    smoke,
    results
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(`${outputDir}/latest.json`, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(`${outputDir}/latest.md`, renderMarkdown(report));

  if (checkThresholds) {
    assertThresholds(results, thresholds);
  }

  printSummary(results);
} finally {
  if (localServer) {
    await new Promise((resolve, reject) => {
      localServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function loadBenchmarkEnv() {
  if (!existsSync(".env.benchmark")) {
    return;
  }

  const raw = readFileSync(".env.benchmark", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=");
    }
  }
}

async function resolveTargetUrl() {
  const explicitTarget = namedArgs.target ?? process.env.BENCHMARK_TARGET_URL;
  if (explicitTarget) {
    return explicitTarget.replace(/\/$/, "");
  }

  process.env.BENCHMARK_DISABLE_RATE_LIMIT = "true";
  localServer = createApp().listen(0);
  await new Promise((resolve, reject) => {
    localServer.once("listening", resolve);
    localServer.once("error", reject);
  });
  const { port } = localServer.address();
  return `http://127.0.0.1:${port}`;
}

async function benchmarkEndpoint(endpoint, baseUrl, token, duration, workerCount) {
  const deadline = performance.now() + duration;
  const samples = [];
  const workers = Array.from({ length: workerCount }, () =>
    runWorker(endpoint, baseUrl, token, deadline, samples)
  );

  const started = performance.now();
  await Promise.all(workers);
  const elapsedMs = performance.now() - started;

  const successful = samples.filter((sample) => sample.ok);
  const latencies = successful.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const ttfb = successful.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errorCount = samples.length - successful.length;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: samples.length,
    errors: errorCount,
    errorRatePercent: percent(errorCount, samples.length),
    rpsSustained: round((samples.length / elapsedMs) * 1000),
    rpsPeak: peakRequestsPerSecond(samples),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      p50: percentile(ttfb, 50),
      p95: percentile(ttfb, 95),
      p99: percentile(ttfb, 99)
    },
    statusCodes: countBy(samples.map((sample) => sample.status ?? "ERR"))
  };
}

async function runWorker(endpoint, baseUrl, token, deadline, samples) {
  while (performance.now() < deadline) {
    const sample = await sendRequest(endpoint, baseUrl, token);
    samples.push(sample);
  }
}

async function sendRequest(endpoint, baseUrl, token) {
  const requestStarted = performance.now();
  const request = buildRequest(endpoint, token);

  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, request);
    const firstByteAt = performance.now();
    await response.arrayBuffer();
    const completedAt = performance.now();
    const ok = endpoint.expectedStatuses.includes(response.status);

    return {
      ok,
      status: response.status,
      startedAtMs: requestStarted,
      ttfbMs: round(firstByteAt - requestStarted),
      durationMs: round(completedAt - requestStarted)
    };
  } catch (error) {
    return {
      ok: false,
      status: "ERR",
      error: error.message,
      startedAtMs: requestStarted,
      ttfbMs: 0,
      durationMs: round(performance.now() - requestStarted)
    };
  }
}

function buildRequest(endpoint, token) {
  const headers = { ...(endpoint.headers ?? {}) };
  const request = { method: endpoint.method, headers };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    request.body = JSON.stringify(replaceTemplates(endpoint.json));
  }

  if (endpoint.multipart) {
    const form = new FormData();
    for (const [key, value] of Object.entries(endpoint.multipart)) {
      form.append(
        key,
        new Blob([replaceTemplateString(value.content)], { type: value.contentType }),
        value.filename
      );
    }
    request.body = form;
  }

  return request;
}

function replaceTemplates(value) {
  if (typeof value === "string") {
    return replaceTemplateString(value);
  }
  if (Array.isArray(value)) {
    return value.map(replaceTemplates);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, replaceTemplates(nestedValue)])
    );
  }
  return value;
}

function replaceTemplateString(value) {
  return value.replaceAll("{{runId}}", runId);
}

function createBenchmarkJwt() {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(
    JSON.stringify({
      sub: "benchmark-user",
      role: "admin",
      iat: now,
      exp: now + 15 * 60
    })
  );
  const secret = process.env.JWT_SECRET ?? "development-secret";
  const signature = base64Url(createHmac("sha256", secret).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${signature}`;
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }
  const index = Math.ceil((p / 100) * values.length) - 1;
  return round(values[Math.max(0, Math.min(index, values.length - 1))]);
}

function percent(count, total) {
  return total === 0 ? 0 : round((count / total) * 100);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function peakRequestsPerSecond(samples) {
  const buckets = new Map();
  for (const sample of samples) {
    const second = Math.floor(sample.startedAtMs / 1000);
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }
  return Math.max(0, ...buckets.values());
}

function assertThresholds(results, config) {
  const failures = [];
  for (const result of results) {
    const endpointThreshold = config.endpoints?.[result.name] ?? {};
    const p99Ms = endpointThreshold.p99Ms ?? config.defaults.p99Ms;
    const errorRatePercent =
      endpointThreshold.errorRatePercent ?? config.defaults.errorRatePercent;

    if (result.latencyMs.p99 > p99Ms) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms > ${p99Ms}ms`);
    }
    if (result.errorRatePercent > errorRatePercent) {
      failures.push(
        `${result.name} error rate ${result.errorRatePercent}% > ${errorRatePercent}%`
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(`Benchmark thresholds failed:\n${failures.join("\n")}`);
  }
}

function renderMarkdown(report) {
  const rows = report.results
    .map(
      (result) =>
        `| ${result.name} | ${result.method} ${result.path} | ${result.requests} | ${result.errorRatePercent}% | ${result.rpsSustained} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p99} |`
    )
    .join("\n");

  return `# API Benchmark Summary

- Target: \`${report.targetUrl}\`
- Started: ${report.startedAt}
- Completed: ${report.completedAt}
- Duration per endpoint: ${report.durationMs}ms
- Concurrency per endpoint: ${report.concurrency}
- Smoke run: ${report.smoke}

| Endpoint | Route | Requests | Error Rate | RPS | p50 ms | p95 ms | p99 ms | TTFB p99 ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

function printSummary(results) {
  for (const result of results) {
    console.log(
      `${result.name}: ${result.requests} requests, ${result.errorRatePercent}% errors, p99=${result.latencyMs.p99}ms, rps=${result.rpsSustained}`
    );
  }
}
