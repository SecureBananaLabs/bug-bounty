#!/usr/bin/env node
/**
 * API Benchmark Suite for FreelanceFlow
 * Measures p50, p95, p99 latency, RPS, error rate, and TTFB for all /api/ endpoints.
 */
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const THRESHOLDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'thresholds.json'), 'utf8'));

const TARGET = process.env.BENCHMARK_HOST || 'http://localhost:3001';
const TOKEN = process.env.BENCHMARK_TOKEN || '';

const HEADERS_PUBLIC = { 'content-type': 'application/json' };
const HEADERS_AUTH = {
  'content-type': 'application/json',
  ...(TOKEN ? { 'authorization': `Bearer ${TOKEN}` } : {}),
};

// Endpoint definitions with payload templates
const ENDPOINTS = [
  {
    name: 'health',
    path: '/health',
    method: 'GET',
    headers: HEADERS_PUBLIC,
    threshold: THRESHOLDS.health,
  },
  {
    name: 'auth-register',
    path: '/api/auth/register',
    method: 'POST',
    headers: HEADERS_PUBLIC,
    body: JSON.stringify({ email: `bench${Date.now()}@test.com`, password: 'Password123!' }),
    threshold: THRESHOLDS['auth-register'],
  },
  {
    name: 'auth-login',
    path: '/api/auth/login',
    method: 'POST',
    headers: HEADERS_PUBLIC,
    body: JSON.stringify({ email: 'bench@test.com', password: 'Password123!' }),
    threshold: THRESHOLDS['auth-login'],
  },
  {
    name: 'users-list',
    path: '/api/users',
    method: 'GET',
    headers: HEADERS_AUTH,
    threshold: THRESHOLDS['users-list'],
  },
  {
    name: 'jobs-list',
    path: '/api/jobs',
    method: 'GET',
    headers: HEADERS_AUTH,
    threshold: THRESHOLDS['jobs-list'],
  },
  {
    name: 'jobs-create',
    path: '/api/jobs',
    method: 'POST',
    headers: HEADERS_AUTH,
    body: JSON.stringify({
      title: `Bench Job ${Date.now()}`,
      description: 'A benchmark test job description that is long enough to simulate realistic payload size.',
      budget: 1000,
      category: 'development',
      skills: ['javascript', 'typescript', 'node'],
    }),
    threshold: THRESHOLDS['jobs-create'],
  },
  {
    name: 'proposals-list',
    path: '/api/proposals',
    method: 'GET',
    headers: HEADERS_AUTH,
    threshold: THRESHOLDS['proposals-list'],
  },
  {
    name: 'reviews-list',
    path: '/api/reviews',
    method: 'GET',
    headers: HEADERS_AUTH,
    threshold: THRESHOLDS['reviews-list'],
  },
  {
    name: 'messages-list',
    path: '/api/messages',
    method: 'GET',
    headers: HEADERS_AUTH,
    threshold: THRESHOLDS['messages-list'],
  },
  {
    name: 'notifications-list',
    path: '/api/notifications',
    method: 'GET',
    headers: HEADERS_AUTH,
    threshold: THRESHOLDS['notifications-list'],
  },
  {
    name: 'search',
    path: '/api/search?q=javascript',
    method: 'GET',
    headers: HEADERS_AUTH,
    threshold: THRESHOLDS.search,
  },
  {
    name: 'admin-metrics',
    path: '/api/admin/metrics',
    method: 'GET',
    headers: HEADERS_AUTH,
    threshold: THRESHOLDS['admin-metrics'],
  },
];

async function runBenchmark(endpoint) {
  const opts = {
    url: `${TARGET}${endpoint.path}`,
    method: endpoint.method,
    headers: endpoint.headers,
    duration: 10,
    connections: 10,
    pipelining: 1,
  };
  if (endpoint.body) {
    opts.body = endpoint.body;
  }

  const result = await autocannon(opts);

  const metrics = {
    endpoint: endpoint.name,
    path: endpoint.path,
    method: endpoint.method,
    latency: {
      p50: result.latency.p50,
      p95: result.latency.p95,
      p99: result.latency.p99,
      avg: result.latency.average,
      min: result.latency.min,
      max: result.latency.max,
    },
    throughput: {
      rps: result.requests.average,
      total: result.requests.total,
    },
    errors: {
      count: result.errors,
      rate: result.requests.total > 0 ? (result.errors / result.requests.total) * 100 : 0,
    },
    ttfb: {
      avg: result.latency.average,
    },
    statusCodes: result.statusCodeStats || {},
    passed: true,
  };

  // Threshold checks
  const thresh = endpoint.threshold || {};
  const failures = [];

  if (thresh.maxP99 && metrics.latency.p99 > thresh.maxP99) {
    failures.push(`p99 ${metrics.latency.p99}ms > threshold ${thresh.maxP99}ms`);
  }
  if (thresh.maxP95 && metrics.latency.p95 > thresh.maxP95) {
    failures.push(`p95 ${metrics.latency.p95}ms > threshold ${thresh.maxP95}ms`);
  }
  if (thresh.maxErrorRate && metrics.errors.rate > thresh.maxErrorRate) {
    failures.push(`error rate ${metrics.errors.rate.toFixed(2)}% > threshold ${thresh.maxErrorRate}%`);
  }
  if (thresh.minRps && metrics.throughput.rps < thresh.minRps) {
    failures.push(`RPS ${metrics.throughput.rps} < threshold ${thresh.minRps}`);
  }

  if (failures.length > 0) {
    metrics.passed = false;
    metrics.failures = failures;
  }

  return metrics;
}

async function main() {
  const timestamp = new Date().toISOString();
  const results = {
    timestamp,
    target: TARGET,
    summary: {
      totalEndpoints: ENDPOINTS.length,
      passed: 0,
      failed: 0,
    },
    endpoints: [],
  };

  for (const ep of ENDPOINTS) {
    try {
      const metrics = await runBenchmark(ep);
      results.endpoints.push(metrics);
      if (metrics.passed) {
        results.summary.passed++;
      } else {
        results.summary.failed++;
      }
      console.log(`✅ ${ep.name}: p50=${metrics.latency.p50}ms p95=${metrics.latency.p95}ms p99=${metrics.latency.p99}ms rps=${metrics.throughput.rps} errors=${metrics.errors.count}`);
    } catch (err) {
      console.error(`❌ ${ep.name}: ${err.message}`);
      results.endpoints.push({
        endpoint: ep.name,
        path: ep.path,
        error: err.message,
        passed: false,
      });
      results.summary.failed++;
    }
  }

  // Write JSON result
  const jsonPath = path.join(__dirname, 'results', `benchmark-${Date.now()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\nJSON result: ${jsonPath}`);

  // Write markdown summary
  const mdPath = path.join(__dirname, 'results', `benchmark-${Date.now()}.md`);
  const md = generateMarkdown(results);
  fs.writeFileSync(mdPath, md);
  console.log(`Markdown summary: ${mdPath}`);

  // Exit with error if any failed
  if (results.summary.failed > 0) {
    console.error(`\n⚠️ ${results.summary.failed} endpoint(s) failed thresholds`);
    process.exit(1);
  }

  console.log('\n🎉 All endpoints passed thresholds');
}

function generateMarkdown(results) {
  let lines = [
    '# API Benchmark Report',
    `**Date:** ${results.timestamp}`,
    `**Target:** ${results.target}`,
    '',
    '## Summary',
    `- Total endpoints: ${results.summary.totalEndpoints}`,
    `- Passed: ${results.summary.passed}`,
    `- Failed: ${results.summary.failed}`,
    '',
    '## Results',
    '| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Errors | TTFB (ms) | Status |',
    '|----------|--------|----------|----------|----------|-----|--------|-----------|--------|',
  ];

  for (const ep of results.endpoints) {
    if (ep.error) {
      lines.push(`| ${ep.endpoint} | ${ep.method || '-'} | - | - | - | - | - | - | ❌ ${ep.error.slice(0, 30)} |`);
      continue;
    }
    const status = ep.passed ? '✅' : '❌';
    lines.push(
      `| ${ep.endpoint} | ${ep.method} | ${ep.latency.p50} | ${ep.latency.p95} | ${ep.latency.p99} | ${ep.throughput.rps} | ${ep.errors.count} (${ep.errors.rate.toFixed(2)}%) | ${ep.ttfb.avg} | ${status} |`
    );
  }

  lines.push('', '## Failures');
  for (const ep of results.endpoints) {
    if (ep.failures) {
      lines.push(`### ${ep.endpoint}`);
      for (const f of ep.failures) {
        lines.push(`- ${f}`);
      }
    }
  }

  return lines.join('\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
