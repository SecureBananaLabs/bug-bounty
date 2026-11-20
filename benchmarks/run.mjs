import { mkdir, readFile, writeFile } from "node:fs/promises";
import { once } from "node:events";
import { cpus, totalmem, freemem, platform, release } from "node:os";
import { randomBytes } from "node:crypto";
import { endpoints } from "./endpoints.mjs";
import { assertRouteCoverage } from "./coverage.mjs";
import { measureEndpoint, regressionFailures } from "./measure.mjs";
import { readConfig } from "./config.mjs";

const smoke = process.argv.includes("--smoke");
const outputDir = new URL("results/", import.meta.url);
let server;
try {
  const config = readConfig(process.env, smoke);
  const routeCount = await assertRouteCoverage();
  const thresholds = JSON.parse(await readFile(new URL("thresholds.json", import.meta.url), "utf8"));
  const missing = endpoints.filter((e) => !thresholds[`${e.method} ${e.route}`]);
  if (missing.length) throw new Error("Every benchmark endpoint requires a threshold");
  const readLimit = async (path) => {
    try { return (await readFile(path, "utf8")).trim(); } catch { return "unavailable"; }
  };
  const runtime = {
    node: process.version, os: `${platform()} ${release()}`,
    cpu: cpus()[0]?.model, logicalCpus: cpus().length,
    hostMemoryBytes: totalmem(), hostFreeMemoryAtStartBytes: freemem(),
    cgroupMemoryMaxBytes: await readLimit("/sys/fs/cgroup/memory.max"),
    cgroupCpuMax: await readLimit("/sys/fs/cgroup/cpu.max")
  };
  const local = !config.target;
  if (local) {
    // This process starts an isolated local API. Never reuse a configured real
    // signing key, database URL or payment key for synthetic benchmark traffic.
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = randomBytes(32).toString("hex");
    process.env.DATABASE_URL = "";
    process.env.STRIPE_SECRET_KEY = "";
    const { createApp } = await import("../apps/api/src/app.js");
    const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
    const app = createApp({ rateLimiter: (_req, _res, next) => next() });
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    config.target = new URL(`http://127.0.0.1:${server.address().port}`);
    config.token = signAccessToken({ sub: "usr_benchmark", role: "admin" });
  }
  const results = [];
  console.log(`Benchmarking ${routeCount} API endpoints; ${config.requests} requests each; concurrency ${config.concurrency}; ${local ? "isolated local API" : "configured target"}`);
  for (const endpoint of endpoints) {
    const result = await measureEndpoint(config.target, endpoint, config);
    results.push(result);
    console.log(`${result.endpoint}: p99=${result.latencyMs.p99.toFixed(2)}ms, errors=${result.errors}/${result.requests}`);
  }
  const failures = regressionFailures(results, thresholds);
  const report = {
    generatedAt: new Date().toISOString(), mode: smoke ? "smoke" : "full",
    target: local ? "isolated-loopback-api" : config.target.origin,
    runtime,
    load: { requestsPerEndpoint: config.requests, concurrency: config.concurrency, warmupRequestsPerEndpoint: 2, timeoutMs: config.timeoutMs },
    limitations: "The current API uses in-memory collections and service placeholders. Local runs bypass only the rate limiter; production rate limiting is unchanged. These measurements are not production database or payment-service benchmarks. Host CPU/memory values can exceed container limits; record limits alongside results.",
    results, failures
  };
  const n = (value) => value === null ? "n/a" : value.toFixed(2);
  const markdown = [
    "# API benchmark results", "", `Generated: ${report.generatedAt}`, "",
    `Mode: ${report.mode}; ${config.requests} measured requests per endpoint, concurrency ${config.concurrency}, two warmup requests excluded.`, "",
    `Runtime: ${runtime.node}; ${runtime.os}; ${runtime.cpu}; ${runtime.logicalCpus} host logical CPU(s). Host memory: ${runtime.hostMemoryBytes} bytes total, ${runtime.hostFreeMemoryAtStartBytes} bytes free at start. Cgroup memory.max: ${runtime.cgroupMemoryMaxBytes}; cpu.max: ${runtime.cgroupCpuMax}.`, "",
    report.limitations, "",
    "| Endpoint | p50 ms | p95 ms | p99 ms | sustained RPS | peak RPS | errors % | TTFB p50/p95/p99 ms |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...results.map((r) => `| ${r.endpoint} | ${n(r.latencyMs.p50)} | ${n(r.latencyMs.p95)} | ${n(r.latencyMs.p99)} | ${n(r.sustainedRps)} | ${n(r.peakRps)} | ${n(r.errorRatePercent)} | ${n(r.ttfbMs.p50)} / ${n(r.ttfbMs.p95)} / ${n(r.ttfbMs.p99)} |`),
    "", `Regression gate: **${failures.length ? "FAIL" : "PASS"}**`, ...failures.map((f) => `- ${f}`), ""
  ].join("\n");
  await mkdir(outputDir, { recursive: true });
  await writeFile(new URL(`${report.mode}.json`, outputDir), JSON.stringify(report, null, 2) + "\n");
  await writeFile(new URL(`${report.mode}.md`, outputDir), markdown);
  console.log(`Regression gate: ${failures.length ? "FAIL" : "PASS"}. Results: benchmarks/results/${report.mode}.{json,md}`);
  if (failures.length) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
}
