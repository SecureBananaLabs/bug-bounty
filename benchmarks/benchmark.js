import autocannon from 'autocannon';
import { fileURLToHttpPath } from 'ufo';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const envPath = fileURLToHttpPath(import.meta.url);
const envDir = join(envPath, '../');
const resultsDir = join(envDir, 'benchmarks', 'results');
const thresholdsPath = join(envDir, 'benchmarks', 'thresholds.json');

// Load existing thresholds
let thresholds = {};
try {
  const fs = await import('fs');
  const thresholdsModule = await import(thresholdsPath);
  thresholds = thresholdsModule.default;
} catch (err) {
  console.warn('Could not load thresholds', err);
}

const benchmarkConfig = {
  url: process.env.BENCHMARK_URL || 'http://localhost:3000',
  headers: {
    'Authorization': process.env.BENCHMARK_AUTH_TOKEN || 'Bearer bench-token',
  },
  // List of endpoints to benchmark
  endpoints: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/users',
    '/api/users/profile',
    '/api/jobs',
    '/api/jobs/search',
    '/api/proposals',
    '/api/payments',
    '/api/reviews',
    '/api/messages',
    '/api/notifications',
    '/api/uploads',
    '/api/search',
    '/api/admin'
  ],
  // Benchmark configuration
  amount: 100,
  concurrency: 5,
  duration: '10s',
  pipelining: 1,
  timeout: 10,
  // Thresholds for CI check
  thresholds: thresholds
};

// Create results directory if not exists
mkdirSync(resultsDir, { recursive: true });

// Function to run benchmark for a single endpoint
async function benchmarkEndpoint(url) {
  const result = await autocannon({
    url: `${benchmarkConfig.url}${url}`,
    method: 'GET',
    headers: benchmarkConfig.headers,
    connections: benchmarkConfig.concurrency,
    pipelining: benchmarkConfig.pipelining,
    duration: benchmarkConfig.timeout,
    timeout: benchmarkConfig.timeout
  });

  return result;
}

// Function to run all benchmarks
async function runAllBenchmarks() {
  const results = [];
  for (const endpoint of benchmarkConfig.endpoints) {
    const result = await benchmarkEndpoint(endpoint);
    results.push({
      endpoint,
      p50: result.latency.average,
      p95: result.latency.p95,
      p99: result.latency['99'],
      rps: result.requests.average,
      error: result.errors,
      ttfb: result.latency.total
    });
  }
  return results;
}

// Write results to file
function writeResults(results) {
  const date = new Date().toISOString().slice(0, 19);
  const resultFile = join(resultsDir, `result-${date}.json`);
  writeFileSync(resultFile, JSON.stringify(results, null, 2));
  console.log(`Results written to ${resultFile}`);
}

// Main function to run benchmarks and process results
async function runBenchmarks() {
  const results = await runAllBenchmarks();
  writeResults(results);
  return results;
}

runBenchmarks().catch(console.error);

export { runAllBenchmarks, benchmarkEndpoint, writeResults };