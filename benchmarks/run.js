const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// 1. Parse configuration
const envPath = path.join(__dirname, '../.env.benchmark');
let env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...vals] = line.split('=');
      if (key) env[key.trim()] = vals.join('=').trim();
    }
  });
}

const TARGET_HOST = process.env.TARGET_HOST || env.TARGET_HOST || 'http://localhost:4000';
const TOKEN = process.env.BENCHMARK_AUTH_TOKEN || env.BENCHMARK_AUTH_TOKEN;
const CONNECTIONS = parseInt(process.env.CONNECTIONS || env.CONNECTIONS || '10');
const PIPELINING = parseInt(process.env.PIPELINING || env.PIPELINING || '1');
const DURATION = parseInt(process.env.DURATION || env.DURATION || '10');

const isCI = process.argv.includes('--ci');
const duration = isCI ? 5 : DURATION;
const connections = isCI ? 5 : CONNECTIONS;

// 2. Define endpoints
const endpoints = [
  { path: '/api/health', method: 'GET' },
  { path: '/api/search', method: 'GET', query: '?q=developer' },
  { path: '/api/jobs', method: 'GET' },
  { path: '/api/proposals', method: 'GET', auth: true },
  { path: '/api/users', method: 'GET' },
  { path: '/api/reviews', method: 'GET' },
  { path: '/api/messages', method: 'GET', auth: true },
  { path: '/api/notifications', method: 'GET', auth: true }
];

// 3. Runner
async function runTest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${TARGET_HOST}${endpoint.path}${endpoint.query || ''}`;
    const headers = {};
    if (endpoint.auth && TOKEN) {
      headers['Authorization'] = `Bearer ${TOKEN}`;
    }

    console.log(`Running benchmark on ${endpoint.method} ${url}...`);
    const instance = autocannon({
      url,
      method: endpoint.method,
      connections,
      pipelining: PIPELINING,
      duration,
      headers
    }, (err, result) => {
      if (err) return reject(err);
      
      const metrics = {
        endpoint: endpoint.path,
        p50LatencyMs: result.latency.p50,
        p95LatencyMs: result.latency.p95,
        p99LatencyMs: result.latency.p99,
        rps: result.requests.average,
        errorRatePercent: result.requests.sent > 0 ? (result.errors / result.requests.sent) * 100 : 0,
        minLatencyMs: result.latency.min
      };
      resolve(metrics);
    });

    if (!isCI) {
      autocannon.track(instance, { renderProgressBar: true });
    }
  });
}

// 4. Main execution
async function main() {
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const results = [];
  
  for (const endpoint of endpoints) {
    const metrics = await runTest(endpoint);
    results.push(metrics);
  }

  // 5. Output JSON
  fs.writeFileSync(
    path.join(resultsDir, 'results.json'),
    JSON.stringify(results, null, 2)
  );

  // 6. Output Markdown
  let md = `# Benchmark Results\n\n`;
  md += `**Target:** ${TARGET_HOST}\n`;
  md += `**Concurrency:** ${connections} connections\n`;
  md += `**Duration:** ${duration}s per endpoint\n\n`;
  md += `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error % | Min Latency (ms) |\n`;
  md += `|---|---|---|---|---|---|---|\n`;
  
  for (const r of results) {
    md += `| ${r.endpoint} | ${r.p50LatencyMs} | ${r.p95LatencyMs} | ${r.p99LatencyMs} | ${r.rps.toFixed(2)} | ${r.errorRatePercent.toFixed(2)}% | ${r.minLatencyMs} |\n`;
  }
  
  fs.writeFileSync(path.join(resultsDir, 'results.md'), md);
  console.log(`\n✅ Benchmarks complete. Results saved to benchmarks/results/`);

  // 7. Threshold Gating (for CI)
  if (isCI) {
    const thresholdsPath = path.join(__dirname, 'thresholds.json');
    if (fs.existsSync(thresholdsPath)) {
      const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, 'utf-8'));
      let failed = false;
      
      console.log(`\nEvaluating CI Performance Thresholds...`);
      for (const r of results) {
        const t = thresholds.endpoints[r.endpoint] || thresholds.global;
        if (t) {
          if (t.p99LatencyMs && r.p99LatencyMs > t.p99LatencyMs) {
            console.error(`❌ FAILED: ${r.endpoint} p99 latency (${r.p99LatencyMs}ms) exceeds threshold (${t.p99LatencyMs}ms)`);
            failed = true;
          }
          if (t.errorRatePercent !== undefined && r.errorRatePercent > t.errorRatePercent) {
            console.error(`❌ FAILED: ${r.endpoint} error rate (${r.errorRatePercent}%) exceeds threshold (${t.errorRatePercent}%)`);
            failed = true;
          }
        }
      }
      
      if (failed) {
        console.error(`\n💥 CI Smoke Benchmark Failed due to performance regression.`);
        process.exit(1);
      } else {
        console.log(`\n✅ All endpoints passed performance thresholds.`);
      }
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
