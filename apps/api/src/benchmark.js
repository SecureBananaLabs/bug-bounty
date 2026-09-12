import autocannon from 'autocannon';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * API Benchmark Suite for FreelanceFlow Platform
 * Measures: p50, p95, p99 latency, RPS, error rate, TTFB
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const DURATION = parseInt(process.env.BENCHMARK_DURATION) || 10;
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS) || 10;

const ENDPOINTS = [
  {
    name: 'auth_register',
    method: 'POST',
    path: '/api/auth/register',
    body: JSON.stringify({
      email: `bench_${Date.now()}@test.com`,
      password: 'Benchmark123!',
      name: 'Benchmark User'
    }),
    headers: { 'content-type': 'application/json' }
  },
  {
    name: 'auth_login',
    method: 'POST',
    path: '/api/auth/login',
    body: JSON.stringify({
      email: 'bench@test.com',
      password: 'Benchmark123!'
    }),
    headers: { 'content-type': 'application/json' }
  },
  {
    name: 'auth_refresh',
    method: 'POST',
    path: '/api/auth/refresh',
    body: JSON.stringify({ refreshToken: 'bench_refresh_token' }),
    headers: { 'content-type': 'application/json' }
  },
  {
    name: 'users_list',
    method: 'GET',
    path: '/api/users'
  },
  {
    name: 'jobs_list',
    method: 'GET',
    path: '/api/jobs'
  },
  {
    name: 'jobs_create',
    method: 'POST',
    path: '/api/jobs',
    body: JSON.stringify({
      title: 'Benchmark Job',
      description: 'Load testing job creation',
      budget: 1000,
      skills: ['node', 'benchmark']
    }),
    headers: { 'content-type': 'application/json' }
  },
  {
    name: 'proposals_list',
    method: 'GET',
    path: '/api/proposals'
  },
  {
    name: 'search',
    method: 'GET',
    path: '/api/search?q=benchmark&limit=10'
  },
  {
    name: 'notifications',
    method: 'GET',
    path: '/api/notifications'
  },
  {
    name: 'payments_create',
    method: 'POST',
    path: '/api/payments',
    body: JSON.stringify({
      amount: 100,
      currency: 'USD',
      description: 'Benchmark payment'
    }),
    headers: { 'content-type': 'application/json' }
  }
];

async function runBenchmark(endpoint) {
  console.log(`\n🔥 Benchmarking: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);

  const result = await autocannon({
    url: `${BASE_URL}${endpoint.path}`,
    method: endpoint.method,
    body: endpoint.body,
    headers: endpoint.headers || {},
    duration: DURATION,
    connections: CONNECTIONS,
    pipelining: 1,
    bailout: 50
  });

  return {
    name: endpoint.name,
    path: endpoint.path,
    method: endpoint.method,
    latency: {
      p50: result.latency.p50,
      p95: result.latency.p95,
      p99: result.latency.p99,
      min: result.latency.min,
      max: result.latency.max
    },
    throughput: {
      rps: result.throughput.average,
      total_requests: result.requests.total
    },
    errors: {
      rate: (result.errors / result.requests.total) * 100,
      total: result.errors,
      timeouts: result.timeouts
    },
    ttfb: {
      average: result.latency.average
    },
    status_codes: result.statusCodeStats || {}
  };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           API BENCHMARK SUITE — FreelanceFlow              ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Target: ${BASE_URL.padEnd(53)} ║`);
  console.log(`║  Duration: ${String(DURATION + 's').padEnd(50)} ║`);
  console.log(`║  Connections: ${String(CONNECTIONS).padEnd(48)} ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();
  const results = [];

  for (const endpoint of ENDPOINTS) {
    try {
      const result = await runBenchmark(endpoint);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to benchmark ${endpoint.name}:`, error.message);
      results.push({
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        error: error.message
      });
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    config: {
      base_url: BASE_URL,
      duration: DURATION,
      connections: CONNECTIONS
    },
    endpoints: results,
    summary: {
      total_endpoints: ENDPOINTS.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      overall_rps: results
        .filter(r => r.throughput)
        .reduce((sum, r) => sum + r.throughput.rps, 0)
        .toFixed(2),
      average_p95: results
        .filter(r => r.latency)
        .reduce((sum, r) => sum + r.latency.p95, 0) / results.filter(r => r.latency).length
    }
  };

  // Save results
  const resultsDir = join(__dirname, '../benchmark-results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  const filename = `benchmark_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
  writeFileSync(
    join(resultsDir, filename),
    JSON.stringify(summary, null, 2)
  );

  // Print summary table
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         BENCHMARK RESULTS                                  ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');
  console.log('║ Endpoint          │ p50    │ p95    │ p99    │ RPS    │ Error% │ TTFB   ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');

  for (const r of results) {
    if (r.latency) {
      const name = r.name.padEnd(17).slice(0, 17);
      const p50 = `${r.latency.p50}ms`.padStart(6);
      const p95 = `${r.latency.p95}ms`.padStart(6);
      const p99 = `${r.latency.p99}ms`.padStart(6);
      const rps = `${r.throughput.rps.toFixed(1)}`.padStart(6);
      const err = `${r.errors.rate.toFixed(1)}%`.padStart(6);
      const ttfb = `${r.ttfb.average}ms`.padStart(6);
      console.log(`║ ${name} │${p50} │${p95} │${p99} │${rps} │${err} │${ttfb} ║`);
    } else {
      console.log(`║ ${r.name.padEnd(17).slice(0,17)} │ ERROR  │ ERROR  │ ERROR  │ ERROR  │ ERROR  │ ERROR  ║`);
    }
  }

  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Results saved to: benchmark-results/${filename}`);
  console.log(`⏱️  Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log(`\n📊 Overall: ${summary.summary.successful}/${summary.summary.total_endpoints} endpoints benchmarked`);
  console.log(`🚀 Total RPS: ${summary.summary.overall_rps}`);
}

main().catch(console.error);
