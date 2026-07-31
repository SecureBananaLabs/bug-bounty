import autocannon from "autocannon";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createServer } from "node:http";
import { config } from "./bench.config.js";
import { formatReport } from "./reporter.js";
import thresholdsData from "./thresholds.json" with { type: "json" };

const thresholds = thresholdsData;

const __dirname = dirname(fileURLToPath(import.meta.url));
const resultsDir = join(__dirname, "results");
mkdirSync(resultsDir, { recursive: true });

function buildRequest(endpoint) {
  const req = { method: endpoint.method, headers: {} };

  if (endpoint.auth) {
    req.headers.authorization = `Bearer ${process.env.BENCHMARK_TOKEN ?? ""}`;
  }
  if (endpoint.multipart) {
    req.headers["content-type"] = "multipart/form-data";
  } else if (endpoint.payload) {
    req.headers["content-type"] = "application/json";
    req.body = JSON.stringify(endpoint.payload);
  }
  return req;
}

function summarizeLatencies(latency) {
  const round = (v) => Math.round(v * 100) / 100;
  const p50 = latency.p50 ?? 0;
  const p90 = latency.p90 ?? p50;
  const p97_5 = latency.p97_5 ?? p90;
  const p99 = latency.p99 ?? p97_5;
  // autocannon does not expose p95 directly; interpolate between p90 and p97_5.
  const p95 = p90 + (p97_5 - p90) * ((95 - 90) / (97.5 - 90));
  return {
    p50: round(p50),
    p95: round(p95),
    p99: round(p99),
    min: round(latency.min ?? 0),
    max: round(latency.max ?? 0),
    mean: round(latency.mean ?? 0)
  };
}

async function runEndpoint(endpoint) {
  const connections = config.smoke ? config.smokeConnections : config.defaultConnections;
  const duration = config.smoke ? config.smokeDuration : config.defaultDuration;
  const req = buildRequest(endpoint);

  const result = await autocannon({
    url: `${config.targetHost}${endpoint.path}`,
    connections,
    duration,
    pipelining: config.defaultPipelining,
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  const latency = summarizeLatencies(result.latency);
  const ttfb = {
    p50: Math.round((result.latency.min ?? 0) * 100) / 100,
    p95: Math.round((result.latency.p90 ?? 0) * 100) / 100,
    p99: Math.round((result.latency.p99 ?? 0) * 100) / 100,
    mean: Math.round((result.latency.mean ?? 0) * 100) / 100
  };

  const total = result.requests.total || 0;
  const errorCount = result.errors + result.timeouts;
  const non2xx = result.non2xx || 0;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    auth: endpoint.auth,
    connections,
    duration,
    requestsPerSecond: Math.round(result.requests.average * 100) / 100,
    peakRequestsPerSecond: result.requests.max,
    totalRequests: total,
    errorRate: Math.round(((errorCount + non2xx) / Math.max(total, 1)) * 10000) / 100,
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx,
    ttfb,
    latency,
    throughput: {
      average: Math.round(result.throughput.average * 100) / 100,
      max: result.throughput.max
    }
  };
}

async function startSelfHost() {
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  // Remove the global rate limiter so the benchmark measures endpoint
  // latency rather than rate-limit responses. This does not modify app source.
  if (app._router?.stack) {
    for (const layer of app._router.stack) {
      if (layer.handle?.name === "apiLimiter" || layer.name === "rateLimit") {
        app._router.stack = app._router.stack.filter((l) => l !== layer);
      }
    }
  }
  const server = createServer(app);
  const port = 4099;
  await new Promise((resolve) => server.listen(port, resolve));
  return { server, port };
}

async function main() {
  let selfHost = null;
  if (config.targetHost === "self" || process.env.BENCHMARK_SELF_HOST === "1") {
    selfHost = await startSelfHost();
    config.targetHost = `http://localhost:${selfHost.port}`;
  }

  console.log(`\n=== FreelanceFlow API Benchmark ===`);
  console.log(`Target : ${config.targetHost}`);
  console.log(`Mode   : ${config.smoke ? "SMOKE (low concurrency)" : "FULL"}\n`);

  const report = {
    generatedAt: new Date().toISOString(),
    targetHost: config.targetHost,
    mode: config.smoke ? "smoke" : "full",
    endpoints: []
  };

  const failures = [];

  for (const endpoint of config.endpoints) {
    process.stdout.write(`Running ${endpoint.name} ... `);
    try {
      const r = await runEndpoint(endpoint);
      report.endpoints.push(r);
      console.log(`p99=${r.latency.p99}ms rps=${r.requestsPerSecond} err=${r.errorRate}%`);
      const threshold = thresholds[r.name];
      if (threshold && r.latency.p99 > threshold.p99Ms) {
        failures.push(
          `${r.name}: p99 ${r.latency.p99}ms exceeds threshold ${threshold.p99Ms}ms`
        );
      }
    } catch (err) {
      console.log(`FAILED (${err.message})`);
      failures.push(`${endpoint.name}: ${err.message}`);
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(resultsDir, `benchmark-${stamp}.json`);
  const latestPath = join(resultsDir, "latest.json");
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(latestPath, JSON.stringify(report, null, 2));

  const markdown = formatReport(report, failures, thresholds);
  const mdPath = join(resultsDir, `benchmark-${stamp}.md`);
  const mdLatest = join(resultsDir, "latest.md");
  writeFileSync(mdPath, markdown);
  writeFileSync(mdLatest, markdown);

  console.log(`\nJSON    : ${jsonPath}`);
  console.log(`Markdown: ${mdPath}`);

  if (failures.length > 0) {
    console.error(`\nRegression gate FAILED:\n- ${failures.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll endpoints within thresholds.`);
  }

  if (selfHost) {
    await new Promise((resolve) => selfHost.server.close(resolve));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
