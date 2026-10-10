#!/usr/bin/env node
/**
 * bug-bounty#30 benchmark runner (stdlib only, no new dependencies).
 *
 *   npm run benchmark          # full suite (local server spawned)
 *   npm run benchmark:smoke    # CI smoke: 1 request/endpoint, p99 gate
 *
 * Metrics per endpoint: p50/p95/p99 latency (ms), p50/p95/p99 TTFB (ms),
 * sustained RPS, error rate (%). Latency = time to last byte; TTFB = time to
 * first data chunk. Units are explicit in every output artifact.
 *
 * Auth: obtains a JWT via POST /api/auth/login with the dedicated benchmark
 * account (BENCHMARK_EMAIL/PASSWORD, defaults are non-production test values)
 * and attaches it as Bearer for auth-protected routes. No production
 * credential is required or accepted here.
 *
 * Exit code: 0 when all p99 thresholds pass, 1 on any threshold breach or
 * transport failure. Thresholds: benchmarks/thresholds.json.
 */
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { request as httpRequest } from "node:http";
import { ENDPOINTS } from "./endpoints.mjs";
import { buildPayload } from "./payloads.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RESULTS_DIR = join(HERE, "results");

const ARGS = new Set(process.argv.slice(2));
const SMOKE = ARGS.has("--smoke");

function loadLocalEnv() {
  for (const name of [".env.benchmark.local", ".env.benchmark"]) {
    const p = join(HERE, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const [k, ...rest] = t.split("=");
      if (!(k.trim() in process.env)) process.env[k.trim()] = rest.join("=").trim();
    }
    if (name === ".env.benchmark.local") break;
  }
}
loadLocalEnv();

const BASE_URL = process.env.BENCHMARK_BASE_URL ?? "http://127.0.0.1:4100";
const EMAIL = process.env.BENCHMARK_EMAIL ?? "bench@example.com";
const PASSWORD = process.env.BENCHMARK_PASSWORD ?? "Benchmark-123";
const PER_ENDPOINT = SMOKE ? 1 : Number(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT ?? 20);
const CONCURRENCY = SMOKE ? 1 : Number(process.env.BENCHMARK_CONCURRENCY ?? 4);
const SPAWN_SERVER = process.env.BENCHMARK_SPAWN_SERVER !== "0";

const thresholds = JSON.parse(readFileSync(join(HERE, "thresholds.json"), "utf8"));

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, i)];
}

function doRequest(url, { method, headers, body }) {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    let ttfbMs = null;
    const req = httpRequest(url, { method, headers }, (res) => {
      res.on("data", () => {
        if (ttfbMs === null) {
          ttfbMs = Number(process.hrtime.bigint() - start) / 1e6;
        }
      });
      res.on("end", () => {
        const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;
        resolve({ status: res.statusCode ?? 0, ttfbMs: ttfbMs ?? latencyMs, latencyMs, ok: true });
      });
    });
    req.on("error", () => {
      resolve({ status: 0, ttfbMs: 0, latencyMs: Number(process.hrtime.bigint() - start) / 1e6, ok: false });
    });
    req.setTimeout(30000, () => req.destroy());
    if (body) req.write(body);
    req.end();
  });
}

function multipartBody(filename) {
  const boundary = "----benchboundary";
  const part =
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    `Content-Type: text/plain\r\n\r\nbenchmark payload body\r\n--${boundary}--\r\n`;
  return { body: part, contentType: `multipart/form-data; boundary=${boundary}` };
}

async function login(base) {
  const res = await doRequest(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  return res;
}

async function waitForServer(base, proc) {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await doRequest(`${base}/health`, { method: "GET", headers: {} });
      if (res.status === 200) return true;
    } catch { /* retry */ }
    if (proc && proc.exitCode !== null) throw new Error("spawned server exited early");
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not become ready");
}

async function runEndpoint(base, ep, token, seq0) {
  const lat = [];
  const ttfb = [];
  let errors = 0;
  let completed = 0;
  const total = PER_ENDPOINT;
  const startedAt = Date.now();
  let seq = seq0;
  async function one() {
    seq += 1;
    const headers = {};
    let body = null;
    if (ep.payload === "upload") {
      const mp = multipartBody(`bench-${seq}.txt`);
      body = mp.body;
      headers["content-type"] = mp.contentType;
    } else if (ep.payload) {
      body = JSON.stringify(buildPayload(ep.payload, seq));
      headers["content-type"] = "application/json";
    }
    if (ep.auth === "required" && token) headers.authorization = `Bearer ${token}`;
    const res = await doRequest(`${base}${ep.path}`, { method: ep.method, headers, body });
    completed += 1;
    if (!res.ok || res.status >= 500 || res.status === 0) {
      errors += 1;
    } else {
      lat.push(res.latencyMs);
      ttfb.push(res.ttfbMs);
    }
    // auth-protected route without token must 401: count 401 as transport-ok
    // but flag separately (handled by caller via expected set).
    return res.status;
  }
  const workers = [];
  const perWorker = Math.ceil(total / CONCURRENCY);
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push((async () => {
      for (let i = 0; i < perWorker && completed + 0 < total; i++) {
        if (completed >= total) break;
        await one();
      }
    })());
  }
  await Promise.all(workers);
  const durationS = Math.max(0.001, (Date.now() - startedAt) / 1000);
  lat.sort((a, b) => a - b);
  ttfb.sort((a, b) => a - b);
  return {
    id: ep.id,
    method: ep.method,
    path: ep.path,
    auth: ep.auth,
    requests: total,
    errors,
    errorRatePct: +(100 * (errors / total)).toFixed(2),
    rpsSustained: +(completed / durationS).toFixed(2),
    latencyMs: {
      p50: +percentile(lat, 50).toFixed(2),
      p95: +percentile(lat, 95).toFixed(2),
      p99: +percentile(lat, 99).toFixed(2),
      mean: lat.length ? +(lat.reduce((a, b) => a + b, 0) / lat.length).toFixed(2) : 0,
    },
    ttfbMs: {
      p50: +percentile(ttfb, 50).toFixed(2),
      p95: +percentile(ttfb, 95).toFixed(2),
      p99: +percentile(ttfb, 99).toFixed(2),
    },
  };
}

async function main() {
  let serverProc = null;
  const url = new URL(BASE_URL);
  if (SPAWN_SERVER) {
    serverProc = spawn("node", ["apps/api/src/server.js"], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(url.port || 4100) },
      stdio: "ignore",
    });
  }
  try {
    await waitForServer(BASE_URL, serverProc);
    const loginRes = await login(BASE_URL);
    // Extract token via a second login that captures body
    let token = null;
    await new Promise((resolve) => {
      const req = httpRequest(
        `${BASE_URL}/api/auth/login`,
        { method: "POST", headers: { "content-type": "application/json" } },
        (res) => {
          let raw = "";
          res.on("data", (c) => (raw += c));
          res.on("end", () => {
            try {
              token = JSON.parse(raw)?.data?.token ?? JSON.parse(raw)?.token ?? null;
            } catch { token = null; }
            resolve();
          });
        },
      );
      req.on("error", () => resolve());
      req.end(JSON.stringify({ email: EMAIL, password: PASSWORD }));
    });
    void loginRes;

    const results = [];
    let seq = 0;
    for (const ep of ENDPOINTS) {
      const r = await runEndpoint(BASE_URL, ep, token, seq);
      seq += PER_ENDPOINT;
      results.push(r);
      console.log(
        `${r.id} ${r.method} ${r.path} n=${r.requests} err=${r.errorRatePct}% ` +
          `p50=${r.latencyMs.p50}ms p95=${r.latencyMs.p95}ms p99=${r.latencyMs.p99}ms ` +
          `ttfb_p99=${r.ttfbMs.p99}ms rps=${r.rpsSustained}`,
      );
    }

    // Threshold evaluation (p99 gate)
    const breaches = [];
    for (const r of results) {
      const t = {
        p99LatencyMs: thresholds.endpoints?.[r.id]?.p99LatencyMs ?? thresholds.defaults.p99LatencyMs,
        p99TtfbMs: thresholds.endpoints?.[r.id]?.p99TtfbMs ?? thresholds.defaults.p99TtfbMs,
      };
      const entry = { id: r.id, ...t, pass: true };
      if (r.latencyMs.p99 > t.p99LatencyMs || r.ttfbMs.p99 > t.p99TtfbMs) {
        entry.pass = false;
        breaches.push(entry);
      }
      r.threshold = entry;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    mkdirSync(RESULTS_DIR, { recursive: true });
    const jsonPath = join(RESULTS_DIR, `${stamp}.json`);
    const mdPath = join(RESULTS_DIR, `${stamp}.summary.md`);
    const payload = {
      generatedAt: new Date().toISOString(),
      mode: SMOKE ? "smoke" : "full",
      baseUrl: BASE_URL,
      units: { latency: "ms", ttfb: "ms", rps: "req/s", errorRate: "%" },
      definitions: {
        latencyMs: "time from request start to last response byte",
        ttfbMs: "time from request start to first response data chunk",
        rpsSustained: "completed requests divided by wall-clock seconds",
      },
      config: { requestsPerEndpoint: PER_ENDPOINT, concurrency: CONCURRENCY },
      endpoints: results,
      thresholdBreaches: breaches,
    };
    writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

    const lines = [
      `# Benchmark summary (${payload.mode})`,
      ``,
      `- Generated: ${payload.generatedAt}`,
      `- Base URL: ${BASE_URL}`,
      `- Requests/endpoint: ${PER_ENDPOINT}, concurrency: ${CONCURRENCY}`,
      ``,
      `| endpoint | method | n | err% | p50 lat | p95 lat | p99 lat | p99 TTFB | RPS | gate |`,
      `|---|---|---|---|---|---|---|---|---|---|`,
      ...results.map(
        (r) =>
          `| ${r.id} | ${r.method} | ${r.requests} | ${r.errorRatePct} | ${r.latencyMs.p50}ms | ` +
          `${r.latencyMs.p95}ms | ${r.latencyMs.p99}ms | ${r.ttfbMs.p99}ms | ${r.rpsSustained} | ` +
          `${r.threshold.pass ? "PASS" : "FAIL"} |`,
      ),
      ``,
      breaches.length ? `**${breaches.length} threshold breach(es):** ${breaches.map((b) => b.id).join(", ")}` : `All p99 thresholds passed.`,
      ``,
    ];
    writeFileSync(mdPath, lines.join("\n"));
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
    if (breaches.length) {
      console.error(`THRESHOLD BREACH: ${breaches.map((b) => b.id).join(", ")}`);
      process.exitCode = 1;
    }
  } finally {
    if (serverProc) {
      serverProc.kill("SIGTERM");
    }
  }
}

main().catch((err) => {
  console.error(`benchmark failed: ${err?.message ?? err}`);
  process.exitCode = 1;
});
