import autocannon from 'autocannon';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Benchmark configuration
const BENCHMARK_DURATION = 10;
const BENCHMARK_CONNECTIONS = 10;
const BENCHMARK_AMOUNT = 1000;

// Read existing thresholds or use defaults
const thresholds = JSON.parse(
  readFileSync(join(__dirname, 'thresholds.json'), 'utf8')
);

// API endpoints to benchmark
const endpoints = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/users/profile',
  '/api/jobs',
  '/api/proposals',
  '/api/payments',
  '/api/reviews',
  '/api/messages',
  '/api/notifications',
  '/api/search',
  '/api/admin'
];

// Run benchmark for each endpoint
async function runBenchmark(url) {
  const result = await autocannon({
    url: url,
    connections: BENCHMARK_CONNECTIONS,
    duration: BENCHMARK_DURATION,
    amount: BENCHMARK_AMOUNT
  });
  return result;
}

// Main function to run all benchmarks
async function runAllBenchmarks() {
  const results = [];
  for (const endpoint of endpoints) {
    const result = await runBenchmark(endpoint);
    results.push(result);
  }
  return results;
}

// Function to check if result exceeds threshold
function exceedsThreshold(result, threshold) {
  return result.p99 > threshold.p99 ||
    result.requests.mean < threshold.requests.mean;
}

// Run benchmarks and compare with thresholds
async function run() {
  const results = await runAllBenchmarks();
  const report = {
    p50: results.map(r => r.latency.mean),
    p95: results.map(r => r.latency.max),
    p99: results.map(r => r.latency.p99),
    rps: results.map(r => r.requests.mean),
    errors: results.map(r => r.errors),
    ttfb: results.map(r => r.ttfb)
  };

  // Write results to file
  writeFileSync(
    join(__dirname, 'results', 'benchmark-results.json'),
    JSON.stringify(report, null, 2)
  );

  // Compare with thresholds
  const exceeded = results.some(result =>
    exceedsThreshold(result, thresholds)
  );
  if (exceeded) {
    console.log('Threshold exceeded');
  }
}

run().catch(console.error);