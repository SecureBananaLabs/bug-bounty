import { mkdir, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { cpus, freemem, platform, release, totalmem, type } from "node:os";
import process from "node:process";

const smoke = process.env.BENCHMARK_SMOKE === "true";
const durationMs = Number(process.env.BENCHMARK_DURATION_MS ?? (smoke ? 800 : 3000));
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 2 : 8));
const targetFromEnv = process.env.BENCHMARK_TARGET_URL?.replace(/\/$/, "");
const resultsDir = new URL("./results/", import.meta.url);
const thresholds = JSON.parse(await readFile(new URL("./thresholds.json", import.meta.url), "utf8"));

process.env.BENCHMARK_DISABLE_RATE_LIMIT ??= "true";
const { createApp } = await import("../apps/api/src/app.js");
const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");

const benchmarkToken = signAccessToken({
  sub: process.env.BENCHMARK_USER_ID ?? "bench_user",
  role: process.env.BENCHMARK_USER_ROLE ?? "admin"
});

const jsonHeaders = { "content-type": "application/json" };
const authHeaders = { authorization: `Bearer ${benchmarkToken}` };

const endpoints = [
  {
    name: "Auth register",
    method: "POST",
    path: "/api/auth/register",
    headers: jsonHeaders,
    body: () => ({
      email: `bench-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "correct-horse-battery",
      role: "freelancer"
    })
  },
  {
    name: "Auth login",
    method: "POST",
    path: "/api/auth/login",
    headers: jsonHeaders,
    body: () => ({
      email: "benchmark@example.com",
      password: "correct-horse-battery"
    })
  },
  { name: "OAuth callback", method: "GET", path: "/api/auth/oauth/github/callback" },
  { name: "Auth refresh", method: "POST", path: "/api/auth/refresh" },
  { name: "List users", method: "GET", path: "/api/users" },
  {
    name: "Create user",
    method: "POST",
    path: "/api/users",
    headers: jsonHeaders,
    body: () => ({
      email: `bench-user-${Date.now()}@example.com`,
      displayName: "Benchmark User",
      bio: "Benchmark profile payload with representative marketplace profile text."
    })
  },
  { name: "List jobs", method: "GET", path: "/api/jobs" },
  {
    name: "Create job",
    method: "POST",
    path: "/api/jobs",
    headers: jsonHeaders,
    body: () => ({
      title: "Build a benchmarkable marketplace dashboard",
      description: "Create a practical dashboard with milestones, proposals, payments, and review summaries.",
      budgetMin: 500,
      budgetMax: 2500,
      categoryId: "software-development",
      skills: ["node", "react", "api-performance", "testing"]
    })
  },
  { name: "List proposals", method: "GET", path: "/api/proposals" },
  {
    name: "Create proposal",
    method: "POST",
    path: "/api/proposals",
    headers: jsonHeaders,
    body: () => ({
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark",
      coverLetter: "I can deliver this benchmarked marketplace workflow with clear milestones.",
      amount: 1200,
      estimatedDays: 10
    })
  },
  {
    name: "Create payment",
    method: "POST",
    path: "/api/payments",
    headers: jsonHeaders,
    body: () => ({
      amount: 100000,
      currency: "usd",
      jobId: "job_benchmark",
      metadata: { source: "benchmark" }
    })
  },
  { name: "List reviews", method: "GET", path: "/api/reviews" },
  {
    name: "Create review",
    method: "POST",
    path: "/api/reviews",
    headers: jsonHeaders,
    body: () => ({
      subjectId: "usr_benchmark",
      rating: 5,
      comment: "Clear delivery, responsive updates, and clean handoff."
    })
  },
  { name: "List messages", method: "GET", path: "/api/messages" },
  {
    name: "Send message",
    method: "POST",
    path: "/api/messages",
    headers: jsonHeaders,
    body: () => ({
      conversationId: "conv_benchmark",
      senderId: "usr_benchmark",
      body: "Benchmark message payload with a realistic short project update."
    })
  },
  { name: "List notifications", method: "GET", path: "/api/notifications" },
  {
    name: "Create notification",
    method: "POST",
    path: "/api/notifications",
    headers: jsonHeaders,
    body: () => ({
      userId: "usr_benchmark",
      type: "proposal_update",
      message: "Your benchmark proposal has moved to review."
    })
  },
  {
    name: "Upload file",
    method: "POST",
    path: "/api/uploads",
    body: () => {
      const form = new FormData();
      form.append("file", new Blob(["benchmark attachment\n".repeat(32)], { type: "text/plain" }), "benchmark.txt");
      return form;
    }
  },
  { name: "Search", method: "GET", path: "/api/search?q=marketplace%20dashboard%20node" },
  {
    name: "Admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: authHeaders
  }
];

function percentile(values, pct) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

async function startLocalServer() {
  if (targetFromEnv) {
    return { baseUrl: targetFromEnv, close: async () => {} };
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
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

async function makeRequest(baseUrl, endpoint) {
  const headers = { ...(endpoint.headers ?? {}) };
  const init = { method: endpoint.method, headers };
  const generatedBody = endpoint.body?.();
  if (generatedBody instanceof FormData) {
    init.body = generatedBody;
    delete init.headers["content-type"];
  } else if (generatedBody !== undefined) {
    init.body = JSON.stringify(generatedBody);
  }

  const start = performance.now();
  let response;
  try {
    response = await fetch(`${baseUrl}${endpoint.path}`, init);
    const ttfbMs = performance.now() - start;
    await response.arrayBuffer();
    const latencyMs = performance.now() - start;
    return { latencyMs, ttfbMs, ok: response.ok, status: response.status };
  } catch (error) {
    const latencyMs = performance.now() - start;
    return { latencyMs, ttfbMs: latencyMs, ok: false, status: 0, error: error.message };
  }
}

async function runEndpoint(baseUrl, endpoint) {
  const deadline = performance.now() + durationMs;
  const samples = [];
  let started = 0;

  async function worker() {
    while (performance.now() < deadline) {
      started += 1;
      samples.push(await makeRequest(baseUrl, endpoint));
    }
  }

  const start = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const elapsedMs = performance.now() - start;
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfbs = samples.map((sample) => sample.ttfbMs);
  const errors = samples.filter((sample) => !sample.ok).length;
  const statuses = samples.reduce((acc, sample) => {
    acc[sample.status] = (acc[sample.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: samples.length,
    elapsedMs: Math.round(elapsedMs),
    sustainedRps: Number((samples.length / (elapsedMs / 1000)).toFixed(2)),
    peakRps: Number((1000 / Math.max(1, percentile(latencies, 50)) * concurrency).toFixed(2)),
    errorRatePct: Number(((errors / Math.max(1, samples.length)) * 100).toFixed(2)),
    statusCodes: statuses,
    latencyMs: {
      p50: Number(percentile(latencies, 50).toFixed(2)),
      p95: Number(percentile(latencies, 95).toFixed(2)),
      p99: Number(percentile(latencies, 99).toFixed(2))
    },
    ttfbMs: {
      p50: Number(percentile(ttfbs, 50).toFixed(2)),
      p95: Number(percentile(ttfbs, 95).toFixed(2)),
      p99: Number(percentile(ttfbs, 99).toFixed(2))
    }
  };
}

function thresholdFor(result) {
  const key = `${result.method} ${result.path.split("?")[0]}`;
  return {
    ...(smoke ? thresholds.smoke : thresholds.defaults),
    ...(thresholds.endpoints[key] ?? {})
  };
}

function evaluateThresholds(results) {
  return results.map((result) => {
    const threshold = thresholdFor(result);
    return {
      endpoint: `${result.method} ${result.path}`,
      pass: result.latencyMs.p99 <= threshold.maxP99Ms && result.errorRatePct <= threshold.maxErrorRatePct,
      threshold,
      observed: {
        p99Ms: result.latencyMs.p99,
        errorRatePct: result.errorRatePct
      }
    };
  });
}

function renderMarkdown(report) {
  const rows = report.results.map((result) => [
    `\`${result.method} ${result.path}\``,
    result.requests,
    result.sustainedRps,
    result.peakRps,
    result.latencyMs.p50,
    result.latencyMs.p95,
    result.latencyMs.p99,
    result.ttfbMs.p50,
    result.ttfbMs.p95,
    result.ttfbMs.p99,
    result.errorRatePct,
    Object.entries(result.statusCodes).map(([code, count]) => `${code}: ${count}`).join(", ")
  ].join(" | "));

  const gateRows = report.gates.map((gate) => [
    `\`${gate.endpoint}\``,
    gate.pass ? "pass" : "fail",
    gate.observed.p99Ms,
    gate.threshold.maxP99Ms,
    gate.observed.errorRatePct,
    gate.threshold.maxErrorRatePct
  ].join(" | "));

  return `# API Benchmark Summary

Generated: ${report.generatedAt}

Target: \`${report.target.baseUrl}\`
Mode: \`${report.mode}\`
Duration per endpoint: ${report.config.durationMs}ms
Concurrency: ${report.config.concurrency}

## Environment

- Runtime: Node.js ${report.environment.node}
- OS: ${report.environment.os}
- CPU: ${report.environment.cpu}
- RAM: ${report.environment.ramMb}MB total, ${report.environment.freeRamMb}MB free at start

## Results

Endpoint | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB p50 ms | TTFB p95 ms | TTFB p99 ms | Error % | Status codes
--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---
${rows.join("\n")}

## Regression Gate

Endpoint | Result | Observed p99 ms | Max p99 ms | Observed error % | Max error %
--- | --- | ---: | ---: | ---: | ---:
${gateRows.join("\n")}
`;
}

const local = await startLocalServer();
try {
  await mkdir(resultsDir, { recursive: true });
  const results = [];
  for (const endpoint of endpoints) {
    process.stdout.write(`Benchmarking ${endpoint.method} ${endpoint.path} ... `);
    const result = await runEndpoint(local.baseUrl, endpoint);
    results.push(result);
    process.stdout.write(`${result.requests} requests, p99 ${result.latencyMs.p99}ms, errors ${result.errorRatePct}%\n`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: smoke ? "smoke" : "full",
    target: { baseUrl: local.baseUrl, source: targetFromEnv ? "external" : "in-process local app" },
    config: { durationMs, concurrency },
    environment: {
      node: process.version,
      os: `${type()} ${release()} ${platform()}`,
      cpu: `${cpus()[0]?.model ?? "unknown"} (${cpus().length} cores)`,
      ramMb: Math.round(totalmem() / 1024 / 1024),
      freeRamMb: Math.round(freemem() / 1024 / 1024)
    },
    endpoints: endpoints.map(({ method, path, name }) => ({ method, path, name })),
    results
  };
  report.gates = evaluateThresholds(results);

  await writeFile(new URL("./latest.json", resultsDir), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(new URL("./latest.md", resultsDir), renderMarkdown(report));

  const failed = report.gates.filter((gate) => !gate.pass);
  if (failed.length > 0) {
    console.error(`Benchmark gate failed for ${failed.length} endpoint(s).`);
    process.exitCode = 1;
  }
} finally {
  await local.close();
}
