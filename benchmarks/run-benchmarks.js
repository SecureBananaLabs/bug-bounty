const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.benchmark' });

const HOST = process.env.TARGET_HOST || 'http://localhost:3000';
const TOKEN = process.env.TEST_AUTH_TOKEN || '';
const IS_SMOKE = process.argv.includes('--smoke');

const endpoints = [
  { method: 'GET', path: '/api/health', auth: false },
  { method: 'GET', path: '/api/status', auth: false },
  { method: 'GET', path: '/api/protected/data', auth: true }
];

const thresholds = JSON.parse(fs.readFileSync(path.join(__dirname, 'thresholds.json'), 'utf8'));

async function runBench(endpoint) {
  const headers = {};
  if (endpoint.auth) headers['Authorization'] = `Bearer ${TOKEN}`;
  
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: `${HOST}${endpoint.path}`,
      connections: IS_SMOKE ? 2 : 50,
      duration: IS_SMOKE ? 2 : 10,
      method: endpoint.method,
      headers
    }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    autocannon.track(instance);
  });
}

async function main() {
  console.log(`Starting benchmark against ${HOST} (Smoke Mode: ${IS_SMOKE})\n`);
  
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

  let allResults = [];
  let markdown = `# API Benchmark Results\n\n`;
  markdown += `Target: ${HOST}\nDate: ${new Date().toISOString()}\n\n`;
  markdown += `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | Req/Sec | Error Rate |\n`;
  markdown += `|----------|----------|----------|----------|---------|------------|\n`;

  let failedThresholds = false;

  for (const ep of endpoints) {
    console.log(`Benchmarking ${ep.method} ${ep.path}...`);
    try {
      const res = await runBench(ep);
      allResults.push({ endpoint: ep.path, data: res });
      
      const p50 = res.latency.p50;
      const p95 = res.latency.p95;
      const p99 = res.latency.p99;
      const rps = res.requests.average;
      const errRate = (res.non2xx / res.requests.total) * 100 || 0;

      markdown += `| ${ep.path} | ${p50} | ${p95} | ${p99} | ${rps.toFixed(2)} | ${errRate.toFixed(2)}% |\n`;

      if (p99 > thresholds.max_p99_latency_ms) {
        console.error(`\n❌ THRESHOLD FAILED: ${ep.path} p99 latency (${p99}ms) exceeded maximum (${thresholds.max_p99_latency_ms}ms)`);
        failedThresholds = true;
      }
    } catch (e) {
      console.error(`Failed to benchmark ${ep.path}:`, e);
    }
  }

  fs.writeFileSync(path.join(resultsDir, 'latest.json'), JSON.stringify(allResults, null, 2));
  fs.writeFileSync(path.join(resultsDir, 'SUMMARY.md'), markdown);
  console.log(`\n✅ Results written to /benchmarks/results/`);

  if (IS_SMOKE && failedThresholds) {
    console.error("\nSmoke test failed due to threshold violations.");
    process.exit(1);
  }
}

main().catch(console.error);
