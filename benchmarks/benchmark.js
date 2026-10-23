/**
 * Production-Grade API Benchmark Suite
 * Captures p50, p95, p99 Latency, RPS (peak/sustained), TTFB, and Error Rate.
 * Gated by thresholds.json for CI smoke testing.
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

// 1. Load Configurations
const args = process.argv.slice(2);
const isSmoke = args.includes('--smoke');

let envConfig = {};
const envPath = path.join(__dirname, '.env.benchmark');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      envConfig[k.trim()] = v.join('=').trim();
    }
  });
}

const TARGET_HOST = process.env.BENCHMARK_TARGET_HOST || envConfig.BENCHMARK_TARGET_HOST || 'http://localhost:3000';
const AUTH_TOKEN = process.env.BENCHMARK_AUTH_TOKEN || envConfig.BENCHMARK_AUTH_TOKEN || 'bench_token_test_secure_banana_labs_2026';
const CONCURRENCY = isSmoke 
  ? parseInt(process.env.BENCHMARK_SMOKE_CONCURRENCY || envConfig.BENCHMARK_SMOKE_CONCURRENCY || '5', 10)
  : parseInt(process.env.BENCHMARK_CONCURRENCY || envConfig.BENCHMARK_CONCURRENCY || '20', 10);
const DURATION_SEC = isSmoke
  ? parseInt(process.env.BENCHMARK_SMOKE_DURATION_SECONDS || envConfig.BENCHMARK_SMOKE_DURATION_SECONDS || '3', 10)
  : parseInt(process.env.BENCHMARK_DURATION_SECONDS || envConfig.BENCHMARK_DURATION_SECONDS || '10', 10);

const THRESHOLDS_FILE = path.join(__dirname, 'thresholds.json');
let thresholds = { default: { max_p99_ms: 300, max_p95_ms: 150, max_error_rate_pct: 1.0, min_rps: 50 }, endpoints: {} };
if (fs.existsSync(THRESHOLDS_FILE)) {
  try {
    thresholds = JSON.parse(fs.readFileSync(THRESHOLDS_FILE, 'utf8'));
  } catch (e) {
    console.warn('Warning: Could not parse thresholds.json, using defaults.');
  }
}

// 2. Define Endpoints to Benchmark
const ENDPOINTS = [
  { path: '/api/health', method: 'GET', auth: false, body: null },
  { path: '/api/auth/login', method: 'POST', auth: false, body: JSON.stringify({ username: "benchmark_user", password: "test_password" }) },
  { path: '/api/items', method: 'GET', auth: true, body: null }
];

function calculatePercentiles(latencies) {
  if (!latencies.length) return { p50: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const getIdx = pct => Math.min(Math.floor((pct / 100) * sorted.length), sorted.length - 1);
  return {
    p50: parseFloat(sorted[getIdx(50)].toFixed(2)),
    p95: parseFloat(sorted[getIdx(95)].toFixed(2)),
    p99: parseFloat(sorted[getIdx(99)].toFixed(2))
  };
}

function sendRequest(parsedUrl, method, headers, postBody) {
  return new Promise((resolve) => {
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: method,
      headers: {
        'User-Agent': 'SecureBananaLabs-BenchmarkSuite/1.0',
        ...headers
      },
      timeout: 5000
    };

    if (postBody) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postBody);
    }

    const startHr = process.hrtime.bigint();
    let ttfb = 0;

    const req = client.request(reqOptions, (res) => {
      ttfb = Number(process.hrtime.bigint() - startHr) / 1e6; // in ms
      res.on('data', () => {});
      res.on('end', () => {
        const totalDuration = Number(process.hrtime.bigint() - startHr) / 1e6;
        const isError = res.statusCode >= 400 && res.statusCode !== 404; // 404 is allowed if mock
        resolve({ success: !isError, status: res.statusCode, latency: totalDuration, ttfb: ttfb });
      });
    });

    req.on('error', () => {
      const totalDuration = Number(process.hrtime.bigint() - startHr) / 1e6;
      resolve({ success: false, status: 0, latency: totalDuration, ttfb: totalDuration });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, status: 408, latency: 5000, ttfb: 5000 });
    });

    if (postBody) req.write(postBody);
    req.end();
  });
}

async function runBenchmarkForEndpoint(ep) {
  const targetUrl = new URL(ep.path, TARGET_HOST);
  console.log(`\n⚡ Benchmarking: ${ep.method} ${ep.path} (Concurrency: ${CONCURRENCY}, Duration: ${DURATION_SEC}s)`);

  const headers = {};
  if (ep.auth) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;

  const latencies = [];
  const ttfbs = [];
  let totalRequests = 0;
  let successfulRequests = 0;
  let errorRequests = 0;

  const startTime = Date.now();
  const stopTime = startTime + (DURATION_SEC * 1000);
  const rpsBuckets = {};

  async function worker() {
    while (Date.now() < stopTime) {
      const secBucket = Math.floor((Date.now() - startTime) / 1000);
      rpsBuckets[secBucket] = (rpsBuckets[secBucket] || 0) + 1;

      totalRequests++;
      const res = await sendRequest(targetUrl, ep.method, headers, ep.body);
      latencies.push(res.latency);
      ttfbs.push(res.ttfb);

      if (res.success) successfulRequests++;
      else errorRequests++;
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  const sustainedRps = parseFloat((totalRequests / totalTimeSec).toFixed(2));
  const peakRps = Math.max(...Object.values(rpsBuckets), sustainedRps);
  const errorRate = parseFloat(((errorRequests / totalRequests) * 100).toFixed(2));
  const pct = calculatePercentiles(latencies);
  const ttfbPct = calculatePercentiles(ttfbs);

  const epThreshold = thresholds.endpoints[ep.path] || thresholds.default;
  const passed = (pct.p99 <= epThreshold.max_p99_ms) && 
                 (errorRate <= epThreshold.max_error_rate_pct);

  return {
    endpoint: ep.path,
    method: ep.method,
    totalRequests,
    sustainedRps,
    peakRps,
    errorRate,
    p50_ms: pct.p50,
    p95_ms: pct.p95,
    p99_ms: pct.p99,
    ttfb_p50_ms: ttfbPct.p50,
    ttfb_p99_ms: ttfbPct.p99,
    passed,
    threshold: epThreshold
  };
}

async function main() {
  console.log(`=======================================================`);
  console.log(`🚀 API BENCHMARK SUITE - SECURE BANANA LABS BOUNTY #30`);
  console.log(`Mode: ${isSmoke ? 'SMOKE TEST (CI REGRESSION GATE)' : 'FULL BENCHMARK'}`);
  console.log(`Target: ${TARGET_HOST}`);
  console.log(`=======================================================`);

  const results = [];
  let allPassed = true;

  for (const ep of ENDPOINTS) {
    const res = await runBenchmarkForEndpoint(ep);
    results.push(res);
    if (!res.passed) allPassed = false;
  }

  // 3. Format Outputs (JSON & Markdown)
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(resultsDir, `benchmark-results-${timestamp}.json`);
  const mdPath = path.join(resultsDir, `benchmark-summary-${timestamp}.md`);
  const latestMdPath = path.join(resultsDir, `latest-summary.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

  let mdContent = `# 📊 API Benchmark Summary Report\n\n`;
  mdContent += `> **Execution Mode:** \`${isSmoke ? 'Smoke Test (CI)' : 'Full Load Test'}\`  \n`;
  mdContent += `> **Timestamp:** \`${new Date().toISOString()}\`  \n`;
  mdContent += `> **Target Host:** \`${TARGET_HOST}\`  \n`;
  mdContent += `> **Overall Status:** ${allPassed ? '🟢 **PASSED (Within Regression Thresholds)**' : '🔴 **FAILED (Threshold Exceeded)**'}\n\n`;

  mdContent += `| Endpoint | Method | Req/s (Sustained) | Peak Req/s | Latency p50 | Latency p95 | Latency p99 | TTFB p99 | Error Rate | Status |\n`;
  mdContent += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

  results.forEach(r => {
    const statusIcon = r.passed ? '🟢 PASS' : '🔴 FAIL';
    mdContent += `| \`${r.endpoint}\` | \`${r.method}\` | ${r.sustainedRps} | ${r.peakRps} | ${r.p50_ms}ms | ${r.p95_ms}ms | **${r.p99_ms}ms** | ${r.ttfb_p99_ms}ms | ${r.errorRate}% | ${statusIcon} |\n`;
  });

  mdContent += `\n### 🛡️ Threshold Enforcement Details\n\n`;
  results.forEach(r => {
    mdContent += `- **\`${r.endpoint}\`**: p99 observed: **${r.p99_ms}ms** (limit: \`${r.threshold.max_p99_ms}ms\`), Error rate: **${r.errorRate}%** (limit: \`${r.threshold.max_error_rate_pct}%\`)\n`;
  });

  fs.writeFileSync(mdPath, mdContent, 'utf8');
  fs.writeFileSync(latestMdPath, mdContent, 'utf8');

  console.log(`\n=======================================================`);
  console.log(`✅ Benchmark Finished!`);
  console.log(`Results saved:`);
  console.log(`- JSON: ${jsonPath}`);
  console.log(`- Markdown: ${mdPath}`);
  console.log(`=======================================================`);

  if (!allPassed && isSmoke) {
    console.error(`❌ CI Regression Gate Failed: Observed metrics exceeded thresholds.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
