import autocannon from 'autocannon';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env config (fallback to standard .env if .env.benchmark doesn't exist)
if (fs.existsSync && require('fs').existsSync(path.join(__dirname, '.env.benchmark'))) {
  dotenv.config({ path: path.join(__dirname, '.env.benchmark') });
} else {
  dotenv.config();
}

const HOST = process.env.BENCHMARK_TARGET_HOST || 'http://localhost:4000';
const TOKEN = process.env.BENCHMARK_AUTH_TOKEN || 'test_token';
const DURATION = parseInt(process.env.BENCHMARK_DURATION || '5', 10);
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '10', 10);
const RESULTS_DIR = path.join(__dirname, 'results');
const THRESHOLDS_PATH = path.join(__dirname, 'thresholds.json');

const endpoints = [
  { name: 'Health Check', path: '/health', method: 'GET' },
  { name: 'Auth Login', path: '/api/auth/login', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'test' }) },
  { name: 'Get Users', path: '/api/users', method: 'GET', auth: true },
  { name: 'Get Jobs', path: '/api/jobs', method: 'GET' },
  { name: 'Post Job', path: '/api/jobs', method: 'POST', auth: true, body: JSON.stringify({ title: 'Benchmark Test Job', description: 'Test', budget: 100 }) },
  { name: 'Get Proposals', path: '/api/proposals', method: 'GET', auth: true },
  { name: 'Get Payments', path: '/api/payments', method: 'GET', auth: true },
  { name: 'Get Reviews', path: '/api/reviews', method: 'GET', auth: true },
  { name: 'Get Messages', path: '/api/messages', method: 'GET', auth: true },
  { name: 'Get Notifications', path: '/api/notifications', method: 'GET', auth: true },
  { name: 'Get Uploads', path: '/api/uploads', method: 'GET', auth: true },
  { name: 'Search', path: '/api/search?q=test', method: 'GET' },
  { name: 'Admin Metrics', path: '/api/admin/metrics', method: 'GET', auth: true }
];

async function runBenchmark(endpoint) {
  return new Promise((resolve, reject) => {
    const opts = {
      url: `${HOST}${endpoint.path}`,
      connections: CONNECTIONS,
      duration: DURATION,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (endpoint.auth) {
      if (TOKEN === 'test_token' || !TOKEN) {
        return reject(new Error(`BENCHMARK_AUTH_TOKEN must be set to a valid token for authenticated endpoint: ${endpoint.name}`));
      }
      opts.headers['Authorization'] = `Bearer ${TOKEN}`;
    }

    if (endpoint.body) {
      opts.body = endpoint.body;
    }

    const instance = autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });

    // Time to first byte isn't natively captured perfectly by autocannon out of the box, 
    // but latency contains it. Autocannon tracks min/max/average latencies.
  });
}

async function main() {
  await fs.mkdir(RESULTS_DIR, { recursive: true });
  
  const thresholds = JSON.parse(await fs.readFile(THRESHOLDS_PATH, 'utf-8'));
  const results = [];
  let hasFailed = false;

  console.log(`Starting benchmarks against ${HOST}...\n`);

  for (const endpoint of endpoints) {
    console.log(`Benchmarking ${endpoint.name} (${endpoint.method} ${endpoint.path})...`);
    try {
      const result = await runBenchmark(endpoint);
      
      const p50 = result.latency.p50 || null;
      const p95 = result.latency.p97_5 || null;
      const p99 = result.latency.p99 || null;
      const rps = result.requests.average || 0;
      const totalErrors = result.errors + (result.non2xx || 0);
      const errorRate = (totalErrors / result.requests.total) * 100 || 0;
      // We estimate TTFB by using min latency or a proxy, but autocannon latency is effectively TTFB to full response.
      const ttfb = result.latency.min || null; 

      const data = {
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        p50, p95, p99, rps, errorRate, ttfb,
        passed: p99 <= thresholds.maxP99LatencyMs && errorRate <= thresholds.maxErrorRatePercent && rps >= (thresholds.minRps || 0)
      };

      results.push(data);
      
      if (!data.passed) {
        hasFailed = true;
      }
    } catch (e) {
      console.error(`Failed to benchmark ${endpoint.name}:`, e);
      hasFailed = true;
    }
  }

  await fs.writeFile(
    path.join(RESULTS_DIR, 'results.json'), 
    JSON.stringify(results, null, 2)
  );

  let md = `# Benchmark Results\n\n`;
  md += `**Target:** ${HOST}\n`;
  md += `**Connections:** ${CONNECTIONS} | **Duration:** ${DURATION}s per endpoint\n\n`;
  md += `| Endpoint | Method | Path | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate | TTFB (ms) | Status |\n`;
  md += `|---|---|---|---|---|---|---|---|---|---|\n`;

  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    md += `| ${r.name} | ${r.method} | \`${r.path}\` | ${r.p50} | ${r.p95} | ${r.p99} | ${r.rps.toFixed(2)} | ${r.errorRate.toFixed(2)}% | ${r.ttfb} | ${status} |\n`;
  }

  await fs.writeFile(path.join(RESULTS_DIR, 'summary.md'), md);
  console.log('\nResults saved to benchmarks/results/');
  console.log(md);

  // If in CI mode (which we'll signal via env var), fail if regression detected
  if (process.env.CI && hasFailed) {
    console.error("Benchmark failed due to regression thresholds.");
    process.exit(1);
  }
}

main().catch(console.error);
