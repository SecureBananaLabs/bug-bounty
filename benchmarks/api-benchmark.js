/**
 * API Benchmark Suite for FreelanceFlow Monorepo
 *
 * This script benchmarks all /api/ endpoints measuring:
 * - p50, p95, p99 latency (ms)
 * - Requests per second (RPS)
 * - Error rate (%)
 * - Time to first byte (TTFB)
 *
 * Usage:
 *   npm run benchmark
 *   npm run benchmark -- --target=http://localhost:3001
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Configuration
const TARGET_HOST = process.env.BENCHMARK_HOST || 'http://localhost:3001';
const RESULTS_DIR = path.join(__dirname, 'results');
const THRESHOLDS_FILE = path.join(__dirname, 'thresholds.json');

// API Endpoints to benchmark
const endpoints = [
  // Auth endpoints
  { path: '/api/auth/register', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'Test123!' }) },
  { path: '/api/auth/login', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'Test123!' }) },

  // Jobs endpoints
  { path: '/api/jobs', method: 'GET' },
  { path: '/api/jobs/1', method: 'GET' },
  { path: '/api/jobs', method: 'POST', body: JSON.stringify({ title: 'Test Job', description: 'Test' }) },

  // Users endpoints
  { path: '/api/users', method: 'GET' },
  { path: '/api/users/1', method: 'GET' },

  // Proposals endpoints
  { path: '/api/proposals', method: 'GET' },
  { path: '/api/proposals', method: 'POST', body: JSON.stringify({ jobId: 1, amount: 100 }) },

  // Health check
  { path: '/api/health', method: 'GET' },
];

// Default thresholds (p99 in ms)
const defaultThresholds = {
  p99: 500,  // p99 should be under 500ms
  errorRate: 1,  // Error rate under 1%
};

/**
 * Run benchmark for a single endpoint
 */
async function runBenchmark(endpoint) {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: `${TARGET_HOST}${endpoint.path}`,
      method: endpoint.method || 'GET',
      body: endpoint.body,
      headers: endpoint.body ? { 'Content-Type': 'application/json' } : {},
      connections: 10,
      duration: 10,  // 10 seconds per endpoint
      pipelining: 1,
    }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      // Calculate percentiles
      const latencies = result.latency || {};
      const p50 = latencies.p50 ? latencies.p50.toFixed(2) : 0;
      const p95 = latencies.p95 ? latencies.p95.toFixed(2) : 0;
      const p99 = latencies.p99 ? latencies.p99.toFixed(2) : 0;

      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        requests: result.requests ? result.requests.average.toFixed(2) : 0,
        reqPerSec: result.requests ? result.requests.average.toFixed(2) : 0,
        p50: p50,
        p95: p95,
        p99: p99,
        errorRate: result.errors ? ((result.errors.total / (result.requests.total + result.errors.total)) * 100).toFixed(2) : 0,
        ttfb: latencies.p50 ? latencies.p50.toFixed(2) : 0,  // Using p50 as TTFB proxy
      });
    });

    autocannon.track(instance, { outputStream: process.stdout });
  });
}

/**
 * Run full benchmark suite
 */
async function runBenchmarkSuite() {
  console.log('Starting API Benchmark Suite...\n');
  console.log(`Target: ${TARGET_HOST}`);
  console.log(`Endpoints to test: ${endpoints.length}\n`);

  const results = [];
  const startTime = Date.now();

  for (const endpoint of endpoints) {
    try {
      console.log(`Benchmarking ${endpoint.method} ${endpoint.path}...`);
      const result = await runBenchmark(endpoint);
      results.push(result);
      console.log(`  -> p99: ${result.p99}ms, RPS: ${result.reqPerSec}, Errors: ${result.errorRate}%\n`);
    } catch (err) {
      console.error(`  -> FAILED: ${err.message}\n`);
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        error: err.message,
      });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    target: TARGET_HOST,
    duration: duration,
    results,
    thresholds: defaultThresholds,
  };

  // Save JSON report
  ensureDir(RESULTS_DIR);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const jsonFile = path.join(RESULTS_DIR, `benchmark-${timestamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));

  // Generate markdown summary
  const mdSummary = generateMarkdownSummary(report);
  const mdFile = path.join(RESULTS_DIR, `benchmark-${timestamp}.md`);
  fs.writeFileSync(mdFile, mdSummary);

  console.log(`\nBenchmark completed in ${duration}s`);
  console.log(`JSON Report: ${jsonFile}`);
  console.log(`Markdown Summary: ${mdFile}`);

  return report;
}

/**
 * Generate markdown summary
 */
function generateMarkdownSummary(report) {
  let md = `# API Benchmark Report\n\n`;
  md += `**Timestamp:** ${report.timestamp}\n`;
  md += `**Target:** ${report.target}\n`;
  md += `**Duration:** ${report.duration}s\n\n`;

  md += `## Summary\n\n`;
  md += `| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate (%) |\n`;
  md += `|----------|--------|----------|----------|----------|-----|----------------|\n`;

  for (const result of report.results) {
    if (result.error) {
      md += `| ${result.endpoint} | ${result.method} | - | - | - | - | FAILED: ${result.error} |\n`;
    } else {
      md += `| ${result.endpoint} | ${result.method} | ${result.p50} | ${result.p95} | ${result.p99} | ${result.reqPerSec} | ${result.errorRate} |\n`;
    }
  }

  md += `\n## Thresholds\n\n`;
  md += `- p99 Latency: < ${report.thresholds.p99}ms\n`;
  md += `- Error Rate: < ${report.thresholds.errorRate}%\n\n`;

  md += `## Environment\n\n`;
  md += `| Component | Value |\n`;
  md += `|-----------|-------|\n`;
  md += `| CPU | ${process.arch} |\n`;
  md += `| Node.js | ${process.version} |\n`;
  md += `| Platform | ${process.platform} |\n`;

  return md;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Run if executed directly
if (require.main === module) {
  runBenchmarkSuite().catch(console.error);
}

module.exports = { runBenchmarkSuite, endpoints, defaultThresholds };
