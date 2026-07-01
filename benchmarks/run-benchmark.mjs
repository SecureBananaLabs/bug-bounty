import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");

const args = new Set(process.argv.slice(2));
const smokeMode = args.has("--smoke");
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));

const endpoints = [
  {
    name: "auth register",
    method: "POST",
    path: "/api/auth/register",
    json: () => ({
      email: `bench-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "benchmark-pass-123",
      role: "freelancer"
    })
  },
  {
    name: "auth login",
    method: "POST",
    path: "/api/auth/login",
    json: {
      email: "bench-login@example.com",
      password: "benchmark-pass-123"
    }
  },
  {
    name: "auth oauth callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "auth refresh",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "users list",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "users create",
    method: "POST",
    path: "/api/users",
    json: () => ({
      email: `client-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      role: "client",
      status: "active",
      profile: {
        displayName: "Benchmark Client",
        company: "Benchmark Studio"
      }
    })
  },
  {
    name: "jobs list",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "jobs create",
    method: "POST",
    path: "/api/jobs",
    json: () => ({
      title: "Build a search dashboard",
      description: "Design and ship a searchable dashboard for marketplace operations.",
      budgetMin: 1200,
      budgetMax: 3200,
      categoryId: "engineering",
      skills: ["node", "react", "analytics"]
    })
  },
  {
    name: "proposals list",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "proposals create",
    method: "POST",
    path: "/api/proposals",
    json: {
      jobId: "job-benchmark",
      freelancerId: "usr-benchmark-freelancer",
      amount: 2450,
      coverLetter: "I can deliver the dashboard with weekly milestones and test coverage."
    }
  },
  {
    name: "payments create",
    method: "POST",
    path: "/api/payments",
    json: {
      amount: 245000,
      currency: "usd",
      metadata: {
        jobId: "job-benchmark",
        proposalId: "prp-benchmark"
      }
    }
  },
  {
    name: "reviews list",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "reviews create",
    method: "POST",
    path: "/api/reviews",
    json: {
      jobId: "job-benchmark",
      rating: 5,
      comment: "Clear scope, prompt delivery, and strong communication."
    }
  },
  {
    name: "messages list",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "messages create",
    method: "POST",
    path: "/api/messages",
    json: {
      conversationId: "conv-benchmark",
      senderId: "usr-benchmark-client",
      recipientId: "usr-benchmark-freelancer",
      body: "Can you confirm the milestone demo time for tomorrow?"
    }
  },
  {
    name: "notifications list",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "notifications create",
    method: "POST",
    path: "/api/notifications",
    json: {
      userId: "usr-benchmark-client",
      type: "proposal_received",
      message: "A freelancer submitted a proposal for your dashboard project."
    }
  },
  {
    name: "uploads create",
    method: "POST",
    path: "/api/uploads",
    multipart: {
      fieldName: "file",
      filename: "benchmark-brief.txt",
      contentType: "text/plain",
      content: "Benchmark attachment with realistic project brief content.\n"
    }
  },
  {
    name: "search global",
    method: "GET",
    path: "/api/search?q=dashboard"
  },
  {
    name: "admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];

async function main() {
  await loadEnvFile(path.join(rootDir, ".env.benchmark"));

  const config = getConfig();
  const server = await maybeStartLocalServer(config);
  const baseUrl = server?.baseUrl ?? config.targetUrl;

  if (!baseUrl) {
    throw new Error("Missing benchmark target URL");
  }

  const token = await getBenchmarkToken(baseUrl);
  const startedAt = new Date();
  const endpointResults = [];

  for (const endpoint of endpoints) {
    endpointResults.push(await runEndpoint(baseUrl, endpoint, token, config));
  }

  const finishedAt = new Date();
  const report = {
    generatedAt: finishedAt.toISOString(),
    mode: smokeMode ? "smoke" : "full",
    targetUrl: maskUrl(baseUrl),
    config: {
      durationMs: config.durationMs,
      concurrency: config.concurrency,
      maxRequestsPerEndpoint: config.maxRequestsPerEndpoint
    },
    environment: getEnvironment(config),
    summary: summarize(endpointResults),
    endpoints: endpointResults
  };

  await mkdir(resultsDir, { recursive: true });

  const timestamp = finishedAt.toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const jsonPath = path.join(resultsDir, `${timestamp}.json`);
  const markdownPath = path.join(resultsDir, `${timestamp}.md`);
  const markdown = renderMarkdown(report, startedAt, finishedAt);

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, markdown);
  await writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(resultsDir, "latest.md"), markdown);

  await server?.close();

  const thresholdFailures = await checkThresholds(report);

  console.log(`Benchmark complete: ${endpointResults.length} endpoints`);
  console.log(`JSON: ${path.relative(rootDir, jsonPath)}`);
  console.log(`Markdown: ${path.relative(rootDir, markdownPath)}`);

  if (thresholdFailures.length > 0) {
    for (const failure of thresholdFailures) {
      console.error(`Threshold failed: ${failure}`);
    }
    process.exitCode = 1;
  }
}

function getConfig() {
  const targetUrl = targetArg?.slice("--target=".length) || process.env.BENCHMARK_TARGET_URL || "";

  return {
    targetUrl: targetUrl.trim().replace(/\/$/, ""),
    durationMs: numberFromEnv("BENCHMARK_DURATION_MS", smokeMode ? 200 : 1000),
    concurrency: numberFromEnv("BENCHMARK_CONCURRENCY", smokeMode ? 1 : 4),
    maxRequestsPerEndpoint: numberFromEnv(
      "BENCHMARK_MAX_REQUESTS_PER_ENDPOINT",
      smokeMode ? 2 : 8
    ),
    machineType: process.env.BENCHMARK_MACHINE_TYPE || "local workstation",
    network: process.env.BENCHMARK_NETWORK || "loopback",
    storage: process.env.BENCHMARK_STORAGE || "unknown",
    notes: process.env.BENCHMARK_NOTES || ""
  };
}

async function maybeStartLocalServer(config) {
  if (config.targetUrl) {
    return null;
  }

  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function getBenchmarkToken(baseUrl) {
  if (process.env.BENCHMARK_TOKEN) {
    return process.env.BENCHMARK_TOKEN;
  }

  const response = await request(baseUrl, {
    method: "POST",
    path: "/api/auth/register",
    json: {
      email: `admin-benchmark-${Date.now()}@example.com`,
      password: "benchmark-pass-123",
      role: "admin"
    },
    collectBody: true
  });

  if (response.statusCode >= 400) {
    throw new Error(`Unable to create benchmark token: HTTP ${response.statusCode}`);
  }

  const payload = JSON.parse(response.body || "{}");
  const token = payload?.data?.token;

  if (!token) {
    throw new Error("Benchmark token was not returned by /api/auth/register");
  }

  return token;
}

async function runEndpoint(baseUrl, endpoint, token, config) {
  const samples = [];
  const statuses = new Map();
  let requestErrors = 0;
  let issuedRequests = 0;
  const startedAt = performance.now();
  const deadline = startedAt + config.durationMs;

  const runWorker = async () => {
    do {
      if (issuedRequests >= config.maxRequestsPerEndpoint) {
        break;
      }

      issuedRequests += 1;
      const result = await request(baseUrl, endpoint, token);
      const statusKey = result.statusCode ? String(result.statusCode) : "request_error";
      statuses.set(statusKey, (statuses.get(statusKey) ?? 0) + 1);

      if (result.error || !result.statusCode || result.statusCode >= 400) {
        requestErrors += 1;
      }

      samples.push({
        latencyMs: result.latencyMs,
        ttfbMs: result.ttfbMs,
        statusCode: result.statusCode,
        completedAtMs: performance.now()
      });
    } while (
      (performance.now() < deadline || samples.length < config.concurrency)
    );
  };

  await Promise.all(Array.from({ length: config.concurrency }, runWorker));

  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const elapsedMs = performance.now() - startedAt;
  const elapsedSeconds = Math.max(elapsedMs / 1000, 0.001);
  const peakRps = getPeakRps(samples);
  const sustainedRps = samples.length / elapsedSeconds;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    auth: Boolean(endpoint.auth),
    requests: samples.length,
    elapsedMs: round(elapsedMs),
    statusCodes: Object.fromEntries(statuses),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    },
    requestsPerSecond: {
      sustained: round(sustainedRps),
      peak: round(peakRps)
    },
    errorRatePercent: round((requestErrors / Math.max(samples.length, 1)) * 100)
  };
}

async function request(baseUrl, endpoint, token = "") {
  const requestUrl = new URL(endpoint.path, baseUrl);
  const headers = { ...(endpoint.headers ?? {}) };
  let body;

  if (endpoint.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  if (endpoint.json !== undefined) {
    const json = typeof endpoint.json === "function" ? endpoint.json() : endpoint.json;
    body = Buffer.from(JSON.stringify(json));
    headers["content-type"] = "application/json";
    headers["content-length"] = String(body.length);
  }

  if (endpoint.multipart) {
    const multipart = typeof endpoint.multipart === "function" ? endpoint.multipart() : endpoint.multipart;
    const boundary = `benchmark-${createHash("sha1").update(`${Date.now()}-${Math.random()}`).digest("hex")}`;
    body = buildMultipartBody(boundary, multipart);
    headers["content-type"] = `multipart/form-data; boundary=${boundary}`;
    headers["content-length"] = String(body.length);
  }

  const startedAt = performance.now();
  const transport = requestUrl.protocol === "https:" ? https : http;

  return new Promise((resolve) => {
    const req = transport.request(
      requestUrl,
      {
        method: endpoint.method,
        headers
      },
      (res) => {
        const ttfbMs = performance.now() - startedAt;
        const chunks = [];

        res.on("data", (chunk) => {
          if (endpoint.collectBody) {
            chunks.push(chunk);
          }
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            latencyMs: round(performance.now() - startedAt),
            ttfbMs: round(ttfbMs),
            body: endpoint.collectBody ? Buffer.concat(chunks).toString("utf8") : ""
          });
        });
      }
    );

    req.on("error", (error) => {
      resolve({
        statusCode: 0,
        latencyMs: round(performance.now() - startedAt),
        ttfbMs: round(performance.now() - startedAt),
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy(new Error("request timed out"));
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

function buildMultipartBody(boundary, file) {
  return Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(
      `Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"\r\n`
    ),
    Buffer.from(`Content-Type: ${file.contentType}\r\n\r\n`),
    Buffer.from(file.content),
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);
}

function summarize(endpointResults) {
  const requests = endpointResults.reduce((sum, endpoint) => sum + endpoint.requests, 0);
  const maxP99 = Math.max(...endpointResults.map((endpoint) => endpoint.latencyMs.p99));
  const maxErrorRate = Math.max(...endpointResults.map((endpoint) => endpoint.errorRatePercent));
  const sustainedRps = endpointResults.reduce(
    (sum, endpoint) => sum + endpoint.requestsPerSecond.sustained,
    0
  );

  return {
    endpointCount: endpointResults.length,
    totalRequests: requests,
    maxP99LatencyMs: round(maxP99),
    maxErrorRatePercent: round(maxErrorRate),
    aggregateSustainedRps: round(sustainedRps)
  };
}

function renderMarkdown(report, startedAt, finishedAt) {
  const rows = report.endpoints
    .map(
      (endpoint) =>
        `| ${endpoint.method} ${endpoint.path} | ${endpoint.requests} | ${endpoint.latencyMs.p50} | ${endpoint.latencyMs.p95} | ${endpoint.latencyMs.p99} | ${endpoint.ttfbMs.p95} | ${endpoint.requestsPerSecond.sustained} | ${endpoint.requestsPerSecond.peak} | ${endpoint.errorRatePercent}% |`
    )
    .join("\n");

  return `# API Benchmark Summary

- Mode: ${report.mode}
- Target: ${report.targetUrl}
- Started: ${startedAt.toISOString()}
- Finished: ${finishedAt.toISOString()}
- Duration per endpoint: ${report.config.durationMs} ms
- Concurrency: ${report.config.concurrency}
- Max requests per endpoint: ${report.config.maxRequestsPerEndpoint}
- Total requests: ${report.summary.totalRequests}
- Max p99 latency: ${report.summary.maxP99LatencyMs} ms
- Max error rate: ${report.summary.maxErrorRatePercent}%

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

async function checkThresholds(report) {
  const thresholds = JSON.parse(await readFile(path.join(__dirname, "thresholds.json"), "utf8"));
  const threshold = thresholds[report.mode];
  const failures = [];

  if (!threshold) {
    return failures;
  }

  for (const endpoint of report.endpoints) {
    if (endpoint.latencyMs.p99 > threshold.p99LatencyMs) {
      failures.push(
        `${endpoint.method} ${endpoint.path} p99 ${endpoint.latencyMs.p99} ms > ${threshold.p99LatencyMs} ms`
      );
    }

    if (endpoint.errorRatePercent > threshold.errorRatePercent) {
      failures.push(
        `${endpoint.method} ${endpoint.path} error rate ${endpoint.errorRatePercent}% > ${threshold.errorRatePercent}%`
      );
    }
  }

  return failures;
}

function getEnvironment(config) {
  const cpus = os.cpus();
  const cpuCores = cpus.length || os.availableParallelism?.() || "unknown";
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  return {
    hardware: {
      cpuModel: cpus[0]?.model ?? "unknown",
      cpuCores,
      totalMemoryMb: Math.round(totalMem / 1024 / 1024),
      freeMemoryMb: Math.round(freeMem / 1024 / 1024),
      storage: config.storage,
      network: config.network,
      machineType: config.machineType,
      os: `${os.type()} ${os.release()} ${os.arch()}`
    },
    runtime: {
      node: process.version,
      resourceLimits: "none configured",
      otherProcesses: "not measured"
    },
    aiAgent: {
      toolName: "Codex CLI",
      model: "GPT-5",
      provider: "OpenAI",
      orchestration: "Codex CLI",
      executionMode: "human-supervised",
      shellAccess: true,
      internetAccess: true,
      commandsRunByAgent: true,
      constraints: config.notes
    }
  };
}

function getPeakRps(samples) {
  if (samples.length === 0) {
    return 0;
  }

  const buckets = new Map();

  for (const sample of samples) {
    const second = Math.floor(sample.completedAtMs / 1000);
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }

  return Math.max(...buckets.values());
}

function percentile(values, target) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.min(values.length - 1, Math.ceil((target / 100) * values.length) - 1);
  return round(values[index]);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function loadEnvFile(envPath) {
  try {
    const contents = await readFile(envPath, "utf8");

    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");

      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").trim();
      }
    }
  } catch {
    // Local benchmark runs do not require an env file.
  }
}

function maskUrl(value) {
  const url = new URL(value);

  if (url.username || url.password) {
    url.username = "redacted";
    url.password = "redacted";
  }

  return url.toString().replace(/\/$/, "");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
