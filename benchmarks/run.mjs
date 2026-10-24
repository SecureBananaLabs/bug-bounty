import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import autocannon from "autocannon";
import {
  discoverRoutes,
  endpointConfiguration,
  evaluateThresholds,
  loadEnvironment,
  measureTtfb,
  normaliseResult,
  persistReport,
  readJson,
  validateTarget
} from "./lib.mjs";

const root = process.cwd();
const smoke = process.argv.includes("--smoke");

await loadEnvironment(path.join(root, ".env.benchmark"));

const target = validateTarget(
  process.env.BENCHMARK_TARGET_URL ?? "http://127.0.0.1:3001",
  process.env.BENCHMARK_ALLOW_REMOTE === "true"
);
const manifest = await readJson(path.join(root, "benchmarks", "endpoints.json"));
const thresholds = await readJson(path.join(root, "benchmarks", "thresholds.json"));
const appSource = await readFile(path.join(root, "apps", "api", "src", "app.js"), "utf8");
const routeDirectory = path.join(root, "apps", "api", "src", "routes");
const routeFiles = (await readdir(routeDirectory)).filter((file) => file.endsWith("Routes.js"));
const routeSources = Object.fromEntries(
  await Promise.all(routeFiles.map(async (file) => [file.replace(/\.js$/, ""), await readFile(path.join(routeDirectory, file), "utf8")]))
);

const endpoints = discoverRoutes(appSource, routeSources);
if (!endpoints.length) throw new Error("No /api routes were discovered. Refusing to publish an empty benchmark.");

const configuration = {
  connections: Number(process.env.BENCHMARK_CONNECTIONS ?? (smoke ? 2 : 20)),
  duration: Number(process.env.BENCHMARK_DURATION_SECONDS ?? (smoke ? 3 : 15)),
  pipelining: Number(process.env.BENCHMARK_PIPELINING ?? 1),
  ttfbSamples: Number(process.env.BENCHMARK_TTFB_SAMPLES ?? (smoke ? 2 : 10))
};

for (const [key, value] of Object.entries(configuration)) {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${key} must be a positive integer.`);
}

const results = [];
for (const endpoint of endpoints) {
  const configured = endpointConfiguration(endpoint, manifest, process.env.BENCHMARK_TOKEN);
  if (configured.skipped) {
    results.push(configured);
    continue;
  }

  process.stdout.write(`Benchmarking ${configured.id}\n`);
  const ttfb = await measureTtfb(target, configured, configuration.ttfbSamples);
  const result = await autocannon({
    url: `${target}${configured.urlSuffix}`,
    method: configured.method,
    headers: configured.headers,
    body: configured.body,
    connections: configuration.connections,
    duration: configuration.duration,
    pipelining: configuration.pipelining
  });
  results.push(normaliseResult(configured, result, ttfb));
}

const report = {
  generatedAt: new Date().toISOString(),
  target,
  profile: smoke ? "smoke" : "full",
  nodeVersion: process.version,
  configuration,
  results,
  failures: evaluateThresholds(results, thresholds, smoke)
};

const output = await persistReport(path.join(root, "benchmarks", "results"), report);
console.log(`JSON report: ${output.jsonPath}`);
console.log(`Markdown report: ${output.markdownPath}`);

if (report.failures.length) {
  console.error(report.failures.join("\n"));
  process.exitCode = 1;
}
