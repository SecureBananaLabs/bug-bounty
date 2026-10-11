const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.benchmark' });

const targetHost = process.env.BENCHMARK_TARGET || 'http://localhost:3000';
const authToken = process.env.BENCHMARK_AUTH_TOKEN || 'test-token-123';

const endpoints = [
  {
    name: 'Health Check',
    path: '/api/health',
    method: 'GET'
  },
  {
    name: 'Get Users',
    path: '/api/users',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  },
  {
    name: 'Create User',
    path: '/api/users',
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'Benchmark User', email: 'bench@example.com' })
  }
];

const results = [];

async function runBenchmark(endpoint) {
  console.log(`Benchmarking ${endpoint.name} (${endpoint.method} ${endpoint.path})...`);
  
  return new Promise((resolve, reject) => {
    autocannon({
      url: `${targetHost}${endpoint.path}`,
      connections: 10,
      pipelining: 1,
      duration: 5, // 5 seconds per endpoint for speed
      method: endpoint.method,
      headers: endpoint.headers || {},
      body: endpoint.body || undefined
    }, (err, result) => {
      if (err) {
        console.error(err);
        return reject(err);
      }
      
      const metrics = {
        endpoint: endpoint.name,
        path: endpoint.path,
        latency_p50: result.latency.p50,
        latency_p95: result.latency.p95,
        latency_p99: result.latency.p99,
        rps: result.requests.average,
        error_rate_pct: (result.non2xx + result.errors) / result.requests.total * 100,
        // autocannon doesn't do pure TTFB natively in the same way but latency is close
        // We'll record latency.min as an approximation for TTFB
        ttfb_approx: result.latency.min
      };
      
      results.push(metrics);
      resolve(metrics);
    });
  });
}

async function main() {
  for (const endpoint of endpoints) {
    await runBenchmark(endpoint);
  }
  
  // Write JSON
  fs.writeFileSync(
    path.join(__dirname, 'results', 'benchmark-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  // Write Markdown
  let md = '# API Benchmark Results\n\n';
  md += '| Endpoint | Path | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate (%) | Approx TTFB (ms) |\n';
  md += '|---|---|---|---|---|---|---|---|\n';
  
  for (const r of results) {
    md += `| ${r.endpoint} | ${r.path} | ${r.rps.toFixed(2)} | ${r.latency_p50} | ${r.latency_p95} | ${r.latency_p99} | ${r.error_rate_pct.toFixed(2)}% | ${r.ttfb_approx} |\n`;
  }
  
  fs.writeFileSync(path.join(__dirname, 'results', 'benchmark-summary.md'), md);
  console.log('Benchmarks completed. Results saved to /benchmarks/results/');
  
  // Check against thresholds
  const thresholds = require('./thresholds.json');
  let failed = false;
  
  for (const r of results) {
    if (r.latency_p99 > thresholds.p99_latency_ms) {
      console.error(`❌ ${r.endpoint} exceeded p99 latency threshold: ${r.latency_p99}ms > ${thresholds.p99_latency_ms}ms`);
      failed = true;
    }
    if (r.error_rate_pct > thresholds.max_error_rate_pct) {
      console.error(`❌ ${r.endpoint} exceeded error rate threshold: ${r.error_rate_pct}% > ${thresholds.max_error_rate_pct}%`);
      failed = true;
    }
  }
  
  if (failed && process.env.CI) {
    console.error('Benchmark regression detected in CI. Exiting with error.');
    process.exit(1);
  }
}

main().catch(console.error);
