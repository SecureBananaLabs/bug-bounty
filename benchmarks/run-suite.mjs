import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { EventEmitter } from "node:events";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const envFilePath = path.join(projectRoot, ".env.benchmark");
const thresholdsPath = path.join(projectRoot, "benchmarks", "thresholds.json");
const resultsDir = path.join(projectRoot, "benchmarks", "results");
const uploadFixturePath = path.join(projectRoot, "benchmarks", "fixtures", "upload-sample.txt");

await loadEnvFile(envFilePath);

const { createApp } = await import("../apps/api/src/app.js");
const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
const autocannonModule = await import("autocannon");
const autocannon = autocannonModule.default ?? autocannonModule;
const { createEndpointBenchmarks } = await import("./endpoints.mjs");

const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
const mode = process.argv.includes("--smoke") ? "smoke" : "full";
const connections = numberFromEnv(
  mode === "smoke" ? "BENCHMARK_SMOKE_CONNECTIONS" : "BENCHMARK_CONNECTIONS",
  mode === "smoke" ? 2 : 10
);
const durationSeconds = numberFromEnv(
  mode === "smoke" ? "BENCHMARK_SMOKE_DURATION_SECONDS" : "BENCHMARK_DURATION_SECONDS",
  mode === "smoke" ? 1 : 2
);
const warmupSeconds = numberFromEnv(
  mode === "smoke" ? "BENCHMARK_SMOKE_WARMUP_SECONDS" : "BENCHMARK_WARMUP_SECONDS",
  mode === "smoke" ? 0 : 1
);
const pipelining = numberFromEnv("BENCHMARK_PIPELINING", 1);
const baseUrl = process.env.BENCHMARK_BASE_URL?.trim() || (await startLocalServer());
const adminToken = signAccessToken({ sub: "bench_admin", role: "admin" });
const benchmarkDefinitions = createEndpointBenchmarks({ adminToken, uploadFixturePath });
const autocannonRunner = await loadAutocannonRunner();

await fs.mkdir(resultsDir, { recursive: true });

const runId = new Date().toISOString().replace(/[:.]/g, "-");
const summaries = [];

try {
  for (const definition of benchmarkDefinitions) {
    if (warmupSeconds > 0) {
      await executeBenchmark(autocannonRunner, baseUrl, definition, {
        durationSeconds: warmupSeconds,
        connections,
        pipelining,
        title: `${definition.id} warmup`
      });
    }

    const benchmarkRun = await executeBenchmark(autocannonRunner, baseUrl, definition, {
      durationSeconds,
      connections,
      pipelining,
      title: definition.id
    });

    const summary = summarizeBenchmark(definition, benchmarkRun, thresholds);
    summaries.push(summary);

    await fs.writeFile(
      path.join(resultsDir, `${slugify(definition.id)}.json`),
      JSON.stringify(summary, null, 2) + "\n"
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    baseUrl,
    connections,
    durationSeconds,
    warmupSeconds,
    benchmarks: summaries
  };

  const markdown = renderMarkdownReport(report);
  const jsonName = `benchmark-${runId}.json`;
  const mdName = `benchmark-${runId}.md`;

  await fs.writeFile(path.join(resultsDir, jsonName), JSON.stringify(report, null, 2) + "\n");
  await fs.writeFile(path.join(resultsDir, mdName), markdown);
  await fs.writeFile(path.join(resultsDir, "latest.json"), JSON.stringify(report, null, 2) + "\n");
  await fs.writeFile(path.join(resultsDir, "latest.md"), markdown);

  const failed = summaries.filter((entry) => !entry.passed);
  const hasErrors = summaries.some((entry) => entry.errorRate > 0 || entry.non2xx > 0 || entry.errors > 0 || entry.timeouts > 0 || entry.mismatches > 0);

  process.stdout.write(`${markdown}\n`);

  if (mode === "smoke" && failed.length > 0) {
    process.stderr.write("\nSmoke benchmark failed: one or more p99 thresholds were exceeded.\n");
    process.exitCode = 1;
  } else if (hasErrors) {
    process.stderr.write("\nBenchmark failed: one or more endpoints returned errors.\n");
    process.exitCode = 1;
  }
} finally {
  if (typeof globalThis.__benchmarkServerClose === "function") {
    await globalThis.__benchmarkServerClose();
  }
}

async function startLocalServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to determine benchmark server port");
  }

  globalThis.__benchmarkServerClose = () =>
    new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

  return `http://127.0.0.1:${address.port}`;
}

function numberFromEnv(name, fallback) {
  const value = process.env[name];
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function loadEnvFile(filePath) {
  try {
    const contents = await fs.readFile(filePath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex < 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      if (!key || process.env[key] != null) {
        continue;
      }

      process.env[key] = stripQuotes(rawValue);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function executeBenchmark(autocannonFn, baseUrlValue, definition, options) {
  return new Promise((resolve, reject) => {
    const responseTimes = [];
    const runOptions = {
      url: new URL(definition.path, baseUrlValue).toString(),
      method: definition.method,
      headers: definition.headers,
      body: definition.body,
      form: definition.form,
      idReplacement: definition.idReplacement,
      connections: options.connections,
      duration: options.durationSeconds,
      pipelining: options.pipelining,
      title: options.title
    };

    const instance = autocannonFn(runOptions, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ result, responseTimes });
    });

    instance.on("response", (_client, _statusCode, _resBytes, responseTime) => {
      if (Number.isFinite(responseTime)) {
        responseTimes.push(responseTime);
      }
    });
  });
}

async function loadAutocannonRunner() {
  try {
    const autocannonModule = await import("autocannon");
    return autocannonModule.default ?? autocannonModule;
  } catch {
    return createFallbackAutocannon();
  }
}

function createFallbackAutocannon() {
  return function fallbackAutocannon(options, callback) {
    const emitter = new EventEmitter();
    const responseTimes = [];
    const statusCodeStats = {};
    const startedAt = performance.now();
    let completed = 0;
    let errors = 0;
    let timeouts = 0;
    let non2xx = 0;

    queueMicrotask(() => {
      const workers = Math.max(1, Math.floor(options.connections ?? 1));
      const endAt = startedAt + ((options.duration ?? 1) * 1000);

      Promise.all(
        Array.from({ length: workers }, async () => {
          while (performance.now() < endAt) {
            try {
              const startedRequestAt = performance.now();
              const response = await fetch(options.url, {
                method: options.method ?? "GET",
                headers: buildFallbackHeaders(options),
                body: await buildFallbackBody(options)
              });
              const bodyText = await response.text();
              const responseTime = performance.now() - startedRequestAt;

              responseTimes.push(responseTime);
              completed += 1;
              statusCodeStats[response.status] = {
                count: String((Number(statusCodeStats[response.status]?.count ?? 0) || 0) + 1)
              };
              if (response.status < 200 || response.status >= 300) {
                non2xx += 1;
              }

              emitter.emit("response", null, response.status, bodyText.length, responseTime);
            } catch {
              errors += 1;
              timeouts += 1;
            }
          }
        })
      )
        .then(() => {
          const durationSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001);
          const result = {
            title: options.title,
            url: options.url,
            requests: {
              average: completed / durationSeconds
            },
            latency: percentileSummary(responseTimes),
            throughput: { average: 0 },
            duration: durationSeconds,
            errors,
            timeouts,
            mismatches: 0,
            non2xx,
            connections: workers,
            statusCodeStats
          };

          callback?.(null, result);
        })
        .catch((error) => {
          callback?.(error);
        });
    });

    return emitter;
  };
}

function buildFallbackHeaders(options) {
  const headers = { ...(options.headers ?? {}) };
  if (options.body != null && headers["content-type"] == null && headers["Content-Type"] == null) {
    headers["content-type"] = "application/json";
  }
  return headers;
}

async function buildFallbackBody(options) {
  if (options.form) {
    const formData = new FormData();
    for (const [fieldName, field] of Object.entries(options.form)) {
      if (field?.type === "file") {
        const fileBytes = await fs.readFile(field.path);
        const filename = field.options?.filename ?? path.basename(field.path);
        formData.append(fieldName, new Blob([fileBytes]), filename);
      } else {
        formData.append(fieldName, String(field?.value ?? ""));
      }
    }
    return formData;
  }

  if (options.body == null) {
    return undefined;
  }

  if (typeof options.body === "string" && options.idReplacement) {
    return options.body.replace(/\[<id>\]/g, randomId());
  }

  return options.body;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function summarizeBenchmark(definition, benchmarkRun, thresholds) {
  const { result, responseTimes } = benchmarkRun;
  const latencySamples = responseTimes.slice();
  const ttfbSamples = responseTimes.slice();
  const transportFailures = (result.errors ?? 0) + (result.timeouts ?? 0) + (result.mismatches ?? 0);
  const totalCount = latencySamples.length + transportFailures;
  const errorRate = totalCount > 0 ? ((transportFailures + (result.non2xx ?? 0)) / totalCount) * 100 : 0;
  const p99Threshold = thresholds[definition.id];
  const latency = percentileSummary(latencySamples);
  const ttfb = percentileSummary(ttfbSamples);

  return {
    id: definition.id,
    method: definition.method,
    path: definition.path,
    url: result.url,
    connections: result.connections,
    durationSeconds: result.duration,
    requestsPerSecond: round(result.requests?.average ?? 0),
    errorRate: round(errorRate),
    errors: result.errors ?? 0,
    timeouts: result.timeouts ?? 0,
    non2xx: result.non2xx ?? 0,
    mismatches: result.mismatches ?? 0,
    latency,
    ttfb,
    p99Threshold,
    passed: p99Threshold == null ? true : latency.p99 <= p99Threshold,
    sampleCount: latencySamples.length,
    statusCodeStats: result.statusCodeStats ?? {}
  };
}

function percentileSummary(samples) {
  return {
    p50: round(percentile(samples, 50)),
    p95: round(percentile(samples, 95)),
    p99: round(percentile(samples, 99))
  };
}

function percentile(samples, percentileValue) {
  if (!samples.length) {
    return 0;
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const index = (percentileValue / 100) * (sorted.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  if (lowerIndex === upperIndex) {
    return sorted[lowerIndex];
  }

  const lower = sorted[lowerIndex];
  const upper = sorted[upperIndex];
  return lower + (upper - lower) * (index - lowerIndex);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function renderMarkdownReport(report) {
  const lines = [];
  lines.push(`# API Benchmark Suite`);
  lines.push(``);
  lines.push(`- Generated at: \`${report.generatedAt}\``);
  lines.push(`- Mode: \`${report.mode}\``);
  lines.push(`- Base URL: \`${report.baseUrl}\``);
  lines.push(`- Connections: \`${report.connections}\``);
  lines.push(`- Duration: \`${report.durationSeconds}s\``);
  lines.push(``);
  lines.push(`| Endpoint | p50 latency (ms) | p95 latency (ms) | p99 latency (ms) | p99 TTFB (ms) | RPS | Error rate | Threshold | Result |`);
  lines.push(`| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |`);

  for (const benchmark of report.benchmarks) {
    lines.push(
      `| \`${benchmark.id}\` | ${benchmark.latency.p50} | ${benchmark.latency.p95} | ${benchmark.latency.p99} | ${benchmark.ttfb.p99} | ${benchmark.requestsPerSecond} | ${benchmark.errorRate}% | ${benchmark.p99Threshold ?? "n/a"} | ${benchmark.passed ? "pass" : "fail"} |`
    );
  }

  const failedBenchmarks = report.benchmarks.filter((benchmark) => !benchmark.passed);
  if (failedBenchmarks.length > 0) {
    lines.push(``);
    lines.push(`## Threshold failures`);
    for (const benchmark of failedBenchmarks) {
      lines.push(`- \`${benchmark.id}\` p99 latency ${benchmark.latency.p99} ms exceeded threshold ${benchmark.p99Threshold} ms`);
    }
  }

  return `${lines.join("\n")}\n`;
}
