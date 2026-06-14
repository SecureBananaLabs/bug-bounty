import autocannon from "autocannon";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");

await loadBenchmarkEnv();

const isSmoke = process.argv.includes("--smoke");
const targetUrl = stripTrailingSlash(process.env.BENCHMARK_TARGET_URL ?? "http://127.0.0.1:4000");
const allEndpoints = await readJson(path.join(__dirname, "endpoints.json"));
const endpoints = isSmoke
  ? allEndpoints.filter((endpoint) => endpoint.smoke)
  : allEndpoints;
const thresholds = await readJson(path.join(__dirname, "thresholds.json"));
const settings = {
  mode: isSmoke ? "smoke" : "full",
  targetUrl,
  connections: readPositiveInteger("BENCHMARK_CONNECTIONS", 2),
  pipelining: readPositiveInteger("BENCHMARK_PIPELINING", 1),
  amount: readPositiveInteger(isSmoke ? "BENCHMARK_SMOKE_AMOUNT" : "BENCHMARK_AMOUNT", isSmoke ? 3 : 8),
};

const authToken = process.env.BENCHMARK_AUTH_TOKEN || await fetchBenchmarkToken(targetUrl);
const rows = [];

for (const endpoint of endpoints) {
  rows.push(await runEndpoint(endpoint, authToken));
}

const report = {
  generatedAt: new Date().toISOString(),
  settings,
  thresholds,
  endpoints: rows,
};

await mkdir(resultsDir, { recursive: true });
const stamp = report.generatedAt.replace(/[:.]/g, "-");
const jsonPath = path.join(resultsDir, `api-benchmark-${stamp}.json`);
const markdownPath = path.join(resultsDir, `api-benchmark-${stamp}.md`);
await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(markdownPath, renderMarkdown(report));
await writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(path.join(resultsDir, "latest.md"), renderMarkdown(report));

console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
console.log(`Wrote ${path.relative(repoRoot, markdownPath)}`);

if (isSmoke) {
  const failures = rows.filter((row) => !row.passedThreshold);
  if (failures.length > 0) {
    console.error("Smoke benchmark threshold failures:");
    for (const failure of failures) {
      console.error(`- ${failure.name}: p99=${failure.p99Ms}ms, errorRate=${failure.errorRatePct}%`);
    }
    process.exitCode = 1;
  }
}

process.exit(process.exitCode ?? 0);

async function runEndpoint(endpoint, authToken) {
  const headers = { ...(endpoint.headers ?? {}) };
  const options = {
    url: `${targetUrl}${endpoint.path}`,
    method: endpoint.method,
    connections: settings.connections,
    pipelining: settings.pipelining,
    amount: settings.amount,
    headers,
  };

  if (endpoint.auth) {
    options.headers.authorization = `Bearer ${authToken}`;
  }

  if (endpoint.body) {
    options.body = JSON.stringify(endpoint.body);
    options.headers["content-type"] = "application/json";
  }

  const result = await autocannon(options);
  const totalRequests = result.requests?.total ?? 0;
  const failedRequests = (result.errors ?? 0) + (result.timeouts ?? 0) + (result.non2xx ?? 0);
  const errorRatePct = totalRequests === 0 ? 100 : round((failedRequests / totalRequests) * 100);
  const threshold = thresholdFor(endpoint.name);
  const p99Ms = result.latency?.p99 ?? null;
  const p95Ms = result.latency?.p95 ?? result.latency?.p97_5 ?? p99Ms;
  const passedThreshold = p99Ms !== null && p99Ms <= threshold.p99Ms && errorRatePct <= threshold.maxErrorRatePct;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: totalRequests,
    sustainedRps: round(result.requests?.average ?? 0),
    peakRps: round(result.requests?.max ?? 0),
    p50Ms: result.latency?.p50 ?? null,
    p95Ms,
    p99Ms,
    ttfbMs: round(result.latency?.average ?? 0),
    errors: result.errors ?? 0,
    timeouts: result.timeouts ?? 0,
    non2xx: result.non2xx ?? 0,
    errorRatePct,
    statusCodes: result.statusCodeStats ?? {},
    threshold,
    passedThreshold,
  };
}

async function fetchBenchmarkToken(baseUrl) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "bench-login@example.com",
      password: "benchmark-password",
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch benchmark token: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data?.token;
}

function renderMarkdown(report) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.settings.mode}`,
    `Target: ${report.settings.targetUrl}`,
    `Connections: ${report.settings.connections}`,
    `Pipelining: ${report.settings.pipelining}`,
    `Requests per endpoint: ${report.settings.amount}`,
    "",
    "| Endpoint | Method | p50 ms | p95 ms | p99 ms | RPS avg | RPS peak | TTFB ms | Error % | Gate |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ];

  for (const endpoint of report.endpoints) {
    lines.push([
      endpoint.name,
      endpoint.method,
      endpoint.p50Ms,
      endpoint.p95Ms,
      endpoint.p99Ms,
      endpoint.sustainedRps,
      endpoint.peakRps,
      endpoint.ttfbMs,
      endpoint.errorRatePct,
      endpoint.passedThreshold ? "pass" : "fail",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function loadBenchmarkEnv() {
  const envPath = path.join(__dirname, ".env.benchmark");
  let content;

  try {
    content = await readFile(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const [key, ...valueParts] = trimmed.split("=");
    if (key && process.env[key] === undefined) {
      process.env[key] = valueParts.join("=");
    }
  }
}

function readPositiveInteger(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function thresholdFor(endpointName) {
  return {
    ...thresholds.default,
    ...(thresholds.endpoints?.[endpointName] ?? {}),
  };
}

function stripTrailingSlash(value) {
  return value.replace(/\/$/, "");
}

function round(value) {
  return Math.round(value * 100) / 100;
}
