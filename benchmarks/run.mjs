import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, sep } from "node:path";
import { readConfig } from "./config.mjs";
import { scenarios } from "./scenarios.mjs";
import { startFixture } from "./lifecycle.mjs";
import { runLoad } from "./http.mjs";
import { summarize, evaluateThresholds } from "./metrics.mjs";

const directory = process.env.BENCH_RESULTS_DIR
  ? pathToFileURL(resolve(process.env.BENCH_RESULTS_DIR) + sep)
  : new URL("./results/", import.meta.url);
let thresholds;
let config;
const results = [];
let active;
let interrupted = false;
const interrupt = () => { interrupted = true; void active?.stop(); };
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);

async function atomicWrite(name, contents) {
  const destination = new URL(name, directory);
  const temp = new URL(`${name}.${process.pid}.tmp`, directory);
  await writeFile(temp, contents);
  await rename(temp, destination);
}

try {
  await mkdir(directory, { recursive: true });
  await atomicWrite("latest.json", JSON.stringify({ complete: false, passed: false, status: "running" }) + "\n");
  await atomicWrite("latest.md", "# API benchmark report\n\nRun in progress; no passing result yet.\n");
  config = readConfig();
  thresholds = JSON.parse(await readFile(process.env.BENCH_THRESHOLDS_PATH
    ?? new URL("./thresholds.json", import.meta.url), "utf8"));
  for (const scenario of scenarios) {
    if (interrupted) throw new Error("Benchmark interrupted; no complete report written");
    active = await startFixture(config);
    try {
      if (interrupted) throw new Error("Benchmark interrupted");
      const options = { ...config, token: active.token };
      if (config.warmup > 0) {
        const warm = await runLoad(active.url, scenario, { ...options, requests: config.warmup });
        if (warm.samples.some((s) => s.error || s.statusCode !== s.expectedStatus)) {
          throw new Error(`Warmup failed for ${scenario.id}; no complete report written`);
        }
      }
      const { samples, elapsedMs } = await runLoad(active.url, scenario, options);
      results.push({ id: scenario.id, method: scenario.method, path: scenario.path,
        requestBodyBytes: scenario.body === undefined ? 0 : Buffer.isBuffer(scenario.body)
          ? scenario.body.length : Buffer.byteLength(JSON.stringify(scenario.body)),
        seedRowsPerCollection: active.seedRows, elapsedMs, ...summarize(samples, elapsedMs) });
      const result = results.at(-1);
      console.log(`${scenario.id}: ${result.total} requests, ${result.errors} errors, p99=${result.latencyMs.p99?.toFixed(2) ?? "n/a"} ms`);
    } finally {
      await active.stop();
      active = undefined;
    }
  }
  if (interrupted) throw new Error("Benchmark interrupted; no complete report written");
  const violations = evaluateThresholds(results, thresholds);
  const report = {
    schemaVersion: 1, complete: true, generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, arch: process.arch,
      cpuModel: os.cpus()[0]?.model ?? "unknown", logicalCpus: os.cpus().length,
      totalMemoryBytes: os.totalmem(), freeMemoryBytesAfterRun: os.freemem(),
      network: "loopback", target: "real createApp; in-memory/placeholder services; fresh process per endpoint" },
    config, rateLimit: { windowMs: 900000, fixtureLimit: 100000, productionDefaultLimit: 200 },
    method: { latency: "request start to response end; successful complete HTTP responses only",
      ttfb: "request start to first socket data (including headers); successful responses only",
      throughput: "closed-loop, no pipelining; total completions including errors / elapsed wall time",
      peak: "highest 100ms completion bucket rate; final bucket uses its actual width",
      dataset: "20 synthetic rows per collection; warmup and writes remain bounded by configured request counts" },
    thresholds, results, passed: violations.length === 0, violations
  };
  const fmt = (n) => n === null ? "n/a" : n.toFixed(2);
  const markdown = ["# API benchmark report", "", `Generated: ${report.generatedAt}`, "",
    "Real API routes, isolated loopback fixture per endpoint, synthetic in-memory data. These results do not measure a database, Stripe, or production capacity.", "",
    `Node ${process.version}; ${process.platform}/${process.arch}; ${report.environment.cpuModel}; ${report.environment.logicalCpus} logical CPUs.`,
    `${config.requests} measured requests + ${config.warmup} warmup per endpoint; concurrency ${config.concurrency}; timeout ${config.timeoutMs} ms.`,
    "Fixture limiter: 100000 requests/15min; normal server default remains 200/15min. Warmup is excluded from metrics.", "",
    "| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p50/p95/p99 ms | RPS | Peak RPS (100ms) | Errors |",
    "| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |",
    ...results.map((r) => `| ${r.id} | ${fmt(r.latencyMs.p50)} | ${fmt(r.latencyMs.p95)} | ${fmt(r.latencyMs.p99)} | ${fmt(r.ttfbMs.p50)}/${fmt(r.ttfbMs.p95)}/${fmt(r.ttfbMs.p99)} | ${fmt(r.sustainedRps)} | ${fmt(r.peakRps)} | ${r.errors}/${r.total} (${fmt(r.errorRate * 100)}%) |`), "",
    "Latency/TTFB percentiles include only complete successful HTTP responses. HTTP mismatches (including 404/429), disconnects and timeouts are errors. RPS includes all completions; inspect the error column. Short peak buckets are noisy and are not a sustainable capacity claim.", "",
    violations.length ? `Gate: FAIL\n\n${violations.map((v) => `- ${v}`).join("\n")}` : "Gate: PASS", ""
  ].join("\n");
  await mkdir(directory, { recursive: true });
  await atomicWrite("latest.json", `${JSON.stringify(report, null, 2)}\n`);
  await atomicWrite("latest.md", markdown);
  console.log(`Report: ${fileURLToPath(new URL("latest.md", directory))}`);
  if (violations.length) { console.error(violations.join("\n")); process.exitCode = 1; }
} catch (error) {
  console.error(error.message);
  process.exitCode = interrupted ? 130 : 1;
  await atomicWrite("latest.json", JSON.stringify({ complete: false, passed: false,
    generatedAt: new Date().toISOString(), error: error.message, results }, null, 2) + "\n");
  await atomicWrite("latest.md", `# API benchmark report\n\nIncomplete run: ${error.message}\n`);
} finally {
  await active?.stop();
  process.removeListener("SIGINT", interrupt);
  process.removeListener("SIGTERM", interrupt);
}
