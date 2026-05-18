import autocannon from "autocannon";
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const profile = process.env.BENCHMARK_PROFILE ?? "full";
const isSmoke = profile === "smoke";
const baseUrl = process.env.BENCHMARK_BASE_URL ?? "http://127.0.0.1:4000";
const duration = Number(process.env.BENCHMARK_DURATION_SECONDS ?? (isSmoke ? 1 : 10));
const connections = Number(process.env.BENCHMARK_CONNECTIONS ?? (isSmoke ? 1 : 10));
const overallRate = Number(process.env.BENCHMARK_OVERALL_RATE ?? (isSmoke ? 5 : 50));
const ttfbSamples = Number(process.env.BENCHMARK_TTFB_SAMPLES ?? (isSmoke ? 3 : 10));
const runId = `${Date.now()}`;

const endpoints = await readJson("endpoints.json");
const thresholds = await readJson("thresholds.json");
const authToken = await getBenchmarkToken();
const results = [];

for (const endpoint of endpoints) {
  const request = buildRequest(endpoint, authToken);
  const cannonResult = await runAutocannon({
    url: request.url,
    method: endpoint.method,
    headers: request.headers,
    body: request.body,
    duration,
    connections,
    pipelining: 1,
    overallRate
  });

  const ttfb = await measureTtfbSamples(request, ttfbSamples);
  const summary = summarize(endpoint, cannonResult, ttfb);
  summary.threshold = evaluateThresholds(summary);
  results.push(summary);
  printSummaryLine(summary);
}

const report = {
  generatedAt: new Date().toISOString(),
  profile,
  baseUrl,
  durationSeconds: duration,
  connections,
  overallRate,
  ttfbSamples,
  endpoints: results
};

const outputPaths = await writeReports(report);
const failures = results.filter((result) => !result.threshold.passed);

console.log(`\nWrote JSON report: ${outputPaths.json}`);
console.log(`Wrote Markdown report: ${outputPaths.markdown}`);

if (failures.length > 0) {
  console.error("\nBenchmark thresholds failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}: ${failure.threshold.failures.join("; ")}`);
  }
  process.exitCode = 1;
}

async function readJson(fileName) {
  const filePath = path.join(__dirname, fileName);
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function getBenchmarkToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const response = await fetch(new URL("/api/auth/register", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: `benchmark.admin.${runId}@example.test`,
      password: "BenchmarkPass123!",
      role: "admin"
    })
  });

  if (!response.ok) {
    throw new Error(`Unable to create benchmark auth token: HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.data?.token) {
    throw new Error("Unable to create benchmark auth token: response did not include data.token");
  }

  return payload.data.token;
}

function buildRequest(endpoint, token) {
  const headers = { ...(endpoint.headers ?? {}) };
  let body;

  if (endpoint.body !== undefined) {
    body = JSON.stringify(renderTemplates(endpoint.body));
    headers["content-type"] = headers["content-type"] ?? "application/json";
  }

  if (endpoint.multipart) {
    const boundary = `----benchmark-${runId}`;
    const part = endpoint.multipart;
    body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${part.field}"; filename="${part.filename}"`,
      `Content-Type: ${part.contentType}`,
      "",
      part.content,
      `--${boundary}--`,
      ""
    ].join("\r\n");
    headers["content-type"] = `multipart/form-data; boundary=${boundary}`;
  }

  if (endpoint.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  return {
    url: new URL(endpoint.path, baseUrl).toString(),
    method: endpoint.method,
    headers,
    body
  };
}

function renderTemplates(value) {
  if (typeof value === "string") {
    return value.replaceAll("{{runId}}", runId);
  }

  if (Array.isArray(value)) {
    return value.map(renderTemplates);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renderTemplates(item)]));
  }

  return value;
}

function runAutocannon(options) {
  return new Promise((resolve, reject) => {
    autocannon(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

async function measureTtfbSamples(request, sampleCount) {
  const samples = [];
  for (let i = 0; i < sampleCount; i++) {
    samples.push(await measureTtfb(request));
  }
  return samples;
}

function measureTtfb(request) {
  return new Promise((resolve, reject) => {
    const url = new URL(request.url);
    const client = url.protocol === "https:" ? https : http;
    const startedAt = performance.now();
    const req = client.request(url, {
      method: request.method,
      headers: request.headers
    }, (res) => {
      const elapsed = performance.now() - startedAt;
      res.resume();
      res.on("end", () => resolve(Number(elapsed.toFixed(2))));
    });

    req.setTimeout(5000, () => {
      req.destroy(new Error(`TTFB request timed out for ${request.method} ${request.url}`));
    });

    req.on("error", reject);
    if (request.body !== undefined) {
      req.write(request.body);
    }
    req.end();
  });
}

function summarize(endpoint, result, ttfbSamples) {
  const totalRequests = result.requests.total ?? 0;
  const non2xx = result.non2xx ?? 0;
  const errors = (result.errors ?? 0) + (result.timeouts ?? 0) + non2xx;
  const errorRatePct = totalRequests === 0 ? 100 : (errors / totalRequests) * 100;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    latencyMs: {
      p50: result.latency.p50,
      p95: result.latency.p95 ?? result.latency.p97_5,
      p99: result.latency.p99,
      average: result.latency.average,
      max: result.latency.max
    },
    ttfbMs: {
      p50: percentile(ttfbSamples, 50),
      p95: percentile(ttfbSamples, 95),
      p99: percentile(ttfbSamples, 99),
      max: Math.max(...ttfbSamples)
    },
    requestsPerSecond: {
      sustained: result.requests.average,
      peak: result.requests.max,
      total: totalRequests
    },
    throughputBytesPerSecond: {
      sustained: result.throughput.average,
      peak: result.throughput.max,
      total: result.throughput.total
    },
    errorRatePct,
    errors,
    non2xx,
    statusCodes: result.statusCodeStats
  };
}

function evaluateThresholds(summary) {
  const endpointThreshold = thresholds.endpoints?.[summary.name] ?? {};
  const threshold = { ...thresholds.default, ...endpointThreshold };
  const failures = [];

  if (summary.latencyMs.p99 > threshold.maxP99LatencyMs) {
    failures.push(`p99 latency ${summary.latencyMs.p99}ms > ${threshold.maxP99LatencyMs}ms`);
  }

  if (summary.ttfbMs.p99 > threshold.maxP99TtfbMs) {
    failures.push(`p99 TTFB ${summary.ttfbMs.p99}ms > ${threshold.maxP99TtfbMs}ms`);
  }

  if (summary.errorRatePct > threshold.maxErrorRatePct) {
    failures.push(`error rate ${summary.errorRatePct.toFixed(2)}% > ${threshold.maxErrorRatePct}%`);
  }

  return { ...threshold, passed: failures.length === 0, failures };
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return Number(sorted[index].toFixed(2));
}

async function writeReports(report) {
  const resultsDir = path.join(__dirname, "results");
  await fs.mkdir(resultsDir, { recursive: true });

  const timestamp = report.generatedAt.replaceAll(":", "-").replaceAll(".", "-");
  const jsonPath = path.join(resultsDir, `benchmark-${report.profile}-${timestamp}.json`);
  const markdownPath = path.join(resultsDir, `benchmark-${report.profile}-${timestamp}.md`);

  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, toMarkdown(report));

  return { json: jsonPath, markdown: markdownPath };
}

function toMarkdown(report) {
  const rows = report.endpoints.map((endpoint) => [
    endpoint.threshold.passed ? "pass" : "fail",
    endpoint.name,
    `${endpoint.method} ${endpoint.path}`,
    fixed(endpoint.latencyMs.p50),
    fixed(endpoint.latencyMs.p95),
    fixed(endpoint.latencyMs.p99),
    fixed(endpoint.ttfbMs.p99),
    fixed(endpoint.requestsPerSecond.sustained),
    fixed(endpoint.requestsPerSecond.peak),
    fixed(endpoint.errorRatePct)
  ]);

  return [
    `# API Benchmark Report`,
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Profile: ${report.profile}`,
    "",
    `Base URL: ${report.baseUrl}`,
    "",
    `Duration: ${report.durationSeconds}s per endpoint`,
    "",
    `Connections: ${report.connections}`,
    "",
    `Overall rate: ${report.overallRate} req/s`,
    "",
    "| Result | Endpoint | Route | p50 ms | p95 ms | p99 ms | p99 TTFB ms | Sustained RPS | Peak RPS | Error % |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    ""
  ].join("\n");
}

function fixed(value) {
  return Number.isFinite(value) ? Number(value).toFixed(2) : "0.00";
}

function printSummaryLine(summary) {
  const status = summary.threshold.passed ? "PASS" : "FAIL";
  console.log(
    `${status} ${summary.method} ${summary.path} ` +
      `p99=${fixed(summary.latencyMs.p99)}ms ` +
      `ttfb99=${fixed(summary.ttfbMs.p99)}ms ` +
      `rps=${fixed(summary.requestsPerSecond.sustained)} ` +
      `errors=${fixed(summary.errorRatePct)}%`
  );
}
