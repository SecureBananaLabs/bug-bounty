import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import http from "node:http";

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = join(here, "..");

const importModule = (relative) => import(pathToFileURL(join(here, relative)).href);

const SMOKE = process.argv.includes("--smoke");

async function readEnvTemplate() {
  const env = {};

  try {
    const raw = await readFile(join(here, ".env.benchmark"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
    }
  } catch {
    // The template is optional: sensible defaults below are enough to run.
  }

  return env;
}

function percentile(sortedValues, fraction) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.ceil(fraction * sortedValues.length) - 1);
  return Number(sortedValues[Math.max(0, index)].toFixed(2));
}

async function makeToken() {
  const { signAccessToken } = await importModule("../apps/api/src/utils/jwt.js");
  return signAccessToken({ sub: "usr_benchmark", role: "admin" });
}

function buildTargets(token) {
  const authorization = `Bearer ${token}`;

  return [
    { name: "health", method: "GET", path: "/health" },
    { name: "search", method: "GET", path: "/api/search?q=designer" },
    { name: "list-users", method: "GET", path: "/api/users" },
    { name: "list-jobs", method: "GET", path: "/api/jobs?status=open&minBudget=100" },
    { name: "list-proposals", method: "GET", path: "/api/proposals" },
    { name: "list-reviews", method: "GET", path: "/api/reviews" },
    { name: "list-messages", method: "GET", path: "/api/messages" },
    { name: "list-notifications", method: "GET", path: "/api/notifications" },
    {
      name: "admin-metrics",
      method: "GET",
      path: "/api/admin/metrics",
      headers: { authorization }
    },
    {
      name: "register",
      method: "POST",
      path: "/api/auth/register",
      body: { email: "bench@example.com", password: "benchmark-pass", role: "freelancer" }
    },
    {
      name: "login",
      method: "POST",
      path: "/api/auth/login",
      body: { email: "bench@example.com", password: "benchmark-pass" }
    },
    {
      name: "create-job",
      method: "POST",
      path: "/api/jobs",
      headers: { authorization },
      body: {
        title: "Benchmark landing page",
        description: "Build and ship a marketing landing page with responsive layouts.",
        budgetMin: 400,
        budgetMax: 1200,
        categoryId: "cat_web",
        skills: ["next.js", "css"]
      }
    },
    {
      name: "create-proposal",
      method: "POST",
      path: "/api/proposals",
      headers: { authorization },
      body: {
        jobId: "job_benchmark",
        bidAmount: 650,
        estimatedDuration: 5,
        title: "Landing page in one week",
        coverLetter: "I will ship a responsive landing page with tests and a staging preview."
      }
    },
    {
      name: "create-payment",
      method: "POST",
      path: "/api/payments",
      headers: { authorization },
      body: { amount: 6500, currency: "usd" }
    },
    {
      name: "create-review",
      method: "POST",
      path: "/api/reviews",
      headers: { authorization },
      body: { jobId: "job_benchmark", rating: 5, comment: "Delivered early and communicated well." }
    },
    {
      name: "create-message",
      method: "POST",
      path: "/api/messages",
      headers: { authorization },
      body: { senderId: "usr_benchmark", recipientId: "usr_client", content: "Staging link is ready." }
    },
    {
      name: "create-notification",
      method: "POST",
      path: "/api/notifications",
      headers: { authorization },
      body: { userId: "usr_client", title: "Proposal received", body: "A freelancer bid on your job." }
    },
    {
      name: "upload-file",
      method: "POST",
      path: "/api/uploads",
      headers: { authorization },
      multipart: { field: "file", filename: "brief.txt", contents: "Benchmark upload payload.\n" }
    }
  ];
}

function fireRequest({ hostname, port }, target) {
  return new Promise((resolve, reject) => {
    let payload;
    let contentType = "application/json";

    if (target.multipart !== undefined) {
      const boundary = "----BenchmarkBoundary";
      payload = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="${target.multipart.field}"; filename="${target.multipart.filename}"`,
        "Content-Type: text/plain",
        "",
        target.multipart.contents,
        `--${boundary}--`,
        ""
      ].join("\r\n");
      contentType = `multipart/form-data; boundary=${boundary}`;
    } else if (target.body !== undefined) {
      payload = JSON.stringify(target.body);
    }

    const headers = { accept: "application/json", ...(target.headers ?? {}) };

    if (payload !== undefined) {
      headers["content-type"] = contentType;
      headers["content-length"] = Buffer.byteLength(payload);
    }

    const startedAt = process.hrtime.bigint();
    let firstByteMs = 0;

    const request = http.request(
      { hostname, port, method: target.method, path: target.path, headers },
      (response) => {
        firstByteMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const totalMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
          resolve({
            totalMs,
            ttfbMs: firstByteMs,
            status: response.statusCode ?? 0,
            bytes: Buffer.concat(chunks).length
          });
        });
      }
    );

    request.on("error", reject);
    if (payload !== undefined) request.write(payload);
    request.end();
  });
}

async function benchmarkTarget(origin, target, { connections, durationMs }) {
  const url = new URL(target.path, origin);
  const options = { hostname: url.hostname, port: url.port };

  for (let index = 0; index < 5; index += 1) {
    await fireRequest(options, target);
  }

  const samples = [];
  const ttfbSamples = [];
  let errors = 0;
  let throttled = 0;
  let bytes = 0;
  let peakWindowRps = 0;
  const deadline = Date.now() + durationMs;
  const windowStart = Date.now();
  let windowCount = 0;

  const workers = Array.from({ length: connections }, async () => {
    while (Date.now() < deadline) {
      try {
        const result = await fireRequest(options, target);
        samples.push(result.totalMs);
        ttfbSamples.push(result.ttfbMs);
        bytes += result.bytes;
        windowCount += 1;
        // 429 is the shared API rate limiter saturating, not a server fault,
        // so it is reported apart from real errors.
        if (result.status === 429) throttled += 1;
        else if (result.status >= 400) errors += 1;
      } catch {
        errors += 1;
      }
    }
  });

  const startedAt = Date.now();
  await Promise.all(workers);
  const elapsedMs = Math.max(1, Date.now() - startedAt);

  const windowMs = Math.max(1, Date.now() - windowStart);
  peakWindowRps = Math.round((windowCount / windowMs) * 1000);

  const sorted = samples.slice().sort((a, b) => a - b);
  const totalRequests = samples.length + errors + throttled;

  return {
    name: target.name,
    endpoint: `${target.method} ${url.pathname}${url.search}`,
    requests: totalRequests,
    throttled: throttled,
    p50_latency_ms: percentile(sorted, 0.5),
    p95_latency_ms: percentile(sorted, 0.95),
    p99_latency_ms: percentile(sorted, 0.99),
    peak_rps: peakWindowRps,
    sustained_rps: Math.round((samples.length / elapsedMs) * 1000),
    error_rate_percent: Number(((errors / Math.max(1, totalRequests)) * 100).toFixed(2)),
    ttfb_ms: Number(percentile(ttfbSamples.sort((a, b) => a - b), 0.95).toFixed(2)),
    throughput_kb: Number((bytes / 1024).toFixed(1))
  };
}

function summarise(results, thresholds) {
  const rows = [
    "| endpoint | p50 ms | p95 ms | p99 ms | peak rps | sustained rps | errors % | ttfb ms |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const result of results) {
    rows.push(
      `| ${result.endpoint} | ${result.p50_latency_ms} | ${result.p95_latency_ms} | ${result.p99_latency_ms} | ${result.peak_rps} | ${result.sustained_rps} | ${result.error_rate_percent} | ${result.ttfb_ms} |`
    );
  }

  const failures = [];
  for (const result of results) {
    const limit = thresholds[result.name] ?? thresholds.default_p99_ms;
    if (typeof limit === "number" && result.p99_latency_ms > limit) {
      failures.push(`${result.endpoint}: p99 ${result.p99_latency_ms}ms > ${limit}ms`);
    }
  }

  return { markdown: `${rows.join("\n")}\n`, failures };
}

async function main() {
  const env = await readEnvTemplate();
  // The smoke mode used by CI must stay low-concurrency regardless of the
  // template, otherwise the shared API rate limiter dominates the numbers.
  const connections = SMOKE
    ? Number(env.BENCHMARK_SMOKE_CONNECTIONS ?? 2)
    : Number(env.BENCHMARK_CONNECTIONS ?? 10);
  const durationMs = Number(
    (SMOKE ? env.BENCHMARK_SMOKE_DURATION_MS : env.BENCHMARK_DURATION_MS) ??
      (SMOKE ? 500 : 1500)
  );

  const { createApp } = await importModule("../apps/api/src/app.js");
  let server;
  let origin = "";
  const configured = env.BENCHMARK_HOST ?? "";

  if (configured.includes("://")) {
    // A staging URL in the template wins: benchmark the deployed target instead.
    origin = configured;
  } else {
    const app = createApp();
    const bindHost = configured || "127.0.0.1";
    origin = await new Promise((resolve, reject) => {
      server = app.listen(0, bindHost, () => {
        resolve(`http://${bindHost}:${server.address().port}`);
      });
      server.once("error", reject);
    });
  }

  const token = env.BENCHMARK_TOKEN || (await makeToken());
  const targets = buildTargets(token);
  const results = [];

  for (const target of targets) {
    results.push(await benchmarkTarget(origin, target, { connections, durationMs }));
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  const thresholds = JSON.parse(
    await readFile(join(here, "thresholds.json"), "utf8")
  );
  const { markdown, failures } = summarise(results, thresholds);

  const resultsDir = join(here, "results");
  await mkdir(resultsDir, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    mode: SMOKE ? "smoke" : "full",
    runtime: { node: process.version, connections, durationMs },
    endpoints: results
  };

  await writeFile(join(resultsDir, "benchmark-results.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(
    join(resultsDir, "benchmark-summary.md"),
    `# API benchmark summary\n\nMode: ${report.mode} · Node ${report.runtime.node} · ${connections} connections for ${durationMs}ms per endpoint\n\n${markdown}\nRegression gate: ${failures.length === 0 ? "PASS" : `FAIL (${failures.join("; ")})`}\n`
  );

  process.stdout.write(markdown);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

await main();
