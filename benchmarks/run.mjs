import { readFile, mkdir, writeFile } from "node:fs/promises";
import { once } from "node:events";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import { randomBytes } from "node:crypto";
import { cases, key, payload } from "./cases.mjs";
import { measure, failures } from "./metrics.mjs";
const root = new URL("../", import.meta.url);
try { process.loadEnvFile(new URL(".env.benchmark", root)); } catch(e) { if (e.code !== "ENOENT") throw e; }
const smoke = process.argv.includes("--smoke");
const duration = Number(process.env.BENCHMARK_SECONDS ?? (smoke ? 1 : 2));
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 1 : 4));
if (!Number.isFinite(duration) || duration < 1 || duration > 60 || !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) throw new Error("seconds must be 1..60; concurrency must be integer 1..32");
let server, agent;
try {
  let target = process.env.BENCHMARK_URL;
  let token = process.env.BENCHMARK_TOKEN;
  if (!target) {
    process.env.JWT_SECRET = randomBytes(32).toString("hex");
    const { createApp } = await import("../apps/api/src/app.js");
    const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
    token = signAccessToken({ sub: "benchmark-admin", role: "admin" });
    server = createApp({ enableRateLimit: false }).listen(0, "127.0.0.1");
    await once(server, "listening"); target = `http://127.0.0.1:${server.address().port}`;
  } else {
    if (process.env.BENCHMARK_ALLOW_WRITES !== "yes") throw new Error("External targets require BENCHMARK_ALLOW_WRITES=yes; use only disposable authorized staging");
    if (!token) throw new Error("External targets require a dedicated BENCHMARK_TOKEN");
  }
  const base = new URL(target);
  if (!["http:","https:"].includes(base.protocol) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) throw new Error("BENCHMARK_URL must be an HTTP(S) origin without credentials");
  agent = new (base.protocol === "https:" ? https : http).Agent({ keepAlive: true, maxSockets: concurrency });
  const results = [];
  for (const c of cases) {
    const p = payload(c);
    const headers = { ...(p.type ? { "content-type": p.type, "content-length": p.data.length } : {}), ...(c.auth ? { authorization: `Bearer ${token}` } : {}) };
    const result = await measure(new URL(c.path, base), { method: c.method, headers, data: p.data, agent }, { duration, concurrency, expected: c.status });
    results.push({ endpoint: key(c), payloadBytes: p.data.length, ...result });
    console.log(`${key(c)} p99=${result.latencyMs.p99.toFixed(2)}ms errors=${result.errorRatePercent.toFixed(2)}%`);
  }
  const thresholds = JSON.parse(await readFile(new URL("thresholds.json", import.meta.url)));
  const failed = failures(results, thresholds);
  const report = { generatedAt: new Date().toISOString(), mode: smoke ? "smoke" : "baseline", target: server ? "isolated loopback Express app" : "authorized external staging (URL omitted)", duration, concurrency,
    environment: { node: process.version, platform: os.platform(), release: os.release(), arch: os.arch(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, availableCpus: os.availableParallelism(), totalMemory: os.totalmem(), freeMemory: os.freemem(), network: server ? "loopback" : "external", rateLimiter: server ? "disabled only for isolated app" : "unchanged" },
    limitations: "In-memory placeholder services, not database/Stripe production performance; no warmup, includes first request; fixed-duration closed-loop load; body fully consumed; TTFB measured at response headers; secret headers and response bodies never stored.", results, failed };
  const f = n => n === null ? "n/a" : n.toFixed(2);
  const markdown = `# API benchmark (${report.mode})\n\n${report.generatedAt} — ${duration}s per endpoint, concurrency ${concurrency}.\n\n${report.limitations}\n\n| Endpoint | n | p50 ms | p95 ms | p99 ms | sustained RPS | peak 1s RPS | errors % | TTFB p50 ms | TTFB p95 ms | TTFB p99 ms |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n` + results.map(r=>`| ${r.endpoint} | ${r.requests} | ${f(r.latencyMs.p50)} | ${f(r.latencyMs.p95)} | ${f(r.latencyMs.p99)} | ${f(r.sustainedRps)} | ${f(r.peakRps)} | ${f(r.errorRatePercent)} | ${f(r.ttfbMs.p50)} | ${f(r.ttfbMs.p95)} | ${f(r.ttfbMs.p99)} |`).join("\n") + `\n\nGate: ${failed.length ? "FAIL: " + failed.join(", ") : "PASS"}\n`;
  const out = new URL("results/", import.meta.url); await mkdir(out, { recursive: true });
  const name = smoke ? "smoke" : "baseline";
  await writeFile(new URL(`${name}.json`, out), JSON.stringify(report,null,2)+"\n");
  await writeFile(new URL(`${name}.md`, out), markdown);
  if (failed.length) process.exitCode = 1;
} finally {
  agent?.destroy();
  if (server) { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
}
