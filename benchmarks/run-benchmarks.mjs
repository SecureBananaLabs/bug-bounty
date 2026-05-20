import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { benchmarkRoutes } from "./routes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");
const envFiles = [
  path.join(repoRoot, ".env.benchmark"),
  path.join(repoRoot, ".env.benchmark.local")
];

function loadEnvFiles() {
  for (const file of envFiles) {
    if (!fs.existsSync(file)) continue;
    for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const [key, ...rest] = line.split("=");
      if (!process.env[key]) {
        process.env[key] = rest.join("=").replace(/^['\"]|['\"]$/g, "");
      }
    }
  }
}

function getArg(name, fallback) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return inline ? inline.slice(flag.length + 1) : fallback;
}

function boolArg(name) {
  return process.argv.includes(`--${name}`) || process.env.BENCHMARK_SMOKE === "true";
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function median(values) {
  return percentile(values, 50);
}

function signBenchmarkToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) return process.env.BENCHMARK_AUTH_TOKEN;
  const secret = process.env.JWT_SECRET ?? "development-secret";
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: "benchmark-admin",
    role: "admin",
    scope: "benchmark",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function buildMultipartBody(definition) {
  const boundary = `----benchmark-${crypto.randomBytes(8).toString("hex")}`;
  const chunks = [];
  for (const [name, value] of Object.entries(definition.fields ?? {})) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  }
  if (definition.file) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${definition.file.fieldName}"; filename="${definition.file.filename}"\r\nContent-Type: ${definition.file.contentType}\r\n\r\n`));
    chunks.push(Buffer.from(definition.file.content));
    chunks.push(Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    body: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

async function startLocalServerIfNeeded(targetUrl) {
  if (targetUrl) return { targetUrl, close: async () => {} };
  process.env.NODE_ENV = process.env.NODE_ENV ?? "benchmark";
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? "development-secret";
  const { createApp } = await import(path.join(repoRoot, "apps/api/src/app.js"));
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    targetUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

function makeRequestOptions(url, route, token) {
  const headers = {
    "user-agent": "freelanceflow-api-benchmark/1.0",
    accept: "application/json"
  };
  let body;
  if (route.body) {
    body = Buffer.from(JSON.stringify(route.body()));
    headers["content-type"] = "application/json";
    headers["content-length"] = body.length;
  }
  if (route.multipart) {
    const multipart = buildMultipartBody(route.multipart());
    body = multipart.body;
    headers["content-type"] = multipart.contentType;
    headers["content-length"] = body.length;
  }
  if (route.auth) headers.authorization = `Bearer ${token}`;
  return { url, options: { method: route.method, headers }, body };
}

function executeRequest(baseUrl, route, token) {
  return new Promise((resolve) => {
    const url = new URL(route.path, baseUrl);
    const transport = url.protocol === "https:" ? https : http;
    const { options, body } = makeRequestOptions(url, route, token);
    const started = process.hrtime.bigint();
    let ttfbMs = 0;
    const req = transport.request(url, options, (res) => {
      ttfbMs = Number(process.hrtime.bigint() - started) / 1e6;
      res.resume();
      res.on("end", () => {
        const totalMs = Number(process.hrtime.bigint() - started) / 1e6;
        resolve({
          statusCode: res.statusCode ?? 0,
          latencyMs: totalMs,
          ttfbMs,
          ok: route.expectedStatuses.includes(res.statusCode ?? 0)
        });
      });
    });
    req.setTimeout(Number(process.env.BENCHMARK_TIMEOUT_MS ?? 10000), () => req.destroy(new Error("request timeout")));
    req.on("error", (error) => {
      const totalMs = Number(process.hrtime.bigint() - started) / 1e6;
      resolve({ statusCode: 0, latencyMs: totalMs, ttfbMs: ttfbMs || totalMs, ok: false, error: error.message });
    });
    if (body) req.write(body);
    req.end();
  });
}

async function runRoute(baseUrl, route, config, token) {
  for (let i = 0; i < config.warmupRequests; i += 1) {
    await executeRequest(baseUrl, route, token);
  }

  let nextIndex = 0;
  const responses = [];
  const started = process.hrtime.bigint();

  async function worker() {
    while (nextIndex < config.requestsPerEndpoint) {
      nextIndex += 1;
      responses.push(await executeRequest(baseUrl, route, token));
    }
  }

  await Promise.all(Array.from({ length: config.concurrency }, worker));
  const durationSeconds = Number(process.hrtime.bigint() - started) / 1e9;
  const latencies = responses.map((response) => response.latencyMs);
  const ttfbs = responses.map((response) => response.ttfbMs);
  const errors = responses.filter((response) => !response.ok);
  const statusCounts = responses.reduce((acc, response) => {
    acc[response.statusCode] = (acc[response.statusCode] ?? 0) + 1;
    return acc;
  }, {});

  const sustainedRps = responses.length / Math.max(durationSeconds, 0.001);
  const peakRps = Math.min(config.concurrency / Math.max(median(latencies) / 1000, 0.001), sustainedRps * config.concurrency);

  return {
    id: route.id,
    method: route.method,
    path: route.path,
    description: route.description,
    expectedStatuses: route.expectedStatuses,
    requests: responses.length,
    concurrency: config.concurrency,
    durationSeconds: Number(durationSeconds.toFixed(3)),
    latencyMs: {
      p50: Number(percentile(latencies, 50).toFixed(2)),
      p95: Number(percentile(latencies, 95).toFixed(2)),
      p99: Number(percentile(latencies, 99).toFixed(2))
    },
    ttfbMs: {
      p50: Number(percentile(ttfbs, 50).toFixed(2)),
      p95: Number(percentile(ttfbs, 95).toFixed(2)),
      p99: Number(percentile(ttfbs, 99).toFixed(2))
    },
    rps: {
      sustained: Number(sustainedRps.toFixed(2)),
      peakEstimate: Number(peakRps.toFixed(2))
    },
    errorRatePercent: Number(((errors.length / Math.max(responses.length, 1)) * 100).toFixed(2)),
    statusCounts,
    sampleError: errors.find((response) => response.error)?.error
  };
}

function renderMarkdown(report) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `Generated: ${report.generatedAt}`,
    `Target: \`${report.targetUrl}\``,
    `Mode: ${report.config.smoke ? "smoke" : "full"}`,
    `Requests per endpoint: ${report.config.requestsPerEndpoint}`,
    `Concurrency: ${report.config.concurrency}`,
    `Warmup requests per endpoint: ${report.config.warmupRequests}`,
    "",
    "## Environment",
    "",
    `- CPU: ${report.environment.cpuModel} (${report.environment.cpuCount} logical cores)`,
    `- RAM: ${report.environment.totalRamGb} GB total, ${report.environment.freeRamGb} GB free at start`,
    `- OS: ${report.environment.os}`,
    `- Node.js: ${report.environment.nodeVersion}`,
    `- Network: ${report.environment.network}`,
    "",
    "## Results",
    "",
    "| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS est. | Error % | Statuses |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of report.results) {
    lines.push(`| ${result.method} ${result.path} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.rps.sustained} | ${result.rps.peakEstimate} | ${result.errorRatePercent} | ${Object.entries(result.statusCounts).map(([status, count]) => `${status}:${count}`).join(", ")} |`);
  }

  lines.push("", "## Regression Gate", "");
  if (report.regression.failures.length === 0) {
    lines.push("All configured thresholds passed.");
  } else {
    for (const failure of report.regression.failures) {
      lines.push(`- ${failure.id}: ${failure.metric} ${failure.actual} exceeded threshold ${failure.threshold}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function evaluateThresholds(results) {
  const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf8"));
  const defaults = thresholds.defaults ?? {};
  const endpointThresholds = thresholds.endpoints ?? {};
  const failures = [];
  for (const result of results) {
    const threshold = { ...defaults, ...(endpointThresholds[result.id] ?? {}) };
    if (threshold.p99LatencyMs !== undefined && result.latencyMs.p99 > threshold.p99LatencyMs) {
      failures.push({ id: result.id, metric: "p99LatencyMs", actual: result.latencyMs.p99, threshold: threshold.p99LatencyMs });
    }
    if (threshold.errorRatePercent !== undefined && result.errorRatePercent > threshold.errorRatePercent) {
      failures.push({ id: result.id, metric: "errorRatePercent", actual: result.errorRatePercent, threshold: threshold.errorRatePercent });
    }
  }
  return { thresholds, failures };
}

function captureEnvironment() {
  const cpus = os.cpus();
  return {
    cpuModel: cpus[0]?.model ?? "unknown",
    cpuCount: cpus.length,
    totalRamGb: Number((os.totalmem() / 1024 ** 3).toFixed(2)),
    freeRamGb: Number((os.freemem() / 1024 ** 3).toFixed(2)),
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    nodeVersion: process.version,
    network: process.env.BENCHMARK_TARGET_URL ? "configured target network" : "local loopback",
    machineType: process.env.BENCHMARK_MACHINE_TYPE ?? "local/CI runner"
  };
}

async function main() {
  loadEnvFiles();
  const smoke = boolArg("smoke");
  const config = {
    smoke,
    requestsPerEndpoint: Number(getArg("requests", process.env.BENCHMARK_REQUESTS_PER_ENDPOINT ?? (smoke ? 2 : 8))),
    concurrency: Number(getArg("concurrency", process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 1 : 2))),
    warmupRequests: Number(getArg("warmup", process.env.BENCHMARK_WARMUP_REQUESTS ?? (smoke ? 0 : 1)))
  };

  fs.mkdirSync(resultsDir, { recursive: true });
  const server = await startLocalServerIfNeeded(process.env.BENCHMARK_TARGET_URL);
  const token = signBenchmarkToken();
  const results = [];

  try {
    for (const route of benchmarkRoutes) {
      results.push(await runRoute(server.targetUrl, route, config, token));
    }
  } finally {
    await server.close();
  }

  const regression = evaluateThresholds(results);
  const report = {
    generatedAt: new Date().toISOString(),
    targetUrl: server.targetUrl,
    config,
    environment: captureEnvironment(),
    routesCovered: benchmarkRoutes.map(({ id, method, path }) => ({ id, method, path })),
    results,
    regression
  };

  const timestamp = report.generatedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDir, `${smoke ? "smoke" : "full"}-${timestamp}.json`);
  const mdPath = path.join(resultsDir, `${smoke ? "smoke" : "full"}-${timestamp}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, renderMarkdown(report));

  console.log(`Benchmark JSON: ${path.relative(repoRoot, jsonPath)}`);
  console.log(`Benchmark Markdown: ${path.relative(repoRoot, mdPath)}`);
  console.log(`Routes covered: ${benchmarkRoutes.length}`);
  if (regression.failures.length > 0) {
    console.error("Regression threshold failures:");
    for (const failure of regression.failures) {
      console.error(`- ${failure.id}: ${failure.metric} ${failure.actual} > ${failure.threshold}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
