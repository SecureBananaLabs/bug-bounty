import { createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(__dirname, "config", "api-endpoints.json");
const thresholdsPath = path.join(__dirname, "thresholds.json");

const options = {
  baseUrl: process.env.BENCHMARK_BASE_URL ?? "http://127.0.0.1:4000",
  concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? 2),
  requestsPerEndpoint: Number(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT ?? 5),
  warmupRequests: Number(process.env.BENCHMARK_WARMUP_REQUESTS ?? 1),
  resultsDir: path.resolve(repoRoot, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results"),
  outputPrefix: process.env.BENCHMARK_OUTPUT_PREFIX ?? new Date().toISOString().replace(/[:.]/g, "-"),
  failOnThreshold:
    process.env.BENCHMARK_FAIL_ON_THRESHOLD === "1" || process.argv.includes("--fail-on-threshold")
};

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

assertPositiveInteger(options.concurrency, "BENCHMARK_CONCURRENCY");
assertPositiveInteger(options.requestsPerEndpoint, "BENCHMARK_REQUESTS_PER_ENDPOINT");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function toBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function createBenchmarkToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const secret = process.env.JWT_SECRET ?? "development-secret";
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: "benchmark_admin",
      role: "admin",
      iat: now,
      exp: now + 15 * 60
    })
  );
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function resolveUrl(endpoint) {
  const url = new URL(endpoint.path, options.baseUrl);
  for (const [key, value] of Object.entries(endpoint.query ?? {})) {
    url.searchParams.set(key, String(value));
  }
  return url;
}

function buildRequest(endpoint, authToken) {
  const headers = { ...(endpoint.headers ?? {}) };
  const request = {
    method: endpoint.method,
    headers
  };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (endpoint.bodyType === "json") {
    headers["content-type"] = "application/json";
    request.body = JSON.stringify(endpoint.body ?? {});
  }

  if (endpoint.bodyType === "multipart") {
    const form = new FormData();
    for (const field of endpoint.form ?? []) {
      if (field.type === "file") {
        form.append(
          field.name,
          new Blob([field.content ?? ""], { type: field.contentType ?? "application/octet-stream" }),
          field.fileName ?? "benchmark.bin"
        );
      } else {
        form.append(field.name, String(field.value ?? ""));
      }
    }
    request.body = form;
  }

  return request;
}

async function runOneRequest(endpoint, authToken) {
  const startedAt = performance.now();
  try {
    const response = await fetch(resolveUrl(endpoint), buildRequest(endpoint, authToken));
    const ttfbMs = performance.now() - startedAt;
    const body = await response.arrayBuffer();
    const durationMs = performance.now() - startedAt;

    return {
      status: response.status,
      ok: response.ok,
      bytes: body.byteLength,
      ttfbMs,
      durationMs,
      endedAt: performance.now()
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      bytes: 0,
      ttfbMs: 0,
      durationMs: performance.now() - startedAt,
      endedAt: performance.now(),
      error: error.message
    };
  }
}

function percentile(values, q) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((q / 100) * sorted.length) - 1);
  return sorted[index];
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function summarize(endpoint, results, wallTimeMs) {
  const durations = results.map((result) => result.durationMs);
  const ttfbs = results.map((result) => result.ttfbMs);
  const failed = results.filter((result) => !result.ok).length;
  const buckets = new Map();
  const firstEnd = Math.min(...results.map((result) => result.endedAt));

  for (const result of results) {
    const bucket = Math.floor((result.endedAt - firstEnd) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  return {
    name: endpoint.name,
    endpoint: `${endpoint.method} ${endpoint.path}`,
    requests: results.length,
    statuses: summarizeStatuses(results),
    p50Ms: round(percentile(durations, 50)),
    p95Ms: round(percentile(durations, 95)),
    p99Ms: round(percentile(durations, 99)),
    ttfbP50Ms: round(percentile(ttfbs, 50)),
    ttfbP95Ms: round(percentile(ttfbs, 95)),
    sustainedRps: round(results.length / (wallTimeMs / 1000)),
    peakRps: Math.max(...buckets.values()),
    errorRatePct: round((failed / results.length) * 100),
    sampleError: results.find((result) => result.error)?.error ?? null
  };
}

function summarizeStatuses(results) {
  return results.reduce((statuses, result) => {
    const key = result.status === null ? "network_error" : String(result.status);
    statuses[key] = (statuses[key] ?? 0) + 1;
    return statuses;
  }, {});
}

async function runEndpoint(endpoint, authToken) {
  for (let i = 0; i < options.warmupRequests; i += 1) {
    await runOneRequest(endpoint, authToken);
  }

  const results = [];
  const startedAt = performance.now();
  let launched = 0;
  const inFlight = new Set();

  async function launch() {
    launched += 1;
    const request = runOneRequest(endpoint, authToken)
      .then((result) => {
        results.push(result);
      })
      .finally(() => {
        inFlight.delete(request);
      });
    inFlight.add(request);
  }

  while (launched < options.requestsPerEndpoint || inFlight.size > 0) {
    while (launched < options.requestsPerEndpoint && inFlight.size < options.concurrency) {
      await launch();
    }
    if (inFlight.size > 0) {
      await Promise.race(inFlight);
    }
  }

  return summarize(endpoint, results, performance.now() - startedAt);
}

function thresholdFor(summary, thresholds) {
  return thresholds.endpoints?.[summary.endpoint] ?? thresholds.defaults;
}

function evaluateThresholds(summaries, thresholds) {
  const failures = [];
  for (const summary of summaries) {
    const threshold = thresholdFor(summary, thresholds);
    if (summary.p99Ms > threshold.p99Ms) {
      failures.push(`${summary.endpoint} p99 ${summary.p99Ms}ms exceeded ${threshold.p99Ms}ms`);
    }
    if (summary.ttfbP95Ms > threshold.ttfbP95Ms) {
      failures.push(`${summary.endpoint} TTFB p95 ${summary.ttfbP95Ms}ms exceeded ${threshold.ttfbP95Ms}ms`);
    }
    if (summary.errorRatePct > threshold.errorRatePct) {
      failures.push(
        `${summary.endpoint} error rate ${summary.errorRatePct}% exceeded ${threshold.errorRatePct}%`
      );
    }
    if (summary.sustainedRps < threshold.minSustainedRps) {
      failures.push(
        `${summary.endpoint} sustained RPS ${summary.sustainedRps} below ${threshold.minSustainedRps}`
      );
    }
  }
  return failures;
}

function toMarkdown(report) {
  const lines = [
    `# API Benchmark Report`,
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Base URL: \`${report.options.baseUrl}\``,
    `Concurrency: \`${report.options.concurrency}\``,
    `Requests per endpoint: \`${report.options.requestsPerEndpoint}\``,
    `Warmup requests per endpoint: \`${report.options.warmupRequests}\``,
    "",
    "| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const summary of report.summaries) {
    lines.push(
      `| ${summary.endpoint} | ${summary.p50Ms} | ${summary.p95Ms} | ${summary.p99Ms} | ${summary.ttfbP95Ms} | ${summary.sustainedRps} | ${summary.peakRps} | ${summary.errorRatePct} | ${JSON.stringify(summary.statuses)} |`
    );
  }

  lines.push("", "## Threshold Result", "");
  if (report.thresholdFailures.length === 0) {
    lines.push("All configured thresholds passed.");
  } else {
    for (const failure of report.thresholdFailures) {
      lines.push(`- ${failure}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const [{ endpoints }, thresholds] = await Promise.all([readJson(configPath), readJson(thresholdsPath)]);
  const authToken = createBenchmarkToken();
  const summaries = [];

  for (const endpoint of endpoints) {
    console.log(`Benchmarking ${endpoint.method} ${endpoint.path}`);
    summaries.push(await runEndpoint(endpoint, authToken));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    options: {
      ...options,
      resultsDir: path.relative(repoRoot, options.resultsDir)
    },
    summaries,
    thresholdFailures: evaluateThresholds(summaries, thresholds)
  };

  await mkdir(options.resultsDir, { recursive: true });
  const jsonPath = path.join(options.resultsDir, `${options.outputPrefix}.json`);
  const markdownPath = path.join(options.resultsDir, `${options.outputPrefix}.md`);
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, toMarkdown(report));

  console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
  console.log(`Wrote ${path.relative(repoRoot, markdownPath)}`);

  if (report.thresholdFailures.length > 0) {
    console.error(report.thresholdFailures.join("\n"));
    if (options.failOnThreshold) {
      process.exitCode = 1;
    }
  }
}

await main();
