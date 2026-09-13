import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

process.env.NODE_ENV ??= "benchmark";
process.env.JWT_SECRET ??= "benchmark-secret";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const isSmoke = process.argv.includes("--smoke");
const iterations = Number(process.env.BENCHMARK_ITERATIONS ?? (isSmoke ? 2 : 6));
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (isSmoke ? 1 : 2));
const resultBaseName =
  process.env.BENCHMARK_RESULT_BASENAME ??
  (isSmoke ? "api-benchmark-smoke" : `api-benchmark-${new Date().toISOString().replace(/[:.]/g, "-")}`);

const { createApp } = await import("../apps/api/src/app.js");
const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");

const benchmarkToken = signAccessToken({ sub: "benchmark_admin", role: "admin" });

const apiEndpoints = [
  endpoint("POST", "/api/auth/register", {
    json: (i) => ({
      email: `bench-${Date.now()}-${i}@example.com`,
      password: "benchmark-password",
      role: "client",
    }),
  }),
  endpoint("POST", "/api/auth/login", {
    json: () => ({ email: "bench-login@example.com", password: "benchmark-password" }),
  }),
  endpoint("GET", "/api/auth/oauth/github/callback"),
  endpoint("POST", "/api/auth/refresh", { json: () => ({ token: "benchmark-refresh-token" }) }),
  endpoint("GET", "/api/users"),
  endpoint("POST", "/api/users", {
    json: (i) => ({ email: `bench-user-${i}@example.com`, name: `Benchmark User ${i}`, role: "client" }),
  }),
  endpoint("GET", "/api/jobs"),
  endpoint("POST", "/api/jobs", {
    json: (i) => ({
      title: `Benchmark marketplace job ${i}`,
      description: "Synthetic benchmark payload for the job creation endpoint.",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_benchmark",
      skills: ["node", "api", "benchmark"],
    }),
  }),
  endpoint("GET", "/api/proposals"),
  endpoint("POST", "/api/proposals", {
    json: (i) => ({ jobId: `job_${i}`, freelancerId: "usr_benchmark", coverLetter: "Benchmark proposal", bid: 250 }),
  }),
  endpoint("POST", "/api/payments", { json: () => ({ amount: 25000, currency: "usd", jobId: "job_benchmark" }) }),
  endpoint("GET", "/api/reviews"),
  endpoint("POST", "/api/reviews", {
    json: () => ({ targetId: "usr_benchmark", rating: 5, comment: "Benchmark review payload" }),
  }),
  endpoint("GET", "/api/messages"),
  endpoint("POST", "/api/messages", {
    json: () => ({ conversationId: "conv_benchmark", senderId: "usr_benchmark", body: "Benchmark message" }),
  }),
  endpoint("GET", "/api/notifications"),
  endpoint("POST", "/api/notifications", {
    json: () => ({ userId: "usr_benchmark", type: "benchmark", message: "Benchmark notification" }),
  }),
  endpoint("POST", "/api/uploads", {
    form: () => {
      const form = new FormData();
      form.set("file", new Blob(["benchmark upload body"], { type: "text/plain" }), "benchmark.txt");
      return form;
    },
  }),
  endpoint("GET", "/api/search?q=benchmark"),
  endpoint("GET", "/api/admin/metrics", {
    headers: () => ({ authorization: `Bearer ${benchmarkToken}` }),
  }),
];

const endpoints = [endpoint("GET", "/health"), ...apiEndpoints];

function endpoint(method, route, options = {}) {
  return {
    name: `${method} ${route}`,
    method,
    route,
    ...options,
  };
}

async function main() {
  await fs.mkdir(resultsDir, { recursive: true });
  const thresholds = await readThresholds();
  const target = await resolveTarget();

  const startedAt = new Date().toISOString();
  const endpointResults = [];

  for (const config of endpoints) {
    endpointResults.push(await benchmarkEndpoint(target.baseUrl, config));
  }

  await target.close();

  const report = {
    generatedAt: startedAt,
    mode: isSmoke ? "smoke" : "baseline",
    targetUrl: target.baseUrl,
    iterations,
    concurrency,
    thresholdSource: "benchmarks/thresholds.json",
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuModel: os.cpus()[0]?.model ?? "unknown",
      logicalCores: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem(),
    },
    apiEndpointCoverage: {
      apiEndpointCount: apiEndpoints.length,
      includedRoutes: apiEndpoints.map((item) => `${item.method} ${item.route}`),
    },
    results: endpointResults,
  };

  const failures = evaluateThresholds(report, thresholds);
  report.thresholdFailures = failures;

  const jsonPath = path.join(resultsDir, `${resultBaseName}.json`);
  const mdPath = path.join(resultsDir, `${resultBaseName}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(mdPath, renderMarkdown(report));

  console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
  console.log(`Wrote ${path.relative(repoRoot, mdPath)}`);

  if ((isSmoke || process.env.BENCHMARK_ENFORCE_THRESHOLDS === "true") && failures.length > 0) {
    console.error("Benchmark threshold failures:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
}

async function resolveTarget() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {
      baseUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, ""),
      close: async () => {},
    };
  }

  const app = createApp();
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
}

async function readThresholds() {
  const raw = await fs.readFile(path.join(__dirname, "thresholds.json"), "utf8");
  return JSON.parse(raw);
}

async function benchmarkEndpoint(baseUrl, config) {
  const latencies = [];
  const ttfbs = [];
  const statuses = {};
  let errors = 0;
  let next = 0;
  const started = performance.now();

  async function worker() {
    while (next < iterations) {
      const index = next++;
      const result = await runRequest(baseUrl, config, index);
      latencies.push(result.latencyMs);
      ttfbs.push(result.ttfbMs);
      statuses[result.status] = (statuses[result.status] ?? 0) + 1;
      if (result.error || result.status >= 400) errors++;
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const durationMs = performance.now() - started;

  return {
    name: config.name,
    method: config.method,
    route: config.route,
    requests: iterations,
    concurrency,
    durationMs: round(durationMs),
    sustainedRps: round((iterations / durationMs) * 1000),
    peakRpsEstimate: round((concurrency / Math.max(percentile(latencies, 0.5), 1)) * 1000),
    errorRatePercent: round((errors / iterations) * 100),
    statusCodes: statuses,
    latencyMs: summarize(latencies),
    ttfbMs: summarize(ttfbs),
  };
}

async function runRequest(baseUrl, config, index) {
  const headers = new Headers(config.headers?.(index) ?? {});
  const init = {
    method: config.method,
    headers,
  };

  if (config.json) {
    headers.set("content-type", "application/json");
    init.body = JSON.stringify(config.json(index));
  }

  if (config.form) {
    init.body = config.form(index);
  }

  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${config.route}`, init);
    const firstByte = performance.now();
    await response.arrayBuffer();
    const finished = performance.now();
    return {
      status: response.status,
      ttfbMs: firstByte - started,
      latencyMs: finished - started,
      error: false,
    };
  } catch {
    const finished = performance.now();
    return {
      status: 0,
      ttfbMs: finished - started,
      latencyMs: finished - started,
      error: true,
    };
  }
}

function summarize(values) {
  return {
    p50: round(percentile(values, 0.5)),
    p95: round(percentile(values, 0.95)),
    p99: round(percentile(values, 0.99)),
    min: round(Math.min(...values)),
    max: round(Math.max(...values)),
  };
}

function percentile(values, pct) {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const index = Math.ceil(sorted.length * pct) - 1;
  return sorted[Math.min(Math.max(index, 0), sorted.length - 1)];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function evaluateThresholds(report, thresholds) {
  const failures = [];
  for (const result of report.results) {
    const routeThreshold = thresholds.routes?.[result.route] ?? {};
    const p99Limit = routeThreshold.p99LatencyMs ?? thresholds.defaults.p99LatencyMs;
    const errorLimit = routeThreshold.errorRatePercent ?? thresholds.defaults.errorRatePercent;
    if (result.latencyMs.p99 > p99Limit) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms exceeded ${p99Limit}ms`);
    }
    if (result.errorRatePercent > errorLimit) {
      failures.push(`${result.name} error rate ${result.errorRatePercent}% exceeded ${errorLimit}%`);
    }
  }
  return failures;
}

function renderMarkdown(report) {
  const rows = report.results
    .map(
      (r) =>
        `| ${r.name} | ${r.requests} | ${r.latencyMs.p50} | ${r.latencyMs.p95} | ${r.latencyMs.p99} | ${r.ttfbMs.p95} | ${r.sustainedRps} | ${r.peakRpsEstimate} | ${r.errorRatePercent}% | ${formatStatuses(r.statusCodes)} |`,
    )
    .join("\n");

  const failures =
    report.thresholdFailures.length === 0
      ? "No threshold failures."
      : report.thresholdFailures.map((failure) => `- ${failure}`).join("\n");

  return `# API Benchmark ${report.mode === "smoke" ? "Smoke" : "Baseline"} Report

- Generated at: ${report.generatedAt}
- Target URL: ${report.targetUrl}
- Iterations per endpoint: ${report.iterations}
- Concurrency per endpoint: ${report.concurrency}
- Covered /api endpoints: ${report.apiEndpointCoverage.apiEndpointCount}
- Runtime: ${report.runtime.node} on ${report.runtime.platform}/${report.runtime.arch}
- CPU: ${report.runtime.cpuModel} (${report.runtime.logicalCores} logical cores)

## Results

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS Estimate | Error Rate | Status Codes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}

## Thresholds

${failures}

## Covered API Routes

${report.apiEndpointCoverage.includedRoutes.map((route) => `- ${route}`).join("\n")}
`;
}

function formatStatuses(statuses) {
  return Object.entries(statuses)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([status, count]) => `${status}:${count}`)
    .join(", ");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
