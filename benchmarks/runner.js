/**
 * FreelanceFlow API Benchmark Runner
 * 
 * Runs benchmark suite against all configured API endpoints using autocannon.
 * Outputs structured JSON results and a human-readable summary.
 * 
 * Usage:
 *   node benchmarks/runner.js              # full suite
 *   node benchmarks/runner.js --quick      # lighter load (10 conn, 5 sec)
 *   node benchmarks/runner.js --endpoint /api/jobs  # single endpoint
 * 
 * Environment:
 *   BENCHMARK_URL     - target URL (default: http://localhost:3001)
 *   BENCHMARK_TOKEN   - auth token for protected routes
 *   BENCHMARK_CONNECTIONS - concurrent connections (default: 50)
 *   BENCHMARK_DURATION    - test duration in seconds (default: 10)
 */

const autocannon = require('autocannon');
const { BASE_URL, TEST_TOKEN, endpoints } = require('./config');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '50');
const DURATION = parseInt(process.env.BENCHMARK_DURATION || '10');
const PIPELINING = 1;

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const singleEndpoint = args.find(a => a.startsWith('--endpoint='))?.split('=')[1];

const effectiveConnections = isQuick ? Math.min(10, CONNECTIONS) : CONNECTIONS;
const effectiveDuration = isQuick ? Math.min(5, DURATION) : DURATION;

const results = [];
const errors = [];

function buildHeaders(endpoint) {
  const headers = { 'Content-Type': 'application/json' };
  if (endpoint.auth) {
    headers['Authorization'] = `Bearer ${TEST_TOKEN}`;
  }
  return headers;
}

function buildUrl(endpoint) {
  return `${BASE_URL}${endpoint.path}`;
}

function runBenchmark(endpoint) {
  return new Promise((resolve) => {
    if (singleEndpoint && !endpoint.path.includes(singleEndpoint)) {
      return resolve(null);
    }

    const url = buildUrl(endpoint);
    
    console.log(`\n  🏃 Benchmarking: ${endpoint.label}`);
    console.log(`  → ${endpoint.method} ${url}`);

    const instance = autocannon({
      url: BASE_URL,
      connections: effectiveConnections,
      duration: effectiveDuration,
      pipelining: PIPELINING,
      requests: [
        {
          method: endpoint.method,
          path: endpoint.path,
          headers: buildHeaders(endpoint),
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
        }
      ],
      title: endpoint.label,
      renderLatencyTable: false
    }, (err, result) => {
      if (err) {
        errors.push({ endpoint: endpoint.label, error: err.message });
        console.log(`  ❌ Error: ${err.message}`);
        return resolve(null);
      }
      
      const summary = {
        endpoint: endpoint.label,
        method: endpoint.method,
        path: endpoint.path,
        connections: effectiveConnections,
        duration: effectiveDuration,
        latency: {
          p50: result.latency.p50,
          p95: result.latency.p95,
          p99: result.latency.p99,
          average: result.latency.average,
          max: result.latency.max,
          min: result.latency.min
        },
        throughput: {
          requestsPerSecond: result.requests.average,
          totalRequests: result.requests.total,
          sentBytes: result.throughput.average
        },
        errors: {
          timeouts: result.timeouts,
          non2xx: result.non2xx,
          resets: result.resets,
          errors: result.errors
        },
        statusCodes: result.statusCodeStats || {}
      };

      results.push(summary);
      
      const passed = summary.errors.timeouts === 0 && summary.errors.non2xx === 0 && summary.errors.errors === 0;
      const icon = passed ? '✅' : '⚠️';
      console.log(`  ${icon} p50=${summary.latency.p50.toFixed(1)}ms p95=${summary.latency.p95.toFixed(1)}ms p99=${summary.latency.p99.toFixed(1)}ms | ${summary.throughput.requestsPerSecond.toFixed(0)} req/s`);
      
      resolve(summary);
    });

    // Track progress
    process.stdout.write('  Progress: ');
    instance.on('tick', (counter) => {
      if (isQuick) return;
      if (counter.requests && counter.requests.total % 50 === 0) {
        process.stdout.write('.');
      }
    });
  });
}

async function runSuite() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     FreelanceFlow API Benchmark Suite               ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\n  Target: ${BASE_URL}`);
  console.log(`  Connections: ${effectiveConnections}`);
  console.log(`  Duration: ${effectiveDuration}s`);
  console.log(`  Endpoints: ${singleEndpoint ? `1 (${singleEndpoint})` : `${endpoints.length} (all)`}`);
  console.log(`\n  ${'─'.repeat(50)}`);

  const startTime = performance.now();

  for (const endpoint of endpoints) {
    await runBenchmark(endpoint);
  }

  const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);

  // Generate report
  const report = {
    meta: {
      timestamp: new Date().toISOString(),
      target: BASE_URL,
      connections: effectiveConnections,
      duration: effectiveDuration,
      totalEndpoints: results.length,
      totalTime: `${totalTime}s`
    },
    baselines: {
      latencyRead: { p50: 50, p95: 150, p99: 300 },
      errorRate: 0.01,
      throughputRead: 100
    },
    endpoints: results,
    errors: errors,
    summary: {
      totalEndpointsTested: results.length,
      passed: results.filter(r => r.errors.timeouts === 0 && r.errors.non2xx === 0 && r.errors.errors === 0).length,
      failed: results.filter(r => r.errors.timeouts > 0 || r.errors.non2xx > 0 || r.errors.errors > 0).length,
      errored: errors.length
    }
  };

  // Save JSON report
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportsDir, `benchmark-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  ${'─'.repeat(50)}`);
  console.log(`\n  📊 Report saved: ${reportPath}`);
  
  // Print summary table
  console.log(`\n  ${'═'.repeat(50)}`);
  console.log('  SUMMARY');
  console.log(`  ${'═'.repeat(50)}`);
  console.log(`  Total endpoints: ${results.length}`);
  console.log(`  Passed: ${report.summary.passed}`);
  console.log(`  Failed: ${report.summary.failed}`);
  console.log(`  Errors: ${report.summary.errored}`);
  console.log(`  Total time: ${totalTime}s`);
  console.log(`\n  ${'═'.repeat(50)}`);
  
  // Check baselines
  console.log('\n  Baseline Check (p50 < 50ms, p95 < 150ms, p99 < 300ms):');
  for (const r of results) {
    const p50Ok = r.latency.p50 < 50;
    const p95Ok = r.latency.p95 < 150;
    const p99Ok = r.latency.p99 < 300;
    const allOk = p50Ok && p95Ok && p99Ok;
    console.log(`  ${allOk ? '✅' : '⚠️'} ${r.endpoint.padEnd(40)} p50=${r.latency.p50.toFixed(0).padStart(5)}ms p95=${r.latency.p95.toFixed(0).padStart(5)}ms p99=${r.latency.p99.toFixed(0).padStart(5)}ms`);
  }

  return report;
}

runSuite()
  .then(report => {
    console.log('\n  ✅ Benchmark suite complete!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n  ❌ Suite failed:', err.message);
    process.exit(1);
  });
