import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { endpoints } from "./endpoints.mjs";

const rootDir = process.cwd();
const smoke = process.argv.includes("--smoke");

await loadEnvFile(path.join(rootDir, ".env.benchmark"));

const config = {
  targetUrl: trimTrailingSlash(process.env.BENCHMARK_TARGET_URL ?? "http://127.0.0.1:4000"),
  durationSeconds: Number(process.env.BENCHMARK_DURATION_SECONDS ?? (smoke ? 2 : 15)),
  concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 1 : 4)),
  resultsDir: process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results",
  authToken:
    process.env.BENCHMARK_AUTH_TOKEN ??
    createHs256Token({ sub: "benchmark-user", role: "admin" }, process.env.BENCHMARK_AUTH_SECRET ?? "development-secret")
};

const thresholds = JSON.parse(await fs.readFile(path.join(rootDir, "benchmarks/thresholds.json"), "utf8"));
const startedAt = new Date();
const results = [];

for (const endpoint of endpoints) {
  results.push(await benchmarkEndpoint(endpoint, config));
}

const report = {
  startedAt: startedAt.toISOString(),
  completedAt: new Date().toISOString(),
  smoke,
  config: {
    targetUrl: config.targetUrl,
    durationSeconds: config.durationSeconds,
    concurrency: config.concurrency
  },
  results
};

const failures = evaluateThresholds(results, thresholds);
await writeReports(report, failures, config.resultsDir);

if (failures.length > 0) {
  console.error(formatFailures(failures));
  process.exitCode = 1;
}

async function benchmarkEndpoint(endpoint, runConfig) {
  const samples = [];
  const deadline = performance.now() + runConfig.durationSeconds * 1000;
  let sequence = 0;

  async function worker() {
    while (performance.now() < deadline) {
      sequence += 1;
      samples.push(await requestOnce(endpoint, runConfig, sequence));
    }
  }

  await Promise.all(Array.from({ length: runConfig.concurrency }, () => worker()));

  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfbs = samples.map((sample) => sample.ttfbMs);
  const errors = samples.filter((sample) => sample.error || sample.status >= 400).length;
  const elapsedSeconds = Math.max(0.001, (Math.max(...samples.map((sample) => sample.completedAtMs), performance.now()) - (deadline - runConfig.durationSeconds * 1000)) / 1000);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: samples.length,
    errors,
    errorRatePercent: percent(errors, samples.length),
    rps: round(samples.length / elapsedSeconds, 2),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      p95: percentile(ttfbs, 95)
    },
    statusCodes: countBy(samples.map((sample) => String(sample.status || "ERR")))
  };
}

async function requestOnce(endpoint, runConfig, sequence) {
  const url = new URL(endpoint.path, `${runConfig.targetUrl}/`);
  const headers = {};
  let body;

  if (endpoint.auth) {
    headers.authorization = `Bearer ${runConfig.authToken}`;
  }

  if (endpoint.formData) {
    body = endpoint.formData({ sequence });
  } else if (endpoint.body) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.body({ sequence }));
  }

  const startedAtMs = performance.now();

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers,
      body
    });
    const headersAtMs = performance.now();
    await response.arrayBuffer();
    const completedAtMs = performance.now();

    return {
      status: response.status,
      latencyMs: round(completedAtMs - startedAtMs, 2),
      ttfbMs: round(headersAtMs - startedAtMs, 2),
      completedAtMs
    };
  } catch (error) {
    const completedAtMs = performance.now();
    return {
      status: 0,
      error: error.message,
      latencyMs: round(completedAtMs - startedAtMs, 2),
      ttfbMs: round(completedAtMs - startedAtMs, 2),
      completedAtMs
    };
  }
}

async function writeReports(report, failures, resultsDir) {
  await fs.mkdir(path.join(rootDir, resultsDir), { recursive: true });
  const stamp = report.startedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(rootDir, resultsDir, `benchmark-${stamp}.json`);
  const mdPath = path.join(rootDir, resultsDir, `benchmark-${stamp}.md`);

  await fs.writeFile(jsonPath, `${JSON.stringify({ ...report, failures }, null, 2)}\n`);
  await fs.writeFile(mdPath, markdownReport(report, failures));

  console.log(`Wrote ${path.relative(rootDir, jsonPath)}`);
  console.log(`Wrote ${path.relative(rootDir, mdPath)}`);
}

function markdownReport(report, failures) {
  const rows = report.results.map((result) => (
    `| ${result.method} | \`${result.path}\` | ${result.requests} | ${result.rps} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.errorRatePercent} |`
  ));

  return `# API Benchmark Report

- Started: ${report.startedAt}
- Completed: ${report.completedAt}
- Target: ${report.config.targetUrl}
- Duration per endpoint: ${report.config.durationSeconds}s
- Concurrency: ${report.config.concurrency}
- Smoke run: ${report.smoke ? "yes" : "no"}

| Method | Path | Requests | RPS | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Error % |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.join("\n")}

${failures.length === 0 ? "All configured thresholds passed.\n" : `## Threshold Failures\n\n${formatFailures(failures)}\n`}
`;
}

function evaluateThresholds(results, thresholdConfig) {
  const failures = [];

  for (const result of results) {
    const threshold = {
      ...thresholdConfig.defaults,
      ...(thresholdConfig.endpoints?.[result.name] ?? {})
    };

    if (result.latencyMs.p99 > threshold.maxP99Ms) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms exceeded ${threshold.maxP99Ms}ms`);
    }

    if (result.errorRatePercent > threshold.maxErrorRatePercent) {
      failures.push(`${result.name} error rate ${result.errorRatePercent}% exceeded ${threshold.maxErrorRatePercent}%`);
    }
  }

  return failures;
}

function formatFailures(failures) {
  return failures.map((failure) => `- ${failure}`).join("\n");
}

function percentile(values, targetPercentile) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((targetPercentile / 100) * sorted.length) - 1;
  return round(sorted[Math.max(0, Math.min(sorted.length - 1, index))], 2);
}

function percent(part, total) {
  return total === 0 ? 0 : round((part / total) * 100, 2);
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function round(value, places = 2) {
  return Number(value.toFixed(places));
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

async function loadEnvFile(envPath) {
  try {
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const [key, ...valueParts] = trimmed.split("=");
      process.env[key] ??= valueParts.join("=").trim();
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function createHs256Token(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = { ...payload, iat: now, exp: now + 15 * 60 };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(tokenPayload))}`;
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}
