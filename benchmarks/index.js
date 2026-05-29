import autocannon from 'autocannon';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration from .env.benchmark
let config;
try {
  const configFile = readFileSync(join(__dirname, '../.env.benchmark'), 'utf-8');
  config = JSON.parse(configFile);
} catch (err) {
  console.error('Error loading .env.benchmark:', err);
  process.exit(1);
}

const {
  target,
  connections,
  duration,
  pipelining,
  timeout
} = config;

// List of all API endpoints to benchmark
const endpoints = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/users',
  '/api/jobs',
  '/api/proposals',
  '/api/payments',
  '/api/reviews',
  '/api/messages',
  '/api/notifications',
  '/api/search',
  '/api/admin',
  '/health'
];

// Function to run the benchmark for a single endpoint
async function benchmarkEndpoint(url) {
  const result = await autocannon({
    url: `${target}${url}`,
    connections: connections || 10,
    duration: duration || 10,
    pipelining: pipelining || 10,
    timeout: timeout || 10,
  });

  return result;
}

// Function to run benchmarks for all endpoints
export async function runBenchmarks() {
  console.log('Starting benchmark suite...\n');
  
  const results = {};
  const errors = {};

  for (const endpoint of endpoints) {
    console.log(`Benchmarking ${endpoint}...`);
    try {
      const result = await benchmarkEndpoint(endpoint);
      results[endpoint] = {
        p50: result.latency.mean,
        p95: result.percentiles[95],
        p99: result.percentiles[99],
        rps: result.requests.average,
        errorRate: result.errors,
        ttfb: result.timings.ttfb
      };
      console.log(`Results for ${endpoint}:`, results[endpoint]);
    } catch (err) {
      console.error(`Error benchmarking ${endpoint}:`, err);
      errors[endpoint] = err.message;
    }
  }

  // Save results
  const output = { results, errors };
  const outputPath = join(__dirname, 'results', 'benchmark_results.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log('Benchmark results saved.');
}

runBenchmarks();