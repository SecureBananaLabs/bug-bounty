#!/usr/bin/env node
/**
 * FreelanceFlow API Benchmark Suite
 * Measures: p50, p95, p99 latency, RPS, error rate, TTFB
 *
 * Run: node benchmarks/run.js
 */

import autocannon from 'autocannon';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, 'results');

// Ensure results directory exists
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

// API Base URL - can be overridden via environment
const API_BASE = process.env.API_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.BENCHMARK_TOKEN || '';

// Endpoints to benchmark (all /api/* routes)
const ENDPOINTS = [
  { path: '/auth/register', method: 'POST', body: { email: 'bench@test.com', password: 'Test123!', name: 'Benchmark' } },
  { path: '/auth/login', method: 'POST', body: { email: 'bench@test.com', password: 'Test123!' } },
  { path: '/jobs', method: 'GET' },
  { path: '/jobs', method: 'POST', body: { title: 'Test Job', budget: 5000 } },
  { path: '/users', method: 'GET' },
  { path: '/users', method: 'GET', pathSuffix: '/1' },
  { path: '/proposals', method: 'GET' },
  { path: '/proposals', method: 'POST', body: { jobId: 1, freelancerId: 1, amount: 500 } },
  { path: '/reviews', method: 'GET' },
  { path: '/search', method: 'GET', query: { q: 'developer' } },
  { path: '/notifications', method: 'GET' },
  { path: '/messages', method: 'GET' },
];

// Benchmark settings
const BENCHMARK_OPTIONS = {
  connections: 10,
  duration: 10,
  pipelining: 1,
  workers: 2,
};

// Load thresholds
let thresholds = { p50: 100, p95: 500, p99: 1000, errorRate: 1, rps: 100 };
try {
  const thresholdFile = join(__dirname, 'thresholds.json');
  if (existsSync(thresholdFile)) {
    thresholds = JSON.parse(readFileSync(thresholdFile, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load thresholds, using defaults');
}

/**
 * Run benchmark for a single endpoint
 */
async function benchmarkEndpoint(endpoint) {
  const url = `${API_BASE}${endpoint.path}${endpoint.pathSuffix || ''}${endpoint.query ? '?' + new URLSearchParams(endpoint.query).toString() : ''}`;

  const options = {
    url,
    method: endpoint.method || 'GET',
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {}),
    },
    ...BENCHMARK_OPTIONS,
  };

  try {
    const result = await autocannon(options);
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      ...extractMetrics(result),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Extract key metrics from autocannon result
 */
function extractMetrics(result) {
  const latencies = result.latency;

  // Calculate percentiles from histogram
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

  return {
    latency: {
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      mean: Math.round(result.latency.mean || 0),
      min: Math.round(result.latency.min || 0),
      max: Math.round(result.latency.max || 0),
    },
    rps: Math.round(result.requests.average || 0),
    throughput: {
      bytes: result.throughput.average || 0,
      mean: Math.round(result.throughput.mean || 0),
    },
    errors: result.errors || 0,
    timeouts: result.timeouts || 0,
    errorRate: result.errors ? ((result.errors / result.requests.total) * 100).toFixed(2) : 0,
    ttfb: {
      mean: Math.round(result.ttfb.mean || 0),
      min: Math.round(result.ttfb.min || 0),
      max: Math.round(result.ttfb.max || 0),
    },
    requests: {
      total: result.requests.total || 0,
      succeeded: (result.requests.total || 0) - (result.errors || 0) - (result.timeouts || 0),
      failed: result.errors || 0,
    },
    duration: result.duration,
    connections: result.connections,
  };
}

/**
 * Check if results pass thresholds
 */
function checkThresholds(result) {
  const violations = [];

  if (result.latency.p99 > thresholds.p99) {
    violations.push(`p99 latency (${result.latency.p99}ms) exceeds threshold (${thresholds.p99}ms)`);
  }
  if (result.latency.p95 > thresholds.p95) {
    violations.push(`p95 latency (${result.latency.p95}ms) exceeds threshold (${thresholds.p95}ms)`);
  }
  if (parseFloat(result.errorRate) > thresholds.errorRate) {
    violations.push(`Error rate (${result.errorRate}%) exceeds threshold (${thresholds.errorRate}%)`);
  }
  if (result.rps < thresholds.rps) {
    violations.push(`RPS (${result.rps}) below threshold (${thresholds.rps})`);
  }

  return violations;
}

/**
 * Generate markdown summary
 */
function generateMarkdown(results) {
  const timestamp = new Date().toISOString();
  const passCount = results.filter(r => !r.error && checkThresholds(r).length === 0).length;
  const failCount = results.length - passCount;

  let md = '# FreelanceFlow API Benchmark Results\n\n';
  md += `**Generated:** ${timestamp}\n\n`;
  md += `**Summary:** ${passCount}/${results.length} endpoints passed thresholds\n\n`;
  md += '**Thresholds:**\n';
  md += `- p99 Latency: ${thresholds.p99}ms\n`;
  md += `- p95 Latency: ${thresholds.p95}ms\n`;
  md += `- Error Rate: ${thresholds.errorRate}%\n`;
  md += `- Min RPS: ${thresholds.rps}\n\n`;

  md += '## Detailed Results\n\n';
  md += '| Endpoint | Method | p50 | p95 | p99 | RPS | Error Rate | Status |\n';
  md += '|----------|--------|-----|-----|-----|-----|-------------|--------|\n';

  for (const result of results) {
    if (result.error) {
      md += `| ${result.endpoint} | ${result.method} | ERROR | ${result.error} | - | - | - |\n`;
    } else {
      const violations = checkThresholds(result);
      const status = violations.length === 0 ? 'PASS' : 'FAIL';
      md += `| ${result.endpoint} | ${result.method} | ${result.latency.p50}ms | ${result.latency.p95}ms | ${result.latency.p99}ms | ${result.rps} | ${result.errorRate}% | ${status} |\n`;
    }
  }

  md += '\n## Failed Thresholds\n\n';
  for (const result of results) {
    if (!result.error) {
      const violations = checkThresholds(result);
      if (violations.length > 0) {
        md += `### ${result.endpoint} (${result.method})\n`;
        for (const v of violations) {
          md += `- ${v}\n`;
        }
        md += '\n';
      }
    }
  }

  return md;
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting FreelanceFlow API Benchmark Suite\n');
  console.log(`Target: ${API_BASE}`);
  console.log(`Duration: ${BENCHMARK_OPTIONS.duration}s per endpoint`);
  console.log(`Connections: ${BENCHMARK_OPTIONS.connections}\n`);

  const results = [];

  for (const endpoint of ENDPOINTS) {
    console.log(`Benchmarking ${endpoint.method} ${endpoint.path}...`);
    const result = await benchmarkEndpoint(endpoint);
    results.push(result);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else {
      console.log(`   p99: ${result.latency.p99}ms, RPS: ${result.rps}, Errors: ${result.errorRate}%`);
    }
  }

  console.log('\nSaving results...');

  // Save JSON results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonFile = join(RESULTS_DIR, `benchmark-${timestamp}.json`);
  writeFileSync(jsonFile, JSON.stringify({
    timestamp,
    apiBase: API_BASE,
    thresholds,
    results,
  }, null, 2));
  console.log(`   JSON: ${jsonFile}`);

  // Save markdown summary
  const mdFile = join(RESULTS_DIR, 'summary.md');
  writeFileSync(mdFile, generateMarkdown(results));
  console.log(`   Markdown: ${mdFile}`);

  // Save individual endpoint results
  for (const result of results) {
    const safeName = result.endpoint.replace(/\//g, '-').replace(/^-/, '');
    const endpointFile = join(RESULTS_DIR, `${safeName}-${result.method.toLowerCase()}-${timestamp}.json`);
    writeFileSync(endpointFile, JSON.stringify(result, null, 2));
  }

  // Check CI threshold
  const allPassed = results
    .filter(r => !r.error)
    .every(r => checkThresholds(r).length === 0);

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('All endpoints passed threshold checks');
    process.exit(0);
  } else {
    console.log('Some endpoints failed threshold checks');
    process.exit(1);
  }
}

main().catch(console.error);