import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

await loadBenchmarkEnv();

const args = new Set(process.argv.slice(2));
const smokeMode = args.has("--smoke");
const checkThresholds = args.has("--check-thresholds");
const requestsPerEndpoint = getNumberEnv(
  "BENCHMARK_REQUESTS_PER_ENDPOINT",
  smokeMode ? 2 : 6
);
const concurrency = getNumberEnv("BENCHMARK_CONCURRENCY", smokeMode ? 1 : 2);
const timeoutMs = getNumberEnv("BENCHMARK_TIMEOUT_MS", 5000);
const outputDir = path.resolve(
  repoRoot,
  process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results"
);

const { targetUrl, closeServer } = await resolveTargetUrl();
const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
const tokens = {
  admin: signAccessToken({ sub: "usr_benchmark_admin", role: "admin" }),
  client: signAccessToken({ sub: "usr_benchmark_client", role: "client" })
};

const endpoints = createEndpointInventory();
const runStartedAt = new Date();
const systemInfo = getSystemInfo();
const runStarted = performance.now();
const endpointResults = [];

try {
  for (const endpoint of endpoints) {
    endpointResults.push(await runEndpoint(endpoint));
  }
} finally {
  if (closeServer) {
    await closeServer();
  }
}

const runDurationMs = performance.now() - runStarted;
const report = {
  run: {
    mode: smokeMode ? "smoke" : "full",
    startedAt: runStartedAt.toISOString(),
    durationMs: round(runDurationMs, 2),
    target: process.env.BENCHMARK_TARGET_URL ? targetUrl : "local in-process Express app",
    ...systemInfo
  },
  config: {
    requestsPerEndpoint,
    concurrency,
    timeoutMs
  },
  endpoints: endpointResults
};

const thresholdFailures = checkThresholds
  ? await evaluateThresholds(report)
  : [];
report.thresholds = {
  checked: checkThresholds,
  failures: thresholdFailures
};

await writeReports(report);
printConsoleSummary(report);

if (thresholdFailures.length > 0) {
  process.exitCode = 1;
}

async function resolveTargetUrl() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {
      targetUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, ""),
      closeServer: null
    };
  }

  process.env.NODE_ENV ??= "benchmark";
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.on("error", reject);
  });
  const address = server.address();

  return {
    targetUrl: `http://127.0.0.1:${address.port}`,
    closeServer: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

function createEndpointInventory() {
  return [
    endpoint("health", "GET", "/health"),
    endpoint("auth.register", "POST", "/api/auth/register", {
      json: (iteration) => ({
        email: `benchmark+${Date.now()}-${iteration}@example.com`,
        password: "correct-horse-battery-staple",
        role: iteration % 2 === 0 ? "client" : "freelancer"
      }),
      expectedStatuses: [201]
    }),
    endpoint("auth.login", "POST", "/api/auth/login", {
      json: (iteration) => ({
        email: `benchmark-login-${iteration}@example.com`,
        password: "correct-horse-battery-staple"
      })
    }),
    endpoint("auth.oauth.github", "GET", "/api/auth/oauth/github/callback"),
    endpoint("auth.refresh", "POST", "/api/auth/refresh", {
      json: () => ({ refreshToken: "benchmark-refresh-token" })
    }),
    endpoint("users.list", "GET", "/api/users"),
    endpoint("users.create", "POST", "/api/users", {
      json: (iteration) => ({
        email: `benchmark-user-${Date.now()}-${iteration}@example.com`,
        name: `Benchmark Client ${iteration}`,
        role: "client",
        company: "Acme Benchmarking Ltd",
        bio: "Synthetic client profile used to exercise create-user latency."
      }),
      expectedStatuses: [201]
    }),
    endpoint("jobs.list", "GET", "/api/jobs"),
    endpoint("jobs.create", "POST", "/api/jobs", {
      json: (iteration) => ({
        title: `Build conversion dashboard ${iteration}`,
        description: "Design and implement a dashboard that reports funnel conversion, cohort health, and project delivery risks for a marketplace operations team.",
        budgetMin: 1200,
        budgetMax: 3500,
        categoryId: "cat_analytics",
        skills: ["react", "node", "analytics", "accessibility"]
      }),
      expectedStatuses: [201]
    }),
    endpoint("proposals.list", "GET", "/api/proposals"),
    endpoint("proposals.create", "POST", "/api/proposals", {
      json: (iteration) => ({
        jobId: `job_benchmark_${iteration}`,
        freelancerId: "usr_benchmark_freelancer",
        coverLetter: "I have shipped marketplace dashboards with clear milestones, accessible states, and measurable success criteria.",
        bidAmount: 2400,
        estDuration: "3 weeks"
      }),
      expectedStatuses: [201]
    }),
    endpoint("payments.create", "POST", "/api/payments", {
      json: (iteration) => ({
        jobId: `job_benchmark_${iteration}`,
        clientId: "usr_benchmark_client",
        freelancerId: "usr_benchmark_freelancer",
        amount: 2400,
        currency: "usd"
      }),
      expectedStatuses: [201]
    }),
    endpoint("reviews.list", "GET", "/api/reviews"),
    endpoint("reviews.create", "POST", "/api/reviews", {
      json: (iteration) => ({
        jobId: `job_benchmark_${iteration}`,
        reviewerId: "usr_benchmark_client",
        revieweeId: "usr_benchmark_freelancer",
        rating: 5,
        comment: "Delivered on time with clear communication and production-ready handoff notes."
      }),
      expectedStatuses: [201]
    }),
    endpoint("messages.list", "GET", "/api/messages"),
    endpoint("messages.create", "POST", "/api/messages", {
      json: (iteration) => ({
        senderId: "usr_benchmark_client",
        recipientId: "usr_benchmark_freelancer",
        jobId: `job_benchmark_${iteration}`,
        body: "Can you confirm the milestone demo and acceptance checklist for tomorrow?"
      }),
      expectedStatuses: [201]
    }),
    endpoint("notifications.list", "GET", "/api/notifications"),
    endpoint("notifications.create", "POST", "/api/notifications", {
      json: (iteration) => ({
        userId: "usr_benchmark_client",
        type: "proposal_received",
        title: "New proposal received",
        message: `Benchmark notification ${iteration} for proposal review.`
      }),
      expectedStatuses: [201]
    }),
    endpoint("uploads.create", "POST", "/api/uploads", {
      multipart: (iteration) => ({
        fieldName: "file",
        filename: `benchmark-${iteration}.txt`,
        contentType: "text/plain",
        content: "Synthetic benchmark attachment with enough text to exercise multipart parsing.\n"
      }),
      expectedStatuses: [201]
    }),
    endpoint("search.global", "GET", "/api/search?q=dashboard%20analytics%20react"),
    endpoint("admin.metrics", "GET", "/api/admin/metrics", {
      auth: "admin"
    })
  ];
}

function endpoint(id, method, routePath, options = {}) {
  return {
    id,
    method,
    path: routePath,
    expectedStatuses: options.expectedStatuses ?? [200],
    auth: options.auth ?? null,
    json: options.json,
    multipart: options.multipart
  };
}

async function runEndpoint(endpointConfig) {
  const samples = [];
  const started = performance.now();
  let nextIteration = 0;

  async function worker() {
    while (nextIteration < requestsPerEndpoint) {
      const iteration = nextIteration;
      nextIteration += 1;
      samples.push(await sendRequest(endpointConfig, iteration));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  const elapsedMs = performance.now() - started;
  const successful = samples.filter((sample) => sample.ok);
  const measured = successful.length > 0 ? successful : samples;
  const durations = measured.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const ttfbValues = measured
    .map((sample) => sample.ttfbMs)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  const statusCounts = countBy(samples, (sample) => String(sample.statusCode ?? "network_error"));
  const errors = samples.filter((sample) => !sample.ok);
  const peakRps = calculatePeakRps(samples, started);

  return {
    id: endpointConfig.id,
    method: endpointConfig.method,
    path: endpointConfig.path,
    requests: samples.length,
    expectedStatuses: endpointConfig.expectedStatuses,
    statusCounts,
    p50LatencyMs: percentile(durations, 50),
    p95LatencyMs: percentile(durations, 95),
    p99LatencyMs: percentile(durations, 99),
    avgTtfbMs: average(ttfbValues),
    p95TtfbMs: percentile(ttfbValues, 95),
    sustainedRps: round(samples.length / (elapsedMs / 1000), 2),
    peakRps,
    errorRatePct: round((errors.length / samples.length) * 100, 2),
    errors: errors.slice(0, 3).map((sample) => sample.error ?? `HTTP ${sample.statusCode}`)
  };
}

async function sendRequest(endpointConfig, iteration) {
  const requestStarted = performance.now();
  const requestSpec = buildRequestSpec(endpointConfig, iteration);
  const url = new URL(requestSpec.path, targetUrl);
  const transport = url.protocol === "https:" ? https : http;

  return new Promise((resolve) => {
    let settled = false;
    let firstByteAt = null;
    let bytes = 0;

    const request = transport.request(
      url,
      {
        method: requestSpec.method,
        headers: requestSpec.headers
      },
      (response) => {
        response.on("data", (chunk) => {
          firstByteAt ??= performance.now();
          bytes += chunk.length;
        });
        response.on("end", () => {
          if (settled) return;
          settled = true;
          const durationMs = performance.now() - requestStarted;
          const statusCode = response.statusCode ?? 0;
          resolve({
            ok: endpointConfig.expectedStatuses.includes(statusCode),
            statusCode,
            durationMs: round(durationMs, 2),
            ttfbMs: round((firstByteAt ?? requestStarted) - requestStarted, 2),
            bytes,
            endedAt: performance.now()
          });
        });
      }
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`timeout after ${timeoutMs}ms`));
    });

    request.on("error", (error) => {
      if (settled) return;
      settled = true;
      resolve({
        ok: false,
        statusCode: null,
        durationMs: round(performance.now() - requestStarted, 2),
        ttfbMs: null,
        bytes,
        endedAt: performance.now(),
        error: error.message
      });
    });

    request.end(requestSpec.body);
  });
}

function buildRequestSpec(endpointConfig, iteration) {
  const headers = {};
  let body = null;

  if (endpointConfig.auth) {
    headers.authorization = `Bearer ${tokens[endpointConfig.auth]}`;
  }

  if (endpointConfig.json) {
    body = Buffer.from(JSON.stringify(endpointConfig.json(iteration)));
    headers["content-type"] = "application/json";
    headers["content-length"] = String(body.length);
  }

  if (endpointConfig.multipart) {
    const multipart = endpointConfig.multipart(iteration);
    const boundary = `----benchmark-${Date.now()}-${iteration}`;
    body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${multipart.fieldName}"; filename="${multipart.filename}"\r\n` +
        `Content-Type: ${multipart.contentType}\r\n\r\n`
      ),
      Buffer.from(multipart.content),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);
    headers["content-type"] = `multipart/form-data; boundary=${boundary}`;
    headers["content-length"] = String(body.length);
  }

  return {
    method: endpointConfig.method,
    path: endpointConfig.path,
    headers,
    body
  };
}

async function evaluateThresholds(report) {
  const thresholdsPath = path.join(repoRoot, "benchmarks/thresholds.json");
  const thresholds = JSON.parse(await readFile(thresholdsPath, "utf8"));
  const modeThresholds = smokeMode ? thresholds.smoke ?? {} : {};
  const failures = [];

  for (const result of report.endpoints) {
    const endpointThresholds = thresholds.endpoints?.[result.id] ?? {};
    const active = {
      ...thresholds.defaults,
      ...modeThresholds,
      ...endpointThresholds
    };

    if (result.p99LatencyMs > active.p99LatencyMs) {
      failures.push(
        `${result.id} p99 ${result.p99LatencyMs}ms exceeds ${active.p99LatencyMs}ms`
      );
    }

    if (result.errorRatePct > active.errorRatePct) {
      failures.push(
        `${result.id} error rate ${result.errorRatePct}% exceeds ${active.errorRatePct}%`
      );
    }
  }

  return failures;
}

async function writeReports(report) {
  await mkdir(outputDir, { recursive: true });
  const stamp = report.run.startedAt.replace(/[:.]/g, "-");
  const baseName = `${report.run.mode}-${stamp}`;
  const jsonPath = path.join(outputDir, `${baseName}.json`);
  const markdownPath = path.join(outputDir, `${baseName}.md`);
  report.run.output = {
    json: path.relative(repoRoot, jsonPath),
    markdown: path.relative(repoRoot, markdownPath)
  };
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdown(report));
}

function renderMarkdown(report) {
  const rows = report.endpoints.map((result) => [
    result.id,
    result.method,
    result.path,
    result.requests,
    result.p50LatencyMs,
    result.p95LatencyMs,
    result.p99LatencyMs,
    result.avgTtfbMs,
    result.sustainedRps,
    result.peakRps,
    `${result.errorRatePct}%`,
    Object.entries(result.statusCounts)
      .map(([status, count]) => `${status}: ${count}`)
      .join(", ")
  ]);

  const thresholdBlock = report.thresholds.checked
    ? report.thresholds.failures.length === 0
      ? "Threshold check: passed."
      : `Threshold check: failed.\n\n${report.thresholds.failures.map((failure) => `- ${failure}`).join("\n")}`
    : "Threshold check: not requested.";

  return `# API Benchmark Summary

- Mode: ${report.run.mode}
- Started: ${report.run.startedAt}
- Target: ${report.run.target}
- Node.js: ${report.run.node}
- Platform: ${report.run.platform}
- CPU: ${report.run.cpu}
- Logical cores: ${report.run.logicalCores}
- Memory: ${report.run.totalMemoryMb} MB total, ${report.run.freeMemoryMb} MB free at run start
- Requests per endpoint: ${report.config.requestsPerEndpoint}
- Concurrency per endpoint: ${report.config.concurrency}

${thresholdBlock}

| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | avg TTFB ms | Sustained RPS | Peak RPS | Error rate | Statuses |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows.map((row) => `| ${row.join(" | ")} |`).join("\n")}
`;
}

function printConsoleSummary(report) {
  console.log(`Benchmark ${report.run.mode} complete: ${report.endpoints.length} endpoints`);
  console.log(`JSON: ${report.run.output?.json}`);
  console.log(`Markdown: ${report.run.output?.markdown}`);

  for (const result of report.endpoints) {
    console.log(
      `${result.id.padEnd(22)} p99=${String(result.p99LatencyMs).padStart(7)}ms ` +
      `rps=${String(result.sustainedRps).padStart(7)} errors=${result.errorRatePct}%`
    );
  }

  if (report.thresholds.checked) {
    if (report.thresholds.failures.length === 0) {
      console.log("Threshold check passed.");
    } else {
      console.error("Threshold check failed:");
      for (const failure of report.thresholds.failures) {
        console.error(`- ${failure}`);
      }
    }
  }
}

async function loadBenchmarkEnv() {
  const envPath = path.join(repoRoot, ".env.benchmark");

  try {
    const contents = await readFile(envPath, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      process.env[key] ??= value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function getNumberEnv(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getSystemInfo() {
  return {
    node: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCores: os.cpus().length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024)
  };
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return null;
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return round(sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))], 2);
}

function average(values) {
  if (values.length === 0) return null;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length, 2);
}

function calculatePeakRps(samples, endpointStartedAt) {
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor((sample.endedAt - endpointStartedAt) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Math.max(...buckets.values(), 0);
}

function countBy(values, keyFn) {
  const counts = {};
  for (const value of values) {
    const key = keyFn(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function round(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
