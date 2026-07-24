import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { endpoints } from "./endpoints.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const isSmoke = process.env.BENCHMARK_SMOKE === "true" || process.argv.includes("--smoke");

if (!process.env.BENCHMARK_BASE_URL) {
  process.env.NODE_ENV ??= "benchmark";
  process.env.BENCHMARK_DISABLE_RATE_LIMIT ??= "true";
}

const [{ createApp }, { signAccessToken }] = await Promise.all([
  import("../apps/api/src/app.js"),
  import("../apps/api/src/utils/jwt.js")
]);

const config = {
  durationMs: Number(process.env.BENCHMARK_DURATION_MS ?? (isSmoke ? 1500 : 10000)),
  concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? (isSmoke ? 2 : 8)),
  warmupRequests: Number(process.env.BENCHMARK_WARMUP_REQUESTS ?? (isSmoke ? 1 : 3)),
  baseUrl: process.env.BENCHMARK_BASE_URL,
  authToken:
    process.env.BENCHMARK_AUTH_TOKEN ??
    signAccessToken({ sub: "usr_benchmark_admin", role: "admin", scope: "benchmark" })
};

const thresholds = JSON.parse(
  await fs.readFile(path.join(__dirname, "thresholds.json"), "utf8")
);

let server;
if (!config.baseUrl) {
  const app = createApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  config.baseUrl = `http://127.0.0.1:${port}`;
}

try {
  await fs.mkdir(resultsDir, { recursive: true });
  const results = [];

  for (const endpoint of endpoints) {
    for (let i = 0; i < config.warmupRequests; i += 1) {
      await sendRequest(endpoint);
    }
    results.push(await benchmarkEndpoint(endpoint));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: isSmoke ? "smoke" : "full",
    target: config.baseUrl,
    durationMs: config.durationMs,
    concurrency: config.concurrency,
    endpointCount: endpoints.length,
    results
  };

  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDir, `benchmark-${stamp}.json`);
  const mdPath = path.join(resultsDir, `benchmark-${stamp}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(mdPath, renderMarkdown(report));

  const failures = results.flatMap((result) => result.thresholdFailures);
  console.log(`Benchmark report written to ${path.relative(repoRoot, jsonPath)}`);
  console.log(`Markdown summary written to ${path.relative(repoRoot, mdPath)}`);

  if (failures.length > 0) {
    console.error("\nThreshold failures:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  }
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function benchmarkEndpoint(endpoint) {
  const samples = [];
  const startedAt = performance.now();
  const stopAt = startedAt + config.durationMs;

  await Promise.all(
    Array.from({ length: config.concurrency }, async () => {
      while (performance.now() < stopAt) {
        samples.push(await sendRequest(endpoint));
      }
    })
  );

  const elapsedSeconds = (performance.now() - startedAt) / 1000;
  const success = samples.filter((sample) => sample.ok).length;
  const errors = samples.length - success;
  const latency = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfb = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor((sample.startedAt - startedAt) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  const result = {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: samples.length,
    errors,
    errorRate: samples.length === 0 ? 1 : errors / samples.length,
    sustainedRps: round(success / elapsedSeconds),
    peakRps: Math.max(...buckets.values(), 0),
    latencyMs: summarize(latency),
    ttfbMs: summarize(ttfb),
    statusCodes: countBy(samples.map((sample) => sample.status)),
    thresholdFailures: []
  };

  result.thresholdFailures = evaluateThresholds(result);
  printRow(result);
  return result;
}

async function sendRequest(endpoint) {
  const url = new URL(endpoint.path, config.baseUrl);
  const headers = {};
  let body;

  if (endpoint.auth) {
    headers.authorization = `Bearer ${config.authToken}`;
  }

  if (endpoint.multipart) {
    const form = new FormData();
    form.append(
      endpoint.multipart.field,
      new Blob([endpoint.multipart.value], { type: endpoint.multipart.contentType }),
      endpoint.multipart.filename
    );
    body = form;
  } else if (endpoint.body) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.body);
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(url, { method: endpoint.method, headers, body });
    const firstByteAt = performance.now();
    await response.arrayBuffer();
    const finishedAt = performance.now();
    return {
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
      startedAt,
      ttfbMs: firstByteAt - startedAt,
      latencyMs: finishedAt - startedAt
    };
  } catch (error) {
    const finishedAt = performance.now();
    return {
      ok: false,
      status: "ERR",
      error: error.message,
      startedAt,
      ttfbMs: finishedAt - startedAt,
      latencyMs: finishedAt - startedAt
    };
  }
}

function summarize(values) {
  return {
    min: round(values[0] ?? 0),
    p50: round(percentile(values, 0.5)),
    p95: round(percentile(values, 0.95)),
    p99: round(percentile(values, 0.99)),
    max: round(values.at(-1) ?? 0)
  };
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) {
    return 0;
  }
  const index = Math.ceil(sortedValues.length * percentileValue) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function thresholdFor(result) {
  const baseline = isSmoke ? thresholds.smoke : thresholds.defaults;
  return {
    ...baseline,
    ...(thresholds.overrides[result.name] ?? {})
  };
}

function evaluateThresholds(result) {
  const threshold = thresholdFor(result);
  const failures = [];
  if (result.latencyMs.p99 > threshold.p99LatencyMs) {
    failures.push(
      `${result.name} p99 latency ${result.latencyMs.p99}ms exceeds ${threshold.p99LatencyMs}ms`
    );
  }
  if (result.ttfbMs.p99 > threshold.p99TtfbMs) {
    failures.push(`${result.name} p99 TTFB ${result.ttfbMs.p99}ms exceeds ${threshold.p99TtfbMs}ms`);
  }
  if (result.errorRate > threshold.maxErrorRate) {
    failures.push(
      `${result.name} error rate ${round(result.errorRate * 100)}% exceeds ${threshold.maxErrorRate * 100}%`
    );
  }
  if (result.sustainedRps < threshold.minSustainedRps) {
    failures.push(
      `${result.name} sustained RPS ${result.sustainedRps} below ${threshold.minSustainedRps}`
    );
  }
  return failures;
}

function renderMarkdown(report) {
  const lines = [
    "# API Benchmark Results",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Target: ${report.target}`,
    `Duration: ${report.durationMs}ms`,
    `Concurrency: ${report.concurrency}`,
    `Endpoints: ${report.endpointCount}`,
    "",
    "| Endpoint | Requests | p50 | p95 | p99 | TTFB p99 | Sustained RPS | Peak RPS | Error % | Status |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of report.results) {
    lines.push(
      `| ${result.method} ${result.path} | ${result.requests} | ${result.latencyMs.p50}ms | ${result.latencyMs.p95}ms | ${result.latencyMs.p99}ms | ${result.ttfbMs.p99}ms | ${result.sustainedRps} | ${result.peakRps} | ${round(result.errorRate * 100)}% | ${
        result.thresholdFailures.length === 0 ? "pass" : "fail"
      } |`
    );
  }

  const failures = report.results.flatMap((result) => result.thresholdFailures);
  lines.push("", "## Threshold Check", "");
  if (failures.length === 0) {
    lines.push("All configured benchmark thresholds passed.");
  } else {
    for (const failure of failures) {
      lines.push(`- ${failure}`);
    }
  }

  lines.push(
    "",
    "## Contributor Disclosure",
    "",
    "- Contributor: mawroayb-ui",
    "- Assistance: AI agent used for implementation, benchmark design, and verification.",
    "- Payment details: intentionally omitted from public repository artifacts."
  );

  return `${lines.join("\n")}\n`;
}

function printRow(result) {
  console.log(
    `${result.name.padEnd(22)} p50=${result.latencyMs.p50}ms p95=${result.latencyMs.p95}ms p99=${result.latencyMs.p99}ms ttfb99=${result.ttfbMs.p99}ms rps=${result.sustainedRps} errors=${round(
      result.errorRate * 100
    )}%`
  );
}

function round(value) {
  return Math.round(value * 100) / 100;
}
