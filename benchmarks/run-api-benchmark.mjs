import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const args = new Set(process.argv.slice(2));

loadEnvFile(process.env.BENCHMARK_ENV_FILE ?? path.join(scriptDir, ".env.benchmark"));

const config = {
  baseUrl: process.env.BENCHMARK_BASE_URL ?? "http://127.0.0.1:4000",
  scenarioFile: process.env.BENCHMARK_SCENARIO_FILE ?? path.join(scriptDir, "api-scenarios.json"),
  thresholdFile: process.env.BENCHMARK_THRESHOLD_FILE ?? path.join(scriptDir, "thresholds.json"),
  resultsDir: process.env.BENCHMARK_RESULTS_DIR ?? path.join(scriptDir, "results"),
  concurrency: readPositiveInt(process.env.BENCHMARK_CONCURRENCY, args.has("--smoke") ? 1 : 2),
  requestsPerEndpoint: readPositiveInt(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT, args.has("--smoke") ? 2 : 5),
  timeoutMs: readPositiveInt(process.env.BENCHMARK_TIMEOUT_MS, 10000),
  gate: args.has("--gate")
};

const runId = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const benchmarkToken = process.env.BENCHMARK_AUTH_TOKEN ?? createBenchmarkJwt(
  process.env.BENCHMARK_AUTH_SECRET ?? process.env.JWT_SECRET ?? "development-secret"
);

const scenarios = JSON.parse(await readFile(config.scenarioFile, "utf8"));
const thresholds = existsSync(config.thresholdFile)
  ? JSON.parse(await readFile(config.thresholdFile, "utf8"))
  : { defaults: {}, endpoints: {} };

const suiteStartedAt = new Date();
const summaries = [];

for (const scenario of scenarios) {
  summaries.push(await runScenario(scenario));
}

const suiteFinishedAt = new Date();
const report = {
  runId,
  startedAt: suiteStartedAt.toISOString(),
  finishedAt: suiteFinishedAt.toISOString(),
  durationMs: suiteFinishedAt.getTime() - suiteStartedAt.getTime(),
  config: {
    baseUrl: config.baseUrl,
    concurrency: config.concurrency,
    requestsPerEndpoint: config.requestsPerEndpoint,
    timeoutMs: config.timeoutMs,
    gate: config.gate
  },
  environment: collectEnvironment(),
  summaries,
  thresholdFailures: config.gate ? evaluateThresholds(summaries) : []
};

await mkdir(config.resultsDir, { recursive: true });
const jsonPath = path.join(config.resultsDir, `api-benchmark-${runId}.json`);
const markdownPath = path.join(config.resultsDir, `api-benchmark-${runId}.md`);

await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(markdownPath, renderMarkdown(report));

console.log(`Benchmark complete: ${summaries.length} endpoints`);
console.log(`JSON: ${path.relative(repoRoot, jsonPath)}`);
console.log(`Markdown: ${path.relative(repoRoot, markdownPath)}`);

if (report.thresholdFailures.length > 0) {
  console.error("Benchmark threshold failures:");
  for (const failure of report.thresholdFailures) {
    console.error(`- ${failure.endpoint}: ${failure.message}`);
  }
  process.exitCode = 1;
}

async function runScenario(scenario) {
  const totalRequests = config.requestsPerEndpoint;
  const workerCount = Math.min(config.concurrency, totalRequests);
  const samples = [];
  let cursor = 0;
  const startedAt = performance.now();
  const startedWallClock = Date.now();

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (cursor < totalRequests) {
      const iteration = cursor;
      cursor += 1;
      samples.push(await sendScenarioRequest(scenario, iteration, startedWallClock));
    }
  }));

  const durationMs = performance.now() - startedAt;
  return summarizeScenario(scenario, samples, durationMs);
}

async function sendScenarioRequest(scenario, iteration, startedWallClock) {
  const requestStartedAt = performance.now();
  const requestStartedWallClock = Date.now();
  try {
    const response = await request({
      url: new URL(renderTemplate(scenario.path, iteration), config.baseUrl),
      method: scenario.method,
      headers: buildHeaders(scenario, iteration),
      body: buildBody(scenario, iteration),
      timeoutMs: config.timeoutMs
    });

    return {
      ok: response.statusCode < 400,
      statusCode: response.statusCode,
      latencyMs: response.durationMs,
      ttfbMs: response.ttfbMs,
      endedAtMs: Date.now() - startedWallClock,
      startedAt: new Date(requestStartedWallClock).toISOString()
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: 0,
      latencyMs: performance.now() - requestStartedAt,
      ttfbMs: null,
      endedAtMs: Date.now() - startedWallClock,
      startedAt: new Date(requestStartedWallClock).toISOString(),
      error: error.message
    };
  }
}

function request({ url, method, headers, body, timeoutMs }) {
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    let firstByteAt = null;
    const req = client.request(url, {
      method,
      headers,
      timeout: timeoutMs
    }, (res) => {
      res.once("data", () => {
        firstByteAt = performance.now();
      });

      res.resume();
      res.on("end", () => {
        const endedAt = performance.now();
        resolve({
          statusCode: res.statusCode ?? 0,
          durationMs: endedAt - startedAt,
          ttfbMs: (firstByteAt ?? endedAt) - startedAt
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.on("error", reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function buildHeaders(scenario, iteration) {
  const headers = {
    Accept: "application/json",
    ...scenario.headers
  };

  if (scenario.auth === "benchmark") {
    headers.Authorization = `Bearer ${benchmarkToken}`;
  }

  if (scenario.bodyType === "multipart") {
    const boundary = multipartBoundary(scenario.name, iteration);
    headers["Content-Type"] = `multipart/form-data; boundary=${boundary}`;
    headers["Content-Length"] = buildMultipartBody(scenario, iteration).length;
    return headers;
  }

  if (scenario.body) {
    const body = Buffer.from(JSON.stringify(renderTemplateValues(scenario.body, iteration)));
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = body.length;
  }

  return headers;
}

function buildBody(scenario, iteration) {
  if (scenario.bodyType === "multipart") {
    return buildMultipartBody(scenario, iteration);
  }

  if (!scenario.body) {
    return null;
  }

  return Buffer.from(JSON.stringify(renderTemplateValues(scenario.body, iteration)));
}

function buildMultipartBody(scenario, iteration) {
  const boundary = multipartBoundary(scenario.name, iteration);
  const file = scenario.multipart;
  const content = renderTemplate(file.content, iteration);
  const lines = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"`,
    `Content-Type: ${file.contentType}`,
    "",
    content,
    `--${boundary}--`,
    ""
  ];

  return Buffer.from(lines.join("\r\n"));
}

function multipartBoundary(name, iteration) {
  return `----freelanceflow-benchmark-${name.replaceAll(".", "-")}-${iteration}`;
}

function summarizeScenario(scenario, samples, durationMs) {
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfbSamples = samples
    .map((sample) => sample.ttfbMs)
    .filter((value) => typeof value === "number")
    .sort((a, b) => a - b);
  const statusCounts = samples.reduce((acc, sample) => {
    acc[sample.statusCode] = (acc[sample.statusCode] ?? 0) + 1;
    return acc;
  }, {});
  const errors = samples.filter((sample) => !sample.ok).length;
  const seconds = Math.max(durationMs / 1000, 0.001);

  return {
    name: scenario.name,
    method: scenario.method,
    path: scenario.path,
    requests: samples.length,
    errors,
    errorRatePercent: round((errors / samples.length) * 100),
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99))
    },
    ttfbMs: {
      p50: round(percentile(ttfbSamples, 50)),
      p95: round(percentile(ttfbSamples, 95)),
      p99: round(percentile(ttfbSamples, 99))
    },
    rps: {
      sustained: round(samples.length / seconds),
      peak: peakRps(samples)
    },
    statusCounts,
    durationMs: round(durationMs)
  };
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.min(values.length - 1, Math.ceil((percentileValue / 100) * values.length) - 1);
  return values[index];
}

function peakRps(samples) {
  const buckets = samples.reduce((acc, sample) => {
    const bucket = Math.floor(sample.endedAtMs / 1000);
    acc[bucket] = (acc[bucket] ?? 0) + 1;
    return acc;
  }, {});

  return Math.max(...Object.values(buckets), 0);
}

function evaluateThresholds(results) {
  const failures = [];

  for (const result of results) {
    const threshold = {
      ...(thresholds.defaults ?? {}),
      ...((thresholds.endpoints ?? {})[result.name] ?? {})
    };

    if (threshold.p99Ms !== undefined && result.latencyMs.p99 > threshold.p99Ms) {
      failures.push({
        endpoint: result.name,
        message: `p99 ${result.latencyMs.p99}ms exceeded ${threshold.p99Ms}ms`
      });
    }

    if (threshold.maxErrorRatePercent !== undefined && result.errorRatePercent > threshold.maxErrorRatePercent) {
      failures.push({
        endpoint: result.name,
        message: `error rate ${result.errorRatePercent}% exceeded ${threshold.maxErrorRatePercent}%`
      });
    }

    if (threshold.minSustainedRps !== undefined && result.rps.sustained < threshold.minSustainedRps) {
      failures.push({
        endpoint: result.name,
        message: `sustained RPS ${result.rps.sustained} fell below ${threshold.minSustainedRps}`
      });
    }
  }

  return failures;
}

function renderMarkdown(report) {
  const environment = report.environment;
  const rows = report.summaries.map((summary) => [
    summary.name,
    summary.method,
    summary.path,
    summary.requests,
    summary.latencyMs.p50,
    summary.latencyMs.p95,
    summary.latencyMs.p99,
    summary.ttfbMs.p95,
    summary.rps.sustained,
    summary.rps.peak,
    summary.errorRatePercent
  ].join(" | "));

  const thresholdSummary = report.thresholdFailures.length === 0
    ? "No threshold failures."
    : report.thresholdFailures.map((failure) => `- ${failure.endpoint}: ${failure.message}`).join("\n");

  return `# API Benchmark Report

- Run ID: ${report.runId}
- Target: ${report.config.baseUrl}
- Started: ${report.startedAt}
- Duration: ${round(report.durationMs)}ms
- Concurrency: ${report.config.concurrency}
- Requests per endpoint: ${report.config.requestsPerEndpoint}
- Runtime: Node.js ${environment.nodeVersion}
- OS: ${environment.platform} ${environment.release} ${environment.arch}
- CPU: ${environment.cpuModel} (${environment.cpuCount} cores)
- Memory: ${environment.totalMemoryMb}MB total, ${environment.freeMemoryMb}MB free at start

| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.join("\n")}

## Threshold Gate

${thresholdSummary}
`;
}

function collectEnvironment() {
  const cpus = os.cpus();

  return {
    nodeVersion: process.version,
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpuModel: cpus[0]?.model ?? "unknown",
    cpuCount: cpus.length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024)
  };
}

function createBenchmarkJwt(secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "benchmark_agent",
    role: "admin",
    iat: now,
    exp: now + 60 * 60
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function renderTemplateValues(value, iteration) {
  if (Array.isArray(value)) {
    return value.map((item) => renderTemplateValues(item, iteration));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, renderTemplateValues(item, iteration)])
    );
  }

  if (typeof value === "string") {
    return renderTemplate(value, iteration);
  }

  return value;
}

function renderTemplate(value, iteration) {
  return value
    .replaceAll("{{runId}}", runId)
    .replaceAll("{{iteration}}", String(iteration));
}

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function loadEnvFile(file) {
  if (!existsSync(file)) {
    return;
  }

  const contents = readFileSync(file, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
    }
  }
}
