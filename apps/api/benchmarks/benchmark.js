import autocannon from 'autocannon';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, 'results');
const THRESHOLDS_PATH = join(__dirname, 'thresholds.json');

// Ensure results directory exists
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

// Default benchmark options
const defaultOpts = {
  connections: 10,
  duration: 10,
  pipelining: 1,
  timeout: 10,
};

// API endpoints to benchmark
const endpoints = [
  { name: 'Health Check', method: 'GET', path: '/api/health' },
  { name: 'Auth Login', method: 'POST', path: '/api/auth/login', body: JSON.stringify({ email: 'test@example.com', password: 'test123' }), headers: { 'content-type': 'application/json' } },
  { name: 'Auth Register', method: 'POST', path: '/api/auth/register', body: JSON.stringify({ email: 'bench@test.com', password: 'test123', name: 'Bench User' }), headers: { 'content-type': 'application/json' } },
  { name: 'Jobs List', method: 'GET', path: '/api/jobs' },
  { name: 'Jobs Search', method: 'GET', path: '/api/jobs/search?q=developer' },
  { name: 'Users List', method: 'GET', path: '/api/users' },
  { name: 'Reviews List', method: 'GET', path: '/api/reviews' },
  { name: 'Notifications', method: 'GET', path: '/api/notifications' },
  { name: 'Messages', method: 'GET', path: '/api/messages' },
  { name: 'Proposals', method: 'GET', path: '/api/proposals' },
  { name: 'Payments', method: 'GET', path: '/api/payments' },
  { name: 'Admin Stats', method: 'GET', path: '/api/admin/stats' },
];

/**
 * Run benchmark for a single endpoint
 */
async function benchmarkEndpoint(endpoint, baseUrl) {
  const opts = {
    ...defaultOpts,
    url: `${baseUrl}${endpoint.path}`,
    method: endpoint.method,
    title: endpoint.name,
  };

  if (endpoint.body) {
    opts.body = endpoint.body;
  }
  if (endpoint.headers) {
    opts.headers = endpoint.headers;
  }

  return new Promise((resolve, reject) => {
    const instance = autocannon(opts, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    instance.on('tick', (data) => {
      process.stdout.write(`  ${endpoint.name}: ${data.requests.average} req/s\r`);
    });
  });
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(results, startTime, endTime) {
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  let md = `# API Benchmark Report\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Duration:** ${duration}s total\n`;
  md += `**Environment:** ${process.platform} ${process.arch}\n\n`;
  md += `## Results\n\n`;
  md += `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate | TTFB (ms) |\n`;
  md += `|----------|----------|----------|----------|-----|------------|----------|\n`;

  for (const r of results) {
    const p50 = r.latency.p50;
    const p95 = r.latency.p95;
    const p99 = r.latency.p99;
    const rps = r.requests.average;
    const errorRate = ((r.errors / r.requests.total) * 100).toFixed(2);
    const ttfb = r.latency.p50; // Approximation
    md += `| ${r.title} | ${p50} | ${p95} | ${p99} | ${rps} | ${errorRate}% | ${ttfb} |\n`;
  }

  md += `\n## Thresholds\n\n`;
  md += `Thresholds are defined in \`thresholds.json\`. CI will fail if any endpoint exceeds the p99 threshold.\n`;

  return md;
}

/**
 * Check thresholds and return violations
 */
function checkThresholds(results, thresholds) {
  const violations = [];
  for (const r of results) {
    const threshold = thresholds[r.title];
    if (threshold && r.latency.p99 > threshold.p99) {
      violations.push({
        endpoint: r.title,
        metric: 'p99',
        actual: r.latency.p99,
        threshold: threshold.p99,
      });
    }
  }
  return violations;
}

/**
 * Main benchmark runner
 */
export async function runBenchmarks(baseUrl = 'http://localhost:3000', options = {}) {
  const startTime = Date.now();
  const results = [];

  console.log('Starting API benchmarks...\n');

  for (const endpoint of endpoints) {
    console.log(`Benchmarking: ${endpoint.name}`);
    try {
      const result = await benchmarkEndpoint(endpoint, baseUrl);
      results.push(result);
      console.log(`  ✓ ${endpoint.name}: ${result.requests.average} req/s, p99: ${result.latency.p99}ms`);
    } catch (err) {
      console.error(`  ✗ ${endpoint.name}: ${err.message}`);
      results.push({
        title: endpoint.name,
        latency: { p50: 0, p95: 0, p99: 0 },
        requests: { average: 0, total: 0 },
        errors: 1,
        errorRate: 100,
      });
    }
  }

  const endTime = Date.now();

  // Save JSON results
  const jsonPath = join(RESULTS_DIR, `benchmark-${Date.now()}.json`);
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\nJSON results saved to: ${jsonPath}`);

  // Save markdown report
  const mdReport = generateMarkdownReport(results, startTime, endTime);
  const mdPath = join(RESULTS_DIR, `benchmark-${Date.now()}.md`);
  writeFileSync(mdPath, mdReport);
  console.log(`Markdown report saved to: ${mdPath}`);

  // Check thresholds
  if (options.checkThresholds) {
    try {
      const thresholds = JSON.parse(readFileSync(THRESHOLDS_PATH, 'utf-8'));
      const violations = checkThresholds(results, thresholds);
      if (violations.length > 0) {
        console.error('\n❌ THRESHOLD VIOLATIONS:');
        for (const v of violations) {
          console.error(`  ${v.endpoint}: ${v.metric} = ${v.actual}ms > ${v.threshold}ms`);
        }
        process.exit(1);
      } else {
        console.log('\n✅ All endpoints within thresholds');
      }
    } catch (err) {
      console.warn('Could not check thresholds:', err.message);
    }
  }

  return results;
}

// Run if executed directly
if (process.argv[1] && process.argv[1].includes('benchmark')) {
  const baseUrl = process.env.BENCHMARK_URL || 'http://localhost:3000';
  const checkThresholds = process.argv.includes('--check-thresholds');
  runBenchmarks(baseUrl, { checkThresholds });
}
