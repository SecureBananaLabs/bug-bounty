import autocannon from "autocannon";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const fixturePath = path.join(__dirname, "fixtures", "upload-sample.txt");
const thresholdPath = path.join(__dirname, "thresholds.json");
const envTemplatePath = path.join(__dirname, ".env.benchmark.example");

function parseArgs(argv) {
  const options = {
    profile: undefined,
    verify: false
  };

  for (const arg of argv) {
    if (arg === "--verify") {
      options.verify = true;
      continue;
    }

    if (arg.startsWith("--profile=")) {
      options.profile = arg.split("=")[1] || undefined;
    }
  }

  return options;
}

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/u)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function percentile(values, target) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((target / 100) * sorted.length) - 1));
  return sorted[index];
}

function repeatSentence(sentence, count) {
  return Array.from({ length: count }, () => sentence).join(" ");
}

function getProfileSettings(profile) {
  if (profile === "smoke") {
    return {
      amount: parseNumber(process.env.BENCHMARK_AMOUNT, 24),
      connections: parseNumber(process.env.BENCHMARK_CONCURRENCY, 2),
      sampleInt: 1000,
      ttfbSamples: parseNumber(process.env.BENCHMARK_TTFB_SAMPLES, 3)
    };
  }

  return {
    amount: parseNumber(process.env.BENCHMARK_AMOUNT, 80),
    connections: parseNumber(process.env.BENCHMARK_CONCURRENCY, 6),
    sampleInt: 1000,
    ttfbSamples: parseNumber(process.env.BENCHMARK_TTFB_SAMPLES, 5)
  };
}

function buildEndpointDefinitions(adminToken) {
  return [
    {
      name: "auth-register",
      routePath: "/api/auth/register",
      path: "/api/auth/register",
      method: "POST",
      body: {
        email: "benchmark.register@example.com",
        password: "benchmark-pass-123",
        role: "client"
      }
    },
    {
      name: "auth-login",
      routePath: "/api/auth/login",
      path: "/api/auth/login",
      method: "POST",
      body: {
        email: "benchmark.login@example.com",
        password: "benchmark-pass-123"
      }
    },
    {
      name: "auth-oauth-callback",
      routePath: "/api/auth/oauth/github/callback",
      path: "/api/auth/oauth/github/callback",
      method: "GET"
    },
    {
      name: "auth-refresh",
      routePath: "/api/auth/refresh",
      path: "/api/auth/refresh",
      method: "POST",
      body: {}
    },
    {
      name: "users-list",
      routePath: "/api/users",
      path: "/api/users",
      method: "GET"
    },
    {
      name: "users-create",
      routePath: "/api/users",
      path: "/api/users",
      method: "POST",
      body: {
        email: "benchmark.user@example.com",
        fullName: "Benchmark User",
        role: "freelancer",
        bio: repeatSentence("Senior marketplace engineer with payment and search experience.", 3),
        isVerified: true,
        skills: ["node", "react", "payments", "postgres"]
      }
    },
    {
      name: "jobs-list",
      routePath: "/api/jobs",
      path: "/api/jobs",
      method: "GET"
    },
    {
      name: "jobs-create",
      routePath: "/api/jobs",
      path: "/api/jobs",
      method: "POST",
      body: {
        title: "Marketplace payout reliability audit",
        description: repeatSentence(
          "Build a resilient freelance workflow with audit logging, payout milestones, and review automation.",
          5
        ),
        budgetMin: 2500,
        budgetMax: 8000,
        categoryId: "fintech-platform",
        skills: ["node", "postgres", "stripe", "testing"]
      }
    },
    {
      name: "proposals-list",
      routePath: "/api/proposals",
      path: "/api/proposals",
      method: "GET"
    },
    {
      name: "proposals-create",
      routePath: "/api/proposals",
      path: "/api/proposals",
      method: "POST",
      body: {
        coverLetter: repeatSentence(
          "I have shipped marketplace workflows, notification systems, and payment integrations at production scale.",
          4
        ),
        bidAmount: 4200,
        estDuration: "3 weeks",
        jobId: "job_benchmark_001",
        freelancerId: "usr_benchmark_freelancer"
      }
    },
    {
      name: "payments-create",
      routePath: "/api/payments",
      path: "/api/payments",
      method: "POST",
      body: {
        amount: 129900,
        currency: "usd"
      }
    },
    {
      name: "reviews-list",
      routePath: "/api/reviews",
      path: "/api/reviews",
      method: "GET"
    },
    {
      name: "reviews-create",
      routePath: "/api/reviews",
      path: "/api/reviews",
      method: "POST",
      body: {
        rating: 5,
        comment: repeatSentence(
          "Fast communication, clear specs, and predictable delivery made this project easy to manage.",
          3
        ),
        reviewerId: "usr_benchmark_client",
        revieweeId: "usr_benchmark_freelancer"
      }
    },
    {
      name: "messages-list",
      routePath: "/api/messages",
      path: "/api/messages",
      method: "GET"
    },
    {
      name: "messages-create",
      routePath: "/api/messages",
      path: "/api/messages",
      method: "POST",
      body: {
        body: repeatSentence(
          "Sharing a milestone update with next steps, blockers, and a request for approval on scope.",
          3
        ),
        senderId: "usr_benchmark_client",
        receiverId: "usr_benchmark_freelancer"
      }
    },
    {
      name: "notifications-list",
      routePath: "/api/notifications",
      path: "/api/notifications",
      method: "GET"
    },
    {
      name: "notifications-create",
      routePath: "/api/notifications",
      path: "/api/notifications",
      method: "POST",
      body: {
        userId: "usr_benchmark_client",
        title: "Proposal awaiting review",
        body: repeatSentence(
          "A new proposal arrived and requires review before the response window closes.",
          3
        )
      }
    },
    {
      name: "uploads-create",
      routePath: "/api/uploads",
      path: "/api/uploads",
      method: "POST",
      form: {
        file: {
          type: "file",
          path: fixturePath,
          options: {
            filename: "upload-sample.txt",
            contentType: "text/plain"
          }
        }
      }
    },
    {
      name: "search-query",
      routePath: "/api/search",
      path: "/api/search?q=marketplace+payout+benchmark+plan",
      method: "GET"
    },
    {
      name: "admin-metrics",
      routePath: "/api/admin/metrics",
      path: "/api/admin/metrics",
      method: "GET",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      authProtected: true
    }
  ];
}

function buildEnvironmentSummary(profile, baseUrl, localTarget) {
  const cpus = os.cpus();

  return {
    profile,
    baseUrl,
    target: localTarget ? "local" : "remote",
    hardware: {
      cpuModel: cpus[0]?.model ?? "unknown",
      coreCount: cpus.length,
      ramTotalGb: round(os.totalmem() / 1024 / 1024 / 1024, 2),
      ramFreeGb: round(os.freemem() / 1024 / 1024 / 1024, 2),
      storageType: "unknown",
      networkInterface: localTarget ? "loopback" : "unknown",
      machineType: "local workstation"
    },
    runtime: {
      nodeVersion: process.version,
      os: `${os.platform()} ${os.release()}`,
      resourceLimits: "none declared",
      backgroundProcesses: "unknown"
    },
    aiAgent: {
      toolName: "Codex",
      model: "GPT-5",
      provider: "OpenAI",
      orchestration: "Codex desktop",
      executionMode: "fully autonomous",
      shellAccess: true,
      internetAccess: true,
      benchmarkExecutedByAgent: true,
      knownConstraints:
        "No GitHub CLI in PATH; some authenticated payout pages are browser-policy limited."
    }
  };
}

async function measureTtfb(baseUrl, endpoint, samples) {
  const timings = [];

  for (let index = 0; index < samples; index += 1) {
    const headers = new Headers(endpoint.headers ?? {});
    let body;

    if (endpoint.form) {
      const fileBuffer = await fs.readFile(fixturePath);
      const formData = new FormData();
      formData.set("file", new Blob([fileBuffer], { type: "text/plain" }), "upload-sample.txt");
      body = formData;
    } else if (endpoint.method !== "GET" && endpoint.body !== undefined) {
      headers.set("content-type", "application/json");
      body = JSON.stringify(endpoint.body);
    }

    const startedAt = performance.now();
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers,
      body
    });
    timings.push(performance.now() - startedAt);
    await response.arrayBuffer();
  }

  return {
    averageMs: round(timings.reduce((sum, value) => sum + value, 0) / timings.length),
    p95Ms: round(percentile(timings, 95)),
    maxMs: round(Math.max(...timings))
  };
}

async function benchmarkEndpoint(baseUrl, endpoint, settings) {
  const statusCodes = {};
  const responseSamples = [];
  const payloadBytes = endpoint.form
    ? (await fs.stat(fixturePath)).size
    : endpoint.body === undefined
      ? 0
      : Buffer.byteLength(JSON.stringify(endpoint.body));

  const instance = autocannon({
    url: `${baseUrl}${endpoint.path}`,
    method: endpoint.method,
    amount: settings.amount,
    connections: settings.connections,
    sampleInt: settings.sampleInt,
    timeout: 10,
    renderProgressBar: false,
    renderResultsTable: false,
    renderLatencyTable: false,
    headers: endpoint.form
      ? { ...(endpoint.headers ?? {}) }
      : {
          accept: "application/json",
          ...(endpoint.method !== "GET" && endpoint.body !== undefined
            ? { "content-type": "application/json" }
            : {}),
          ...(endpoint.headers ?? {})
        },
    body:
      endpoint.form || endpoint.method === "GET" || endpoint.body === undefined
        ? undefined
        : JSON.stringify(endpoint.body),
    form: endpoint.form
  });

  instance.on("response", (client, statusCode, responseBytes, responseTime) => {
    statusCodes[statusCode] = (statusCodes[statusCode] ?? 0) + 1;
    responseSamples.push(responseTime);
  });

  const result = await instance;
  const completedRequests = result.requests.total || responseSamples.length || 1;
  const errorRatePct = round(((result.errors + result.non2xx) / completedRequests) * 100);
  const ttfb = await measureTtfb(baseUrl, endpoint, settings.ttfbSamples);

  return {
    name: endpoint.name,
    routePath: endpoint.routePath,
    path: endpoint.path,
    method: endpoint.method,
    authProtected: Boolean(endpoint.authProtected),
    payloadType: endpoint.form ? "multipart" : endpoint.method === "GET" ? "none" : "json",
    payloadBytes,
    requestsSent: completedRequests,
    statusCodes,
    latencyMs: {
      p50: round(percentile(responseSamples, 50)),
      p95: round(percentile(responseSamples, 95)),
      p99: round(percentile(responseSamples, 99)),
      average: round(result.latency.average)
    },
    throughput: {
      sustainedRps: round(result.requests.average),
      peakRps: round(result.requests.max)
    },
    errorRatePct,
    ttfbMs: ttfb
  };
}

function evaluateThresholds(summary, thresholds) {
  const profileThresholds = thresholds.profiles?.[summary.profile] ?? {};
  const failures = [];

  for (const result of summary.results) {
    const key = `${result.method} ${result.routePath}`;
    const threshold = profileThresholds[key];
    if (!threshold) {
      continue;
    }

    if (result.latencyMs.p99 > threshold.p99Ms) {
      failures.push(
        `${key} p99 ${result.latencyMs.p99} ms exceeded smoke threshold ${threshold.p99Ms} ms`
      );
    }

    if (typeof threshold.maxErrorRatePct === "number" && result.errorRatePct > threshold.maxErrorRatePct) {
      failures.push(
        `${key} error rate ${result.errorRatePct}% exceeded ${threshold.maxErrorRatePct}%`
      );
    }
  }

  return failures;
}

function renderMarkdown(summary) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `- Generated at: ${summary.generatedAt}`,
    `- Profile: ${summary.profile}`,
    `- Base URL: ${summary.baseUrl}`,
    `- Endpoints covered: ${summary.results.length}`,
    "",
    "## Benchmark Environment",
    "",
    "**Hardware**",
    `- CPU model & core count: ${summary.environment.hardware.cpuModel} (${summary.environment.hardware.coreCount} cores)`,
    `- RAM (total & available during benchmark): ${summary.environment.hardware.ramTotalGb} GB total / ${summary.environment.hardware.ramFreeGb} GB free`,
    `- Storage type (SSD / NVMe / HDD): ${summary.environment.hardware.storageType}`,
    `- Network interface (Ethernet / WiFi / loopback): ${summary.environment.hardware.networkInterface}`,
    `- Machine type (local workstation / cloud VM / CI runner - include instance type if cloud): ${summary.environment.hardware.machineType}`,
    `- OS & version: ${summary.environment.runtime.os}`,
    "",
    "**Runtime**",
    `- Node.js version (or relevant runtime): ${summary.environment.runtime.nodeVersion}`,
    `- Any resource limits applied (Docker memory cap, cgroup limits, etc.): ${summary.environment.runtime.resourceLimits}`,
    `- Other significant processes running during benchmark (yes / no - if yes, describe): ${summary.environment.runtime.backgroundProcesses}`,
    "",
    "**If submitted by or with an AI agent**",
    `- Agent or tool name: ${summary.environment.aiAgent.toolName}`,
    `- Underlying model and version: ${summary.environment.aiAgent.model}`,
    `- Inference provider: ${summary.environment.aiAgent.provider}`,
    `- Orchestration framework if any: ${summary.environment.aiAgent.orchestration}`,
    `- Execution mode: ${summary.environment.aiAgent.executionMode}`,
    `- Did the agent have shell/tool access during execution: ${summary.environment.aiAgent.shellAccess ? "yes" : "no"}`,
    `- Did the agent have internet access during execution: ${summary.environment.aiAgent.internetAccess ? "yes" : "no"}`,
    `- Were benchmark commands run by the agent directly or handed off to the human to run: ${summary.environment.aiAgent.benchmarkExecutedByAgent ? "agent directly" : "handed off"}`,
    `- Any known agent constraints or sandboxing that may have affected execution: ${summary.environment.aiAgent.knownConstraints}`,
    "",
    "## Endpoint Metrics",
    "",
    "| Endpoint | Method | Auth | Payload bytes | p50 ms | p95 ms | p99 ms | Avg ms | Sustained req/s | Peak req/s | Error % | Avg TTFB ms | p95 TTFB ms |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const result of summary.results) {
    lines.push(
      `| ${result.path} | ${result.method} | ${result.authProtected ? "benchmark token" : "public"} | ${result.payloadBytes} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.latencyMs.average} | ${result.throughput.sustainedRps} | ${result.throughput.peakRps} | ${result.errorRatePct} | ${result.ttfbMs.averageMs} | ${result.ttfbMs.p95Ms} |`
    );
  }

  if (summary.thresholdFailures.length > 0) {
    lines.push("", "## Threshold Failures", "");
    for (const failure of summary.thresholdFailures) {
      lines.push(`- ${failure}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function ensureResultsDir() {
  await fs.mkdir(resultsDir, { recursive: true });
}

async function startLocalServer(port) {
  process.env.BENCHMARK_MODE = process.env.BENCHMARK_MODE ?? "1";
  process.env.NODE_ENV = "benchmark";
  process.env.PORT = String(port);

  const [{ createApp }, { connectDb }] = await Promise.all([
    import("../apps/api/src/app.js"),
    import("../apps/api/src/config/db.js")
  ]);
  await connectDb();
  const app = createApp();
  const server = app.listen(port);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await loadEnvFile(path.join(__dirname, ".env.benchmark"));
  await loadEnvFile(envTemplatePath);

  const profile = options.profile ?? process.env.BENCHMARK_PROFILE ?? "full";
  const settings = getProfileSettings(profile);
  const localTarget = (process.env.BENCHMARK_TARGET ?? "local").toLowerCase() === "local";
  const port = parseNumber(process.env.BENCHMARK_PORT, 4010);
  const baseUrl = localTarget
    ? `http://127.0.0.1:${port}`
    : (process.env.BENCHMARK_BASE_URL || "").replace(/\/$/u, "");

  if (!baseUrl) {
    throw new Error("BENCHMARK_BASE_URL must be set when BENCHMARK_TARGET is not local.");
  }

  let server;

  try {
    if (localTarget) {
      server = await startLocalServer(port);
    }

    const thresholds = JSON.parse(await fs.readFile(thresholdPath, "utf8"));
    let adminToken = process.env.BENCHMARK_ADMIN_TOKEN ?? "";
    if (!adminToken && !localTarget) {
      throw new Error("BENCHMARK_ADMIN_TOKEN must be set for remote benchmark targets.");
    }
    if (!adminToken) {
      const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
      adminToken = signAccessToken({
        sub: "benchmark-admin",
        role: "admin"
      });
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      profile,
      baseUrl,
      environment: buildEnvironmentSummary(profile, baseUrl, localTarget),
      results: [],
      thresholdFailures: []
    };

    for (const endpoint of buildEndpointDefinitions(adminToken)) {
      summary.results.push(await benchmarkEndpoint(baseUrl, endpoint, settings));
    }

    summary.thresholdFailures = evaluateThresholds(summary, thresholds);

    await ensureResultsDir();
    const jsonPath = path.join(resultsDir, `latest-${profile}.json`);
    const markdownPath = path.join(resultsDir, `latest-${profile}.md`);

    await fs.writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
    await fs.writeFile(markdownPath, renderMarkdown(summary));

    process.stdout.write(`Wrote ${path.relative(repoRoot, jsonPath)}\n`);
    process.stdout.write(`Wrote ${path.relative(repoRoot, markdownPath)}\n`);

    if (options.verify && summary.thresholdFailures.length > 0) {
      throw new Error(summary.thresholdFailures.join("\n"));
    }
  } finally {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
