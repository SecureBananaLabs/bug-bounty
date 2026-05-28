import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Benchmark configuration
const BENCHMARK_CONFIG = {
  url: process.env.BENCHMARK_URL || 'http://localhost:3000',
  connections: 100,
  duration: 30,
  pipelining: 10
};

// API endpoints to benchmark
const ENDPOINTS = [
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
  '/api/admin'
];

// Benchmark results storage
let results = {
  timestamp: new Date().toISOString(),
  endpoints: {}
};

// Thresholds for regression testing
const THRESHOLDS = {
  p99: 1000 // milliseconds
};

// Load test token from environment variable or use default
const BENCHMARK_TOKEN = process.env.BENCHMARK_TOKEN || 'test-token';

// Load environment variables
const dotenv = await import('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env.benchmark') });

async function runBenchmark() {
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  for (const endpoint of ENDPOINTS) {
    const url = `${BENCHMARK_CONFIG.url}${endpoint}`;
    console.log(`Benchmarking: ${url}`);
    
    const result = await autocannon({
      url,
      connections: BENCHMARK_CONFIG.connections,
      duration: BENCHMARK_CONFIG.duration,
      pipelining: BENCHMARK_CONFIG.pipelening
    });
    
    const resultData = {
      p50: result.latency.average,
      p95: result.latency.p95,
      p99: result.latency.p99,
      rps: result.requests.average,
      errorRate: result.errors,
      ttfb: result.ttfb
    };
    
    results.endpoints[endpoint] = resultData;
  }
  
  // Write results to file
  const resultsPath = path.join(resultsDir, `${Date.now()}-benchmark-results.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(resultData, null, 2));
  
  // Check if results exceed thresholds
  for (const endpoint in results.endpoints) {
    const endpointResults = results.endpoints[endpoint];
    if (endpointResults.p99 > THRESHOLDS.p99) {
      console.log(`ALERT: ${endpoint} has p99 latency (${endpointResults.p99}ms) exceeding threshold of ${THRESHOLDS.p99}ms`);
    }
  }
  
  // Write markdown report
  let markdown = '# API Benchmark Results\n\n';
  markdown += '## Summary\n\n';
  markdown += '| Endpoint | p50 | p95 | p99 | RPS | Error Rate | TTFB |\n';
  markdown += '|--------|------|------|-----|-----|------------|------|\n';
  
  for (const endpoint of Object.keys(results.endpoints)) {
    const data = results.endpoints[endpoint];
    markdown += `| ${endpoint} | ${data.p50} | ${data.p95} | ${data.p99} | ${data.rps} | ${data.errorRate} | ${data.ttfb} |\n`;
  }
  
  fs.writeFileSync(path.join(resultsDir, 'report.md'), markdown);
  
  console.log('Benchmark completed. Results saved to /benchmarks/results/');
}

// Store system information
const benchmarkEnv = {
  hardware: {
    cpu: 'Intel i7-9750H',
    cores: 12,
    ram: '16GB',
    storage: 'SSD',
    network: 'loopback',
    machine: 'local workstation',
    os: 'Ubuntu 20.04'
  },
  runtime: {
    nodeVersion: '18.x',
    limits: 'none',
    otherProcesses: 'no'
  }
};

// Execute benchmark
runBenchmark();
console.log('Benchmark completed');