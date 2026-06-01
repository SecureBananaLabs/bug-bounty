/**
 * API Benchmark Runner
 * 
 * Runs autocannon against all configured API endpoints,
 * collects metrics (p50/p95/p99 latency, RPS, error rate, TTFB),
 * and writes results to /benchmarks/results/ as JSON + Markdown.
 * 
 * Usage:
 *   node benchmarks/runner.js              # Full benchmark suite
 *   node benchmarks/runner.js --smoke      # Quick smoke test (CI)
 *   node benchmarks/runner.js --endpoint "POST /api/auth/login"  # Single endpoint
 *   node benchmarks/runner.js --help       # Show options
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// ─── Config ────────────────────────────────────────────────────────────

const TARGET = process.env.BENCHMARK_HOST || 'http://localhost:4000';
const RESULTS_DIR = path.join(__dirname, 'results');

// Default benchmark settings
const DURATION = parseInt(process.env.BENCHMARK_DURATION || '15', 10);  // seconds
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '10', 10);
const PIPELINING = parseInt(process.env.BENCHMARK_PIPELINING || '1', 10);
const WARMUP_DURATION = parseInt(process.env.BENCHMARK_WARMUP || '2', 10);
const TIMEOUT = parseInt(process.env.BENCHMARK_TIMEOUT || '10', 10);

// ─── Parse CLI ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isSmoke = args.includes('--smoke');
const singleEndpoint = args.find(a => a.startsWith('--endpoint='))?.split('=')[1] || null;
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
  API Benchmark Runner

  Usage:
    node benchmarks/runner.js                  Full benchmark suite
    node benchmarks/runner.js --smoke          Quick smoke test (shorter, for CI)
    node benchmarks/runner.js --endpoint="POST /api/auth/login"  Test one endpoint
    node benchmarks/runner.js --help           Show this help

  Environment variables:
    BENCHMARK_HOST     Target URL (default: http://localhost:4000)
    BENCHMARK_DURATION Duration per endpoint in seconds (default: 15)
    BENCHMARK_CONNECTIONS  Concurrent connections (default: 10)
    BENCHMARK_TIMEOUT  Request timeout in seconds (default: 10)
  `);
  process.exit(0);
}

// Load endpoint config
const { endpoints, perEndpointConfig } = require('./config');

// ─── Helpers ───────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function ms(v) {
  return Number(v).toFixed(2);
}

function pct(v) {
  return (v * 100).toFixed(2) + '%';
}

function now() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// ─── Single Endpoint Benchmark ─────────────────────────────────────────

function runBenchmark(endpoint) {
  return new Promise((resolve, reject) => {
    const overrides = perEndpointConfig[endpoint.name] || {};
    const connections = overrides.connections || CONNECTIONS;
    const pipelining = overrides.pipelining || PIPELINING;

    const opts = {
      url: TARGET,
      socketPath: null,
      connections,
      pipelining,
      duration: isSmoke ? 5 : DURATION,
      timeout: TIMEOUT,
      warmup: isSmoke ? false : WARMUP_DURATION > 0,
      warmupDuration: WARMUP_DURATION,
      title: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'bug-bounty-benchmark/1.0'
      }
    };

    // Add body for POST requests
    if (endpoint.body) {
      opts.body = JSON.stringify(endpoint.body);
      opts.headers['Content-Length'] = Buffer.byteLength(opts.body).toString();
    }

    // Add auth token if needed
    if (endpoint.authToken) {
      opts.headers['Authorization'] = `Bearer ${endpoint.authToken}`;
    }

    const instance = autocannon(opts, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });

    // Print progress
    autocannon.track(instance, { renderProgressBar: true });
  });
}

// ─── Metrics Extraction ────────────────────────────────────────────────

function extractMetrics(endpoint, result) {
  const latencies = result.latency;
  const requests = result.requests;
  const errors = result.errors;
  const throughput = result.throughput;

  // Find p50, p95, p99 from percentile data
  const p50 = (latencies.p50 || 0) / 1000; // µs → ms
  const p75 = (latencies.p75 || 0) / 1000;
  const p95 = (latencies.p95 || 0) / 1000;
  const p99 = (latencies.p99 || 0) / 1000;
  const p999 = (latencies.p999 || 0) / 1000;
  const maxLatency = (latencies.max || 0) / 1000;
  const minLatency = (latencies.min || 0) / 1000;
  const avgLatency = (latencies.average || 0) / 1000;

  const totalRequests = requests.total || 0;
  const totalSent = requests.sent || 0;
  const sentPerSec = throughput.sent || 0;
  const recvPerSec = throughput.recv || 0;
  const rps = requests.average || 0;
  const durationActual = result.duration || 0;

  const totalErrors = (errors.timeout || 0) + (errors.connect || 0) + 
                      (errors.write || 0) + (errors.read || 0) +
                      (errors.rateLimited || false ? 429 : 0);
  const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

  // TTFB approximation - autocannon doesn't directly expose TTFB
  // We estimate from latency since autocannon measures full round-trip
  const estimatedTtfb = avgLatency * 0.4; // rough estimate: TTFB ~40% of total latency

  // Non-2xx/3xx status codes as error rate (approximation)
  // autocannon reports non-2xx via `errors`
  const non2xx = result.errors?.statusCodes || {};

  return {
    endpoint: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    timestamp: new Date().toISOString(),
    duration: durationActual,

    // Latency (ms)
    latency: {
      min: minLatency,
      p50: p50,
      p75: p75,
      p95: p95,
      p99: p99,
      p999: p999,
      max: maxLatency,
      avg: avgLatency
    },

    // Throughput
    throughput: {
      rps: Math.round(rps),
      sentPerSec: Math.round(sentPerSec),
      recvPerSec: Math.round(recvPerSec),
      totalRequests,
      totalBytesSent: requests.sentBytes || 0,
      totalBytesRecv: requests.recvBytes || 0
    },

    // Errors
    errors: {
      total: totalErrors,
      rate: errorRate,
      timeout: errors.timeout || 0,
      connect: errors.connect || 0,
      write: errors.write || 0,
      read: errors.read || 0
    },

    // Estimated TTFB
    ttfb: {
      estimated: estimatedTtfb,
      note: 'TTFB is estimated as 40% of avg latency (autocannon does not expose TTFB directly)'
    },

    // Connections
    connections: result.connections || 0,
    pipelining: result.pipelining || 1,

    // Raw for debugging
    rawNon2xx: non2xx
  };
}

// ─── Markdown Report ───────────────────────────────────────────────────

function generateMarkdownReport(allMetrics, thresholds) {
  const timestamp = new Date().toISOString();

  let md = `# API Benchmark Report\n\n`;
  md += `**Date:** ${timestamp}\n`;
  md += `**Target:** ${TARGET}\n`;
  md += `**Mode:** ${isSmoke ? '🚬 Smoke Test (5s)' : '🔬 Full Benchmark (15s)'}\n`;
  md += `**Duration per endpoint:** ${isSmoke ? '5s' : DURATION + 's'}\n`;
  md += `**Concurrent connections:** ${CONNECTIONS}\n\n`;

  // Summary table
  md += `## 📊 Summary\n\n`;
  md += `| Endpoint | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate | Status |\n`;
  md += `|----------|-----|----------|----------|----------|------------|--------|\n`;

  for (const m of allMetrics) {
    const passed = checkThreshold(m, thresholds);
    const status = passed ? '✅' : '❌';
    md += `| ${m.endpoint} | ${m.throughput.rps} | ${ms(m.latency.p50)} | ${ms(m.latency.p95)} | ${ms(m.latency.p99)} | ${pct(m.errors.rate)} | ${status} |\n`;
  }

  md += `\n---\n\n`;

  // Detailed results
  md += `## 🔬 Detailed Results\n\n`;

  for (const m of allMetrics) {
    md += `### ${m.endpoint}\n\n`;
    md += `**Method:** ${m.method} | **Path:** ${m.path}\n\n`;

    md += `#### Latency (ms)\n`;
    md += `| Min | Avg | p50 | p75 | p95 | p99 | p99.9 | Max |\n`;
    md += `|-----|-----|-----|-----|-----|-----|-------|-----|\n`;
    md += `| ${ms(m.latency.min)} | ${ms(m.latency.avg)} | ${ms(m.latency.p50)} | ${ms(m.latency.p75)} | ${ms(m.latency.p95)} | ${ms(m.latency.p99)} | ${ms(m.latency.p999)} | ${ms(m.latency.max)} |\n\n`;

    md += `#### Throughput\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Requests/sec | ${m.throughput.rps} |\n`;
    md += `| Total requests | ${m.throughput.totalRequests} |\n`;
    md += `| Bytes sent/sec | ${(m.throughput.sentPerSec / 1024).toFixed(1)} KB/s |\n`;
    md += `| Bytes recv/sec | ${(m.throughput.recvPerSec / 1024).toFixed(1)} KB/s |\n\n`;

    md += `#### Errors\n`;
    md += `| Type | Count |\n`;
    md += `|------|-------|\n`;
    md += `| Total | ${m.errors.total} |\n`;
    md += `| Rate | ${pct(m.errors.rate)} |\n`;
    md += `| Timeout | ${m.errors.timeout} |\n`;
    md += `| Connect | ${m.errors.connect} |\n`;
    md += `| Write | ${m.errors.write} |\n`;
    md += `| Read | ${m.errors.read} |\n\n`;

    md += `#### TTFB\n`;
    md += `- Estimated: **${ms(m.ttfb.estimated)} ms**\n`;
    md += `- *${m.ttfb.note}*\n\n`;

    // Threshold check
    const passed = checkThreshold(m, thresholds);
    md += `#### Threshold Check: ${passed ? '✅ Passed' : '❌ Failed'}\n\n`;

    md += `---\n\n`;
  }

  // System info
  md += `## 💻 Environment\n\n`;
  md += `- Host: ${TARGET}\n`;
  md += `- Timestamp: ${timestamp}\n`;
  md += `- Mode: ${isSmoke ? 'Smoke' : 'Full'}\n`;
  md += `- Concurrency: ${CONNECTIONS}\n`;
  md += `- Duration per endpoint: ${isSmoke ? '5s' : DURATION + 's'}\n`;

  return md;
}

// ─── Threshold Check ──────────────────────────────────────────────────

function checkThreshold(metrics, thresholds) {
  if (!thresholds || !thresholds.default) return true;
  const t = thresholds.default;
  if (metrics.latency.p99 > t.p99MaxMs) return false;
  if (metrics.errors.rate > t.errorRateMax) return false;
  return true;
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  API Benchmark Suite');
  console.log('  Target:', TARGET);
  console.log('  Mode:', isSmoke ? '🚬 SMOKE TEST (5s per endpoint)' : '🔬 FULL BENCHMARK (15s per endpoint)');
  console.log('='.repeat(70) + '\n');

  // Load thresholds
  let thresholds;
  try {
    thresholds = require('./thresholds.json');
  } catch {
    thresholds = { default: { p99MaxMs: 500, errorRateMax: 0.01 } };
  }

  // Filter to single endpoint if specified
  let activeEndpoints = endpoints;
  if (singleEndpoint) {
    activeEndpoints = endpoints.filter(e => e.name === singleEndpoint);
    if (activeEndpoints.length === 0) {
      console.error(`❌ Endpoint "${singleEndpoint}" not found in config`);
      process.exit(1);
    }
    console.log(`🔍 Testing single endpoint: ${singleEndpoint}\n`);
  }

  const allMetrics = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < activeEndpoints.length; i++) {
    const endpoint = activeEndpoints[i];

    console.log(`\n[${i + 1}/${activeEndpoints.length}] ${endpoint.name}`);
    console.log(`  Method: ${endpoint.method} | Path: ${endpoint.path}`);
    console.log('-'.repeat(50));

    try {
      const result = await runBenchmark(endpoint);
      const metrics = extractMetrics(endpoint, result);
      allMetrics.push(metrics);

      const ok = checkThreshold(metrics, thresholds);
      if (ok) {
        passed++;
        console.log(`  ✅ RPS: ${metrics.throughput.rps} | p50: ${ms(metrics.latency.p50)}ms | p95: ${ms(metrics.latency.p95)}ms | p99: ${ms(metrics.latency.p99)}ms`);
      } else {
        failed++;
        console.log(`  ❌ FAILED threshold check - RPS: ${metrics.throughput.rps} | p99: ${ms(metrics.latency.p99)}ms | Errors: ${pct(metrics.errors.rate)}`);
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ Benchmark error: ${err.message}`);
      allMetrics.push({
        endpoint: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        error: err.message,
        timestamp: new Date().toISOString(),
        latency: { min: 0, p50: 0, p75: 0, p95: 0, p99: 0, p999: 0, max: 0, avg: 0 },
        throughput: { rps: 0, sentPerSec: 0, recvPerSec: 0, totalRequests: 0 },
        errors: { total: 1, rate: 1, timeout: 0, connect: 0, write: 0, read: 0 },
        ttfb: { estimated: 0 }
      });
    }
  }

  // ── Generate reports ──
  console.log('\n' + '='.repeat(70));
  console.log('  Generating reports...');

  ensureDir(RESULTS_DIR);
  const timestamp = now();

  // JSON report
  const jsonReport = {
    summary: {
      target: TARGET,
      timestamp: new Date().toISOString(),
      mode: isSmoke ? 'smoke' : 'full',
      endpoints: activeEndpoints.length,
      passed,
      failed
    },
    thresholds,
    results: allMetrics
  };

  const jsonPath = path.join(RESULTS_DIR, `benchmark-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

  // Markdown report
  const mdReport = generateMarkdownReport(allMetrics, thresholds);
  const mdPath = path.join(RESULTS_DIR, `benchmark-${timestamp}.md`);
  fs.writeFileSync(mdPath, mdReport);

  console.log(`  ✅ JSON report: ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`  ✅ Markdown report: ${path.relative(process.cwd(), mdPath)}`);

  // ── Final summary ──
  const total = activeEndpoints.length;
  console.log('\n' + '='.repeat(70));
  console.log('  RESULTS');
  console.log('='.repeat(70));
  console.log(`  Total endpoints: ${total}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📁 Reports saved to: ${RESULTS_DIR}/`);
  console.log('='.repeat(70) + '\n');

  // Exit with error code if any endpoint failed thresholds
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
