#!/usr/bin/env node
/**
 * Full API benchmark suite.
 *
 * Usage:
 *   npm run benchmark            # starts a local API server, runs everything, stops it
 *   BASE_URL=http://staging:4000 npm run benchmark   # benchmark a remote server instead
 *
 * Configuration lives in benchmarks/.env.benchmark (template committed).
 * Results land in benchmarks/results/ as JSON + a human-readable markdown summary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import autocannon from "autocannon";
import { endpoints } from "./config/endpoints.js";
import { sampleTtfb } from "./lib/ttfb.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const RESULTS_DIR = path.join(here, "results");

// ---------------------------------------------------------------- config
function loadDotEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith("#")) out[m[1]] = m[2];
  }
  return out;
}

const fileEnv = loadDotEnv(path.join(here, ".env.benchmark"));
const env = { ...fileEnv, ...process.env };

const cfg = {
  baseUrl: env.BASE_URL || `http://localhost:${env.BENCH_PORT || 4000}`,
  startServer: !env.BASE_URL,
  port: Number(env.BENCH_PORT || 4000),
  jwtSecret: env.BENCH_JWT_SECRET || "benchmark-secret-not-for-production",
  burst: {
    connections: Number(env.BENCH_BURST_CONNECTIONS || 100),
    duration: Number(env.BENCH_BURST_DURATION || 10),
  },
  sustain: {
    connections: Number(env.BENCH_SUSTAIN_CONNECTIONS || 20),
    duration: Number(env.BENCH_SUSTAIN_DURATION || 20),
  },
  ttfbSamples: Number(env.BENCH_TTFB_SAMPLES || 50),
};

// ---------------------------------------------------------------- helpers
function buildMultipart({ fieldName, filename, contentType, sizeBytes }) {
  const boundary = "----benchboundary" + Date.now().toString(36);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
  );
  const payload = Buffer.alloc(sizeBytes, "a");
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return {
    body: Buffer.concat([head, payload, tail]),
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
  };
}

function toAutocannonArgs(ep, baseUrl, token) {
  const headers = { ...(ep.headers || {}) };
  let body = null;
  if (ep.body !== undefined) {
    body = typeof ep.body === "string" ? ep.body : JSON.stringify(ep.body);
  }
  if (ep.multipart) {
    const mp = buildMultipart(ep.multipart);
    body = mp.body;
    Object.assign(headers, mp.headers);
  }
  if (ep.auth === "admin" && token) headers.authorization = `Bearer ${token}`;
  return { url: baseUrl + ep.path, method: ep.method, headers, body };
}

async function waitForHealth(baseUrl, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${baseUrl}/health`);
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${baseUrl} did not become healthy in ${timeoutMs}ms`);
}

async function fetchAdminToken(baseUrl) {
  const creds = {
    email: `bench.admin.${Date.now()}@example.com`,
    password: "BenchAdmin123!",
    role: "admin",
  };
  const json = { "content-type": "application/json" };
  for (const route of ["register", "login"]) {
    try {
      const r = await fetch(`${baseUrl}/api/auth/${route}`, {
        method: "POST",
        headers: json,
        body: JSON.stringify(route === "register" ? creds : { email: creds.email, password: creds.password }),
      });
      const j = await r.json().catch(() => null);
      if (j && j.success && j.data && j.data.token) return j.data.token;
    } catch {}
  }
  throw new Error("Could not obtain a benchmark admin token (register + login both failed)");
}

function summarizeAutocannon(result, label) {
  const total = (result.requests?.total || 0) + (result.errors || 0) + (result.timeouts || 0);
  const bad = (result.errors || 0) + (result.timeouts || 0) + (result.non2xx || 0);
  return {
    label,
    rps: +(result.requests?.average || 0).toFixed(1),
    totalRequests: result.requests?.total || 0,
    errors: result.errors || 0,
    timeouts: result.timeouts || 0,
    non2xx: result.non2xx || 0,
    errorRatePct: total > 0 ? +((bad / total) * 100).toFixed(2) : 0,
    latencyMs: {
      p50: result.latency?.p50 ?? null,
      p75: result.latency?.p75 ?? null,
      p90: result.latency?.p90 ?? null,
      // autocannon reports p97.5 (not p95) as its mid-tail percentile
      p975: result.latency?.p97_5 ?? null,
      p99: result.latency?.p99 ?? null,
      max: result.latency?.max ?? null,
    },
  };
}

async function benchmarkEndpoint(ep, baseUrl, token) {
  const args = toAutocannonArgs(ep, baseUrl, token);

  const burst = await autocannon({ ...args, connections: cfg.burst.connections, duration: cfg.burst.duration, title: `${ep.name} burst` });
  const sustained = await autocannon({ ...args, connections: cfg.sustain.connections, duration: cfg.sustain.duration, title: `${ep.name} sustained` });
  const ttfb = await sampleTtfb(args.url, {
    samples: cfg.ttfbSamples,
    headers: args.headers,
    method: ep.method,
    body: args.body,
  });

  const burstSum = summarizeAutocannon(burst, "burst");
  const susSum = summarizeAutocannon(sustained, "sustained");

  return {
    endpoint: ep.name,
    method: ep.method,
    path: ep.path,
    auth: ep.auth || "none",
    peakRps: burstSum.rps,
    sustainedRps: susSum.rps,
    p50Ms: susSum.latencyMs.p50,
    p975Ms: susSum.latencyMs.p975,
    p99Ms: susSum.latencyMs.p99,
    maxLatencyMs: susSum.latencyMs.max,
    errorRatePct: susSum.errorRatePct,
    totalRequests: susSum.totalRequests,
    ttfbMs: { p50: ttfb.p50, p95: ttfb.p95, p99: ttfb.p99, max: ttfb.max },
  };
}

function environmentInfo() {
  return {
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    autocannon: "7.x",
    // The runner sets BENCHMARK_MODE=1 on servers it starts itself; for an
    // external BASE_URL the target keeps whatever limiter config it has.
    rateLimiter: cfg.startServer
      ? "disabled (BENCHMARK_MODE=1 on runner-managed server)"
      : "as configured on target server",
    burst: cfg.burst,
    sustained: cfg.sustain,
    ttfbSamples: cfg.ttfbSamples,
  };
}

function toMarkdown(results, envInfo, startedAt) {
  const lines = [];
  lines.push(`# API Benchmark Report`);
  lines.push(``);
  lines.push(`- Started: ${startedAt}`);
  lines.push(`- Target: ${cfg.baseUrl}`);
  lines.push(`- Node: ${envInfo.node} (${envInfo.platform})`);
  lines.push(`- Rate limiter: ${envInfo.rateLimiter}`);
  lines.push(`- Burst: ${envInfo.burst.connections} conns x ${envInfo.burst.duration}s · Sustained: ${envInfo.sustained.connections} conns x ${envInfo.sustained.duration}s · TTFB samples: ${envInfo.ttfbSamples}`);
  lines.push(``);
  lines.push(`| Endpoint | p50 (ms) | p97.5 (ms) | p99 (ms) | RPS peak | RPS sustained | Err % | TTFB p50/p95 (ms) |`);
  lines.push(`|---|---|---|---|---|---|---|---|`);
  for (const r of results) {
    lines.push(
      `| ${r.endpoint} | ${r.p50Ms} | ${r.p975Ms} | ${r.p99Ms} | ${r.peakRps} | ${r.sustainedRps} | ${r.errorRatePct} | ${r.ttfbMs.p50}/${r.ttfbMs.p95} |`
    );
  }
  lines.push(``);
  lines.push(`_Peak RPS = burst run average (${envInfo.burst.connections} connections, ${envInfo.burst.duration}s). Sustained RPS and latency percentiles from the sustained run. Error % = (errors + timeouts + non-2xx) / total. autocannon reports p97.5 as its mid-tail percentile (shown in the p97.5 column)._`);
  return lines.join("\n");
}

// ---------------------------------------------------------------- main
async function main() {
  const startedAt = new Date().toISOString();
  let server = null;

  if (cfg.startServer) {
    console.log(`Starting local API server on port ${cfg.port} (BENCHMARK_MODE=1, rate limiter off)...`);
    server = spawn("node", ["apps/api/src/server.js"], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(cfg.port), JWT_SECRET: cfg.jwtSecret, BENCHMARK_MODE: "1" },
      stdio: "ignore",
    });
    await waitForHealth(cfg.baseUrl);
    console.log("Server healthy.");
  }

  try {
    const token = await fetchAdminToken(cfg.baseUrl);
    console.log("Benchmark admin token acquired.");

    const results = [];
    for (const ep of endpoints) {
      process.stdout.write(`  benchmarking ${ep.name} ... `);
      const r = await benchmarkEndpoint(ep, cfg.baseUrl, token);
      results.push(r);
      console.log(`p99=${r.p99Ms}ms rps=${r.sustainedRps} err=${r.errorRatePct}%`);
    }

    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    const stamp = startedAt.replace(/[:.]/g, "-").slice(0, 19);
    const payload = {
      startedAt,
      target: cfg.baseUrl,
      environment: environmentInfo(),
      endpoints: results,
    };
    const jsonPath = path.join(RESULTS_DIR, `benchmark-${stamp}.json`);
    const mdPath = path.join(RESULTS_DIR, `benchmark-${stamp}.md`);
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
    fs.writeFileSync(mdPath, toMarkdown(results, payload.environment, startedAt));

    console.log(`\nDone. ${results.length} endpoints.`);
    console.log(`  JSON:     ${path.relative(ROOT, jsonPath)}`);
    console.log(`  Markdown: ${path.relative(ROOT, mdPath)}`);
  } finally {
    if (server) {
      server.kill("SIGTERM");
      console.log("Local server stopped.");
    }
  }
}

main().catch((err) => {
  console.error("Benchmark failed:", err.message);
  process.exit(1);
});
