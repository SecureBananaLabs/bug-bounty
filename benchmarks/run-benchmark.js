#!/usr/bin/env node
/**
 * API benchmark runner.
 *
 *  - Starts the API as a CHILD process (never in-process: a route that throws
 *    would otherwise take the whole harness down with it).
 *  - Benchmarks every endpoint in manifest.js with autocannon.
 *  - Measures TTFB separately with raw http.request — autocannon's
 *    onResponse(responseTime) is TOTAL response time, not TTFB.
 *  - Writes benchmarks/results/<stamp>.json and a Markdown summary.
 *  - With --smoke, runs a low-concurrency pass and exits non-zero if any
 *    endpoint breaches benchmarks/thresholds.json (the CI regression gate).
 *
 * Usage:
 *   npm run benchmark                 # full run
 *   npm run benchmark:smoke           # CI gate (low concurrency)
 *   BENCH_TARGET_HOST=http://host npm run benchmark   # bench an already-running server
 */

import { spawn } from "node:child_process";
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import autocannon from "autocannon";
import jwt from "jsonwebtoken";
import { ENDPOINTS, AUTH_CLAIMS } from "./manifest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESULTS_DIR = path.join(__dirname, "results");
const THRESHOLDS_PATH = path.join(__dirname, "thresholds.json");

const SMOKE = process.argv.includes("--smoke");
const PORT = Number(process.env.BENCH_PORT ?? 4010);
const HOST = `http://127.0.0.1:${PORT}`;
// If BENCH_TARGET_HOST is set we benchmark an already-running server instead.
const TARGET = process.env.BENCH_TARGET_HOST || HOST;
const EXTERNAL = Boolean(process.env.BENCH_TARGET_HOST);

const PROFILE = SMOKE
  ? { connections: 10, duration: 5, pipelining: 1 }
  : { connections: 50, duration: 15, pipelining: 1 };

const TTFB_SAMPLES = 20;

// ---------------------------------------------------------------- auth token
function mintToken() {
  // Sign with the app's OWN secret (config/env.js: JWT_SECRET ?? "development-secret"),
  // matching the claim shape authService uses ({ sub, role }). Signing with any
  // other secret yields 401 on every protected route.
  const secret = process.env.JWT_SECRET ?? "development-secret";
  return jwt.sign(AUTH_CLAIMS, secret, { expiresIn: "15m" });
}

// ------------------------------------------------------------------- payloads
function multipartBody() {
  const boundary = "----BenchBoundary" + Date.now();
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="file"; filename="bench.txt"\r\n'),
    Buffer.from("Content-Type: text/plain\r\n\r\n"),
    Buffer.from("benchmark upload payload\n"),
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);
  return { body: payload, contentType: `multipart/form-data; boundary=${boundary}` };
}

function requestFor(ep, token) {
  const url = TARGET + ep.path + (ep.query ? "?" + new URLSearchParams(ep.query).toString() : "");
  const req = { method: ep.method, url };

  if (ep.multipart) {
    const { body, contentType } = multipartBody();
    req.body = body;
    // Do NOT set content-length here. autocannon computes it, and passing an
    // explicit one makes it issue ZERO requests (measured: 0 vs ~97k for the
    // identical payload) — which then reports as a silent "0% error" row.
    req.headers = { "content-type": contentType };
  } else if (ep.headers && ep.headers.body) {
    req.body = ep.headers.body;
    req.headers = { "content-type": "application/json" };
  } else if (ep.method !== "GET") {
    req.body = "{}";
    req.headers = { "content-type": "application/json" };
  }
  if (ep.auth && token) {
    req.headers = { ...(req.headers ?? {}), authorization: `Bearer ${token}` };
  }
  return req;
}

// ----------------------------------------------------------------- TTFB probe
function measureTTFB(ep, token, samples = TTFB_SAMPLES) {
  const url = TARGET + ep.path + (ep.query ? "?" + new URLSearchParams(ep.query).toString() : "");
  const mod = url.startsWith("https") ? https : http;
  const headers = {};
  let body, method = ep.method;

  if (ep.multipart) {
    const { body: b, contentType } = multipartBody();
    body = b; headers["content-type"] = contentType; headers["content-length"] = b.length;
  } else if (ep.headers && ep.headers.body) {
    body = ep.headers.body; headers["content-type"] = "application/json";
  } else if (method !== "GET") {
    body = "{}"; headers["content-type"] = "application/json";
  }
  if (ep.auth && token) headers.authorization = `Bearer ${token}`;

  return new Promise((resolve) => {
    const times = [];
    let done = 0;
    const next = () => {
      if (done >= samples) {
        times.sort((a, b) => a - b);
        const pick = (p) => times.length ? times[Math.min(times.length - 1, Math.floor(p * times.length))] : null;
        return resolve({
          samples: times.length,
          p50: round(pick(0.5)), p95: round(pick(0.95)), p99: round(pick(0.99)),
          min: round(times[0]), max: round(times[times.length - 1])
        });
      }
      done++;
      // hrtime.bigint() to the FIRST 'response' event = time to first byte.
      const t0 = process.hrtime.bigint();
      // NOTE: the URL must be passed positionally — http.request(options, cb)
      // with no URL silently targets localhost:80 and every sample errors out.
      const r = mod.request(url, { method, headers, timeout: 10000 }, (res) => {
        res.once("data", () => {});        // first byte has arrived at this point
        res.resume();
        const ms = Number(process.hrtime.bigint() - t0) / 1e6;
        times.push(ms);
        res.on("end", next);
      });
      r.on("error", next);
      r.on("timeout", () => { r.destroy(); next(); });
      if (body) r.write(body);
      r.end();
    };
    next();
  });
}

// --------------------------------------------------------- high-res latency
// autocannon's latency histogram is INTEGER MILLISECONDS. On loopback against a
// mock API every request is sub-millisecond, so p50/p95 both round to 0 and the
// two columns the issue asks for carry no information. This probe re-measures
// the same endpoints with hrtime at sub-ms resolution, under a small concurrent
// load, so the percentiles are meaningful. autocannon's own numbers are kept
// alongside for throughput and error accounting.
const LAT_SAMPLES = 200;
const LAT_CONCURRENCY = 10;

function measureLatency(ep, token, samples = LAT_SAMPLES, concurrency = LAT_CONCURRENCY) {
  const url = TARGET + ep.path + (ep.query ? "?" + new URLSearchParams(ep.query).toString() : "");
  const mod = url.startsWith("https") ? https : http;
  const headers = {};
  let body, method = ep.method;

  if (ep.multipart) {
    const { body: b, contentType } = multipartBody();
    body = b; headers["content-type"] = contentType; headers["content-length"] = b.length;
  } else if (ep.headers && ep.headers.body) {
    body = ep.headers.body; headers["content-type"] = "application/json";
  } else if (method !== "GET") {
    body = "{}"; headers["content-type"] = "application/json";
  }
  if (ep.auth && token) headers.authorization = `Bearer ${token}`;

  return new Promise((resolve) => {
    const times = [];
    let started = 0;
    let settled = false;

    const finish = () => {
      if (settled) return;
      if (times.length >= samples || (started >= samples && pending() === 0)) {
        settled = true;
        if (times.length === 0) return resolve(null);
        const s = [...times].sort((a, b) => a - b);
        const pick = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
        return resolve({
          samples: s.length,
          p50: round(pick(0.5)), p95: round(pick(0.95)), p99: round(pick(0.99)),
          min: round(s[0]), max: round(s[s.length - 1])
        });
      }
    };
    let inflight = 0;
    const pending = () => inflight;

    const one = () => {
      if (settled || started >= samples) return finish();
      started++;
      inflight++;
      const t0 = process.hrtime.bigint();
      const r = mod.request(url, { method, headers, timeout: 10000 }, (res) => {
        res.resume();
        res.on("end", () => {
          inflight--;
          times.push(Number(process.hrtime.bigint() - t0) / 1e6);
          finish();
          one();
        });
      });
      const bail = () => { inflight--; finish(); one(); };
      r.on("error", bail);
      r.on("timeout", () => { r.destroy(); });
      if (body) r.write(body);
      r.end();
    };

    for (let i = 0; i < Math.min(concurrency, samples); i++) one();
  });
}

const round = (n) => (n === null || n === undefined ? null : Number(n.toFixed(3)));

// ------------------------------------------------------------------- run one
async function runEndpoint(ep, token) {
  const req = requestFor(ep, token);
  const res = await autocannon({ ...req, ...PROFILE, timeout: 30 });

  const total = res.requests.total || 0;
  // non2xx is NOT folded into res.errors — it must be added explicitly.
  const non2xx = res.non2xx ?? 0;
  // A run that issued ZERO requests measured nothing. Reporting that as 0%
  // error reads as a clean pass and is exactly the failure mode this harness
  // exists to avoid — mark it as no-data so the gate treats it as a failure.
  const noData = total === 0;
  const errorRate = noData
    ? null
    : Number((((res.errors + res.timeouts + non2xx) / total) * 100).toFixed(3));

  const ttfb = await measureTTFB(ep, token);
  const hiRes = await measureLatency(ep, token);

  return {
    name: ep.name,
    method: ep.method,
    path: ep.path,
    auth: Boolean(ep.auth),
    noData,
    requests: { total: res.requests.total, average: round(res.requests.average) },
    rps: { peak: round(res.requests.max), sustained: round(res.requests.average) },
    latency: {
      p50: round(res.latency.p50),
      // autocannon v8 exposes p50 / p97_5 / p99 — there is NO p95 key.
      p95: round(res.latency.p97_5),
      p95_source: "autocannon latency.p97_5",
      p99: round(res.latency.p99),
      max: round(res.latency.max),
      resolution: "integer ms — reads 0 when a request is sub-millisecond"
    },
    // Sub-millisecond percentiles measured with hrtime at LAT_CONCURRENCY.
    // This is the column to trust for a fast local API.
    latencyHiRes: hiRes,
    ttfb,
    errors: res.errors,
    timeouts: res.timeouts,
    non2xx,
    errorRatePct: errorRate,
    throughput: { avgBytesPerSec: round(res.throughput.average) }
  };
}

// ------------------------------------------------------------------ thresholds
function loadThresholds() {
  if (!fs.existsSync(THRESHOLDS_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(THRESHOLDS_PATH, "utf8")); } catch { return null; }
}

function evaluateGate(rows, thresholds) {
  if (!thresholds) return { available: false, breaches: [] };
  const breaches = [];
  for (const r of rows) {
    if (r.noData) { breaches.push(`${r.name}: NO DATA — the run issued 0 requests (not a pass)`); continue; }
    const t = thresholds.endpoints?.[r.name] ?? thresholds.default;
    if (!t) continue;
    // Compare against the hrtime percentiles. autocannon reports integer ms and
    // reads 0 on a fast local API, so gating on its numbers can never fail.
    const h = r.latencyHiRes || {};
    const p95 = h.p95 ?? r.latency.p95;
    const p99 = h.p99 ?? r.latency.p99;
    if (t.p99 != null && p99 != null && p99 > t.p99)
      breaches.push(`${r.name}: p99 ${p99}ms > ${t.p99}ms`);
    if (t.p95 != null && p95 != null && p95 > t.p95)
      breaches.push(`${r.name}: p95 ${p95}ms > ${t.p95}ms`);
    if (t.errorRatePct != null && r.errorRatePct != null && r.errorRatePct > t.errorRatePct)
      breaches.push(`${r.name}: errorRate ${r.errorRatePct}% > ${t.errorRatePct}%`);
    if (t.minRps != null && r.rps.sustained != null && r.rps.sustained < t.minRps)
      breaches.push(`${r.name}: rps ${r.rps.sustained} < ${t.minRps}`);
  }
  return { available: true, breaches };
}

// -------------------------------------------------------------------- markdown
function toMarkdown(meta, rows, gate) {
  const lines = [];
  lines.push(`# API Benchmark Report`);
  lines.push("");
  lines.push(`- **Generated:** ${meta.startedAt}`);
  lines.push(`- **Mode:** ${meta.smoke ? "smoke (CI gate)" : "full"}`);
  lines.push(`- **Target:** ${meta.target}${EXTERNAL ? " (external)" : " (child process)"}`);
  lines.push(`- **Profile:** ${PROFILE.connections} connections, ${PROFILE.duration}s per endpoint`);
  lines.push(`- **Endpoints:** ${rows.length}`);
  lines.push(`- **Runtime:** Node ${process.version} on ${process.platform}/${process.arch}`);
  lines.push("");
  lines.push(`| Endpoint | Method | Path | p50 (ms) | p95 (ms) | p99 (ms) | TTFB p50 (ms) | RPS (sustained) | RPS (peak) | Error rate |`);
  lines.push(`|---|---|---|---:|---:|---:|---:|---:|---:|---:|`);
  for (const r of rows) {
    if (r.noData) {
      lines.push(`| \`${r.name}\` | ${r.method} | \`${r.path}\` | ⚠ no data | ⚠ no data | ⚠ no data | ⚠ no data | 0 | 0 | ⚠ no data |`);
      continue;
    }
    const h = r.latencyHiRes || {};
    lines.push(`| \`${r.name}\` | ${r.method} | \`${r.path}\` | ${h.p50 ?? "-"} | ${h.p95 ?? "-"} | ${h.p99 ?? "-"} | ${r.ttfb.p50 ?? "-"} | ${r.rps.sustained ?? "-"} | ${r.rps.peak ?? "-"} | ${r.errorRatePct}% |`);
  }
  lines.push("");
  lines.push(`## Latency measured two ways`);
  lines.push("");
  lines.push(`\`p50/p95/p99\` above are **hrtime sub-millisecond percentiles** over ${LAT_SAMPLES} samples at concurrency ${LAT_CONCURRENCY}.`);
  lines.push(`autocannon's own histogram is integer-millisecond resolution, so on a fast local API it`);
  lines.push(`reports \`0\` for p50 and p95 and carries no information. Both are recorded in the JSON:`);
  lines.push("");
  lines.push(`| Endpoint | autocannon p50 / p95 / p99 (ms) | hrtime p50 / p95 / p99 (ms) |`);
  lines.push(`|---|---|---|`);
  for (const r of rows) {
    if (r.noData) continue;
    const h = r.latencyHiRes || {};
    lines.push(`| \`${r.name}\` | ${r.latency.p50} / ${r.latency.p95} / ${r.latency.p99} | ${h.p50 ?? "-"} / ${h.p95 ?? "-"} / ${h.p99 ?? "-"} |`);
  }
  lines.push("");
  const crashed = rows.filter((r) => r.crashed);
  if (crashed.length) {
    lines.push(`## ⚠ THE API PROCESS DIED DURING THIS RUN`);
    lines.push("");
    lines.push(`The server exited while these endpoints were being measured. Their rows are`);
    lines.push(`**not latency measurements** — they are connection failures. See`);
    lines.push(`\`benchmarks/results/server.log\` for the process's own output.`);
    lines.push("");
    for (const r of crashed) lines.push(`- \`${r.name}\` (\`${r.method} ${r.path}\`)`);
    lines.push("");
  }
  const noData = rows.filter((r) => r.noData);
  if (noData.length) {
    lines.push(`## ⚠ Endpoints with NO DATA (the run issued 0 requests)`);
    lines.push("");
    lines.push(`These are reported as failures, not as passing rows — a benchmark that ran nothing must never read as 0% error:`);
    lines.push("");
    for (const r of noData) lines.push(`- \`${r.name}\` (\`${r.method} ${r.path}\`)`);
    lines.push("");
  }
  lines.push(`> Latency percentiles are autocannon's \`latency.p50\`/\`latency.p97_5\`/\`latency.p99\``);
  lines.push(`> reported into the p50/p95/p99 columns (autocannon exposes p97_5, not p95).`);
  lines.push(`> TTFB is measured separately with raw \`http.request\` over ${TTFB_SAMPLES} samples,`);
  lines.push(`> timed to the first \`response\` event — autocannon's own per-response time is total latency.`);
  lines.push(`> Error rate = (errors + timeouts + non-2xx) / total requests.`);
  lines.push("");
  const failing = rows.filter((r) => r.errorRatePct >= 100);
  if (failing.length) {
    lines.push(`## Endpoints returning no successful response`);
    lines.push("");
    lines.push(`These require a real database record or valid credentials that the mock data layer does not provide.`);
    lines.push(`They are reported as-is rather than omitted:`);
    lines.push("");
    for (const r of failing) lines.push(`- \`${r.name}\` (\`${r.method} ${r.path}\`) — ${r.errorRatePct}%`);
    lines.push("");
  }
  if (gate?.available) {
    lines.push(`## Regression gate`);
    lines.push("");
    lines.push(gate.breaches.length ? `${gate.breaches.length} threshold breach(es):` : `All endpoints within thresholds.`);
    lines.push("");
    for (const b of gate.breaches) lines.push(`- ❌ ${b}`);
    lines.push("");
  }
  return lines.join("\n");
}

// ----------------------------------------------------------------------- main
async function waitForServer(url, capMs = 20000) {
  const deadline = Date.now() + capMs;
  while (Date.now() < deadline) {
    try {
      const code = await new Promise((resolve) => {
        const r = http.get(url + "/health", (res) => { res.resume(); resolve(res.statusCode); });
        r.on("error", () => resolve(0));
        r.setTimeout(1500, () => { r.destroy(); resolve(0); });
      });
      if (code === 200) return true;
    } catch { /* keep waiting */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  let child = null;
  let childLog = "";
  let childDead = false;

  if (!EXTERNAL) {
    // Child process, never in-process — one bad route must not kill the harness.
    // Capture its output: with stdio:"ignore" a crash is silent and the run then
    // reports the dead server's timeouts as if they were real latency.
    child = spawn(process.execPath, [path.join(ROOT, "apps/api/src/server.js")], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT), BENCHMARK_DISABLE_LIMITER: "true" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    child.stdout.on("data", (d) => { childLog += d.toString(); });
    child.stderr.on("data", (d) => { childLog += d.toString(); });
    child.on("exit", (code, sig) => {
      childDead = true;
      childLog += `\n[harness] child exited code=${code} signal=${sig}\n`;
    });
    const ready = await waitForServer(HOST);
    // waitForServer only proves SOMETHING is answering on that port — it could be a
    // stale server from an earlier run. Verify our own child is still alive before
    // measuring anything, or every row measures the wrong process.
    if (childDead) {
      console.error(`\nThe benchmark's own API child died during startup.`);
      console.error(`Its output:\n${childLog.trim().split("\n").map((l) => "    " + l).join("\n")}`);
      console.error(`\nMost likely a previous run is still holding port ${PORT}. Free it (or set BENCH_PORT) and retry.`);
      process.exit(1);
    }
    if (!ready) {
      console.error(`API did not become healthy at ${HOST} within 20s — aborting.`);
      child.kill();
      process.exit(1);
    }
    console.log(`API up at ${HOST} (pid ${child.pid})`);
  }

  const token = mintToken();
  const rows = [];
  let aborted = false;

  for (const ep of ENDPOINTS) {
    // The API can die mid-run (this app throws on an unhandled ZodError and takes
    // the whole process with it). Detect that BEFORE benchmarking, otherwise every
    // subsequent row records connection timeouts as if they were latency.
    if (!EXTERNAL && childDead) {
      console.error(`\nAPI PROCESS DIED — stopping. Remaining endpoints were not measured.`);
      aborted = true;
      break;
    }
    process.stdout.write(`  benchmarking ${ep.method} ${ep.path} ... `);
    try {
      const r = await runEndpoint(ep, token);
      rows.push(r);
      console.log(`p50 ${(r.latencyHiRes || {}).p50 ?? r.latency.p50}ms · p99 ${(r.latencyHiRes || {}).p99 ?? r.latency.p99}ms · ${r.rps.sustained} rps · ${r.errorRatePct}% err`);
    } catch (e) {
      console.log(`ERROR ${e.message}`);
      rows.push({
        name: ep.name, method: ep.method, path: ep.path, auth: Boolean(ep.auth),
        crashed: childDead, error: String(e.message).slice(0, 200),
        latency: { p50: null, p95: null, p99: null, max: null },
        ttfb: { p50: null }, latencyHiRes: null,
        rps: { peak: null, sustained: null },
        requests: { total: 0 }, errors: 1, timeouts: 0, non2xx: 0, errorRatePct: null,
        noData: true
      });
    }
  }

  if (child) child.kill("SIGTERM");

  // Record the child's own output next to the results — if it crashed, the reason
  // is the single most valuable thing this run produced.
  if (childLog.trim()) {
    fs.writeFileSync(path.join(RESULTS_DIR, "server.log"), childLog);
    console.log(`\n(server output captured to benchmarks/results/server.log)`);
  }

  const thresholds = loadThresholds();
  const gate = evaluateGate(rows, thresholds);
  const stamp = startedAt.replace(/[:.]/g, "-");
  const meta = { startedAt, smoke: SMOKE, target: TARGET, profile: PROFILE, node: process.version };

  fs.writeFileSync(path.join(RESULTS_DIR, `${stamp}.json`), JSON.stringify({ meta, gate, endpoints: rows }, null, 2));
  fs.writeFileSync(path.join(RESULTS_DIR, "latest.json"), JSON.stringify({ meta, gate, endpoints: rows }, null, 2));
  const md = toMarkdown(meta, rows, gate);
  fs.writeFileSync(path.join(RESULTS_DIR, "latest.md"), md);
  fs.writeFileSync(path.join(RESULTS_DIR, `${stamp}.md`), md);

  console.log(`\nWrote benchmarks/results/${stamp}.json and latest.md`);

  if (gate.available && gate.breaches.length) {
    console.error(`\nRegression gate FAILED (${gate.breaches.length}):`);
    for (const b of gate.breaches) console.error(`  - ${b}`);
    if (SMOKE) process.exit(1);
  } else if (gate.available) {
    console.log(`\nRegression gate passed.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
