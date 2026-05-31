import { loadBenchmarkEnv } from "./lib/env.mjs";
import { loadThresholds, runBenchmark } from "./lib/runner.mjs";

loadBenchmarkEnv();

const mode = process.argv.includes("--mode=smoke") ? "smoke" : "full";
const defaultRequests = mode === "smoke" ? 2 : 6;
const defaultConcurrency = mode === "smoke" ? 1 : 2;

const options = {
  mode,
  targetUrl: process.env.BENCHMARK_TARGET_URL || "",
  authToken: process.env.BENCHMARK_AUTH_TOKEN || "",
  requestsPerEndpoint: Number(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT || defaultRequests),
  concurrency: Number(process.env.BENCHMARK_CONCURRENCY || defaultConcurrency),
  timeoutMs: Number(process.env.BENCHMARK_TIMEOUT_MS || 5000),
  thresholds: mode === "smoke" ? loadThresholds() : null
};

try {
  const report = await runBenchmark(options);
  console.log(`Benchmarked ${report.endpoints.length} endpoints in ${mode} mode.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
