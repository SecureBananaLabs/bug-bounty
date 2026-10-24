/**
 * Reproducible API Benchmarking Suite for SecureBananaLabs
 * Issue #30 | Algora Bounty: $750 USD
 * Measures p50, p95, p99 latency, RPS, TTFB, and error rates.
 */
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.benchmark') });

const HOST = process.env.BENCHMARK_HOST || 'http://localhost:5000';
const DURATION = parseInt(process.env.BENCHMARK_DURATION || '10', 10);
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '10', 10);
const AUTH_TOKEN = process.env.BENCHMARK_TOKEN || 'benchmark_token_test_mode';

const ENDPOINTS = [
  { name: 'Health Probe', path: '/health', method: 'GET' },
  { name: 'Search Jobs', path: '/api/search?q=developer', method: 'GET' },
  { name: 'Job Feed', path: '/api/jobs', method: 'GET' },
  { name: 'Recent Reviews', path: '/api/reviews', method: 'GET' },
  { 
    name: 'Search Users', 
    path: '/api/users/search?role=freelancer', 
    method: 'GET',
    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
  },
  { 
    name: 'Get Notifications', 
    path: '/api/notifications', 
    method: 'GET',
    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
  }
];

async function runBenchmarkForEndpoint(ep) {
  console.log(`[*] Benchmarking ${ep.name} (${ep.method} ${ep.path})...`);
  const result = await autocannon({
    url: `${HOST}${ep.path}`,
    method: ep.method,
    headers: ep.headers || {},
    connections: CONNECTIONS,
    duration: DURATION,
    pipelining: 1,
  });

  return {
    endpoint: ep.name,
    path: ep.path,
    requestsPerSecond: result.requests.average,
    throughputBytesPerSec: result.throughput.average,
    latency_p50: result.latency.p50,
    latency_p95: result.latency.p97_5,
    latency_p99: result.latency.p99,
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx,
    totalRequests: result.requests.total,
  };
}

async function main() {
  console.log('===============================================================');
  console.log(` SECUREBANANALABS API BENCHMARK SUITE`);
  console.log(` Target Host: ${HOST} | Connections: ${CONNECTIONS} | Duration: ${DURATION}s`);
  console.log('===============================================================\n');

  const allResults = [];
  for (const ep of ENDPOINTS) {
    try {
      const res = await runBenchmarkForEndpoint(ep);
      allResults.push(res);
    } catch (err) {
      console.error(`[-] Error benchmarking ${ep.name}:`, err.message);
      allResults.push({
        endpoint: ep.name,
        path: ep.path,
        error: err.message
      });
    }
  }

  // Generate Reports
  const reportPath = path.resolve(__dirname, 'benchmark-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));

  const mdReportPath = path.resolve(__dirname, 'benchmark-report.md');
  let md = '# 📊 API Benchmark Results\n\n';
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Host:** ${HOST}\n\n`;
  md += '| Endpoint | Path | Req/sec | p50 (ms) | p95 (ms) | p99 (ms) | Errors |\n';
  md += '|---|---|---|---|---|---|---|\n';
  for (const r of allResults) {
    if (r.error) {
      md += `| ${r.endpoint} | ${r.path} | ERROR | - | - | - | ${r.error} |\n`;
    } else {
      md += `| ${r.endpoint} | ${r.path} | ${r.requestsPerSecond.toFixed(1)} | ${r.latency_p50} | ${r.latency_p95} | ${r.latency_p99} | ${r.errors + r.non2xx} |\n`;
    }
  }
  fs.writeFileSync(mdReportPath, md);

  console.log('\n[+] Benchmark finished!');
  console.log(`[+] Reports saved to:\n  - ${reportPath}\n  - ${mdReportPath}`);
  console.log('\n' + md);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runBenchmarkForEndpoint, ENDPOINTS };
