import autocannon from 'autocannon';
import chalk from 'chalk';
import Table from 'cli-table3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.benchmark' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.BENCHMARK_URL || 'http://localhost:3000';
const token = process.env.BENCHMARK_TOKEN || 'test-token';

const endpoints = [
  { path: '/health', method: 'GET' },
  { path: '/api/jobs', method: 'GET' },
  { path: '/api/search', method: 'GET', query: '?q=developer' },
  { path: '/api/auth/login', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'password' }) },
];

const thresholds = JSON.parse(fs.readFileSync(path.join(__dirname, 'thresholds.json'), 'utf8'));

async function runBenchmark(endpoint) {
  console.log(chalk.blue(`🚀 Benchmarking ${endpoint.method} ${endpoint.path}...`));
  
  const result = await autocannon({
    url: `${baseUrl}${endpoint.path}${endpoint.query || ''}`,
    method: endpoint.method,
    body: endpoint.body,
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${token}`
    },
    connections: 10,
    duration: 10
  });

  return {
    path: endpoint.path,
    method: endpoint.method,
    p50: result.latency.p50,
    p95: result.latency.p95,
    p99: result.latency.p99,
    rps: result.requests.average,
    errors: result.errors,
    timeouts: result.timeouts,
    ttfb: result.latency.average, // autocannon average latency is a good proxy for TTFB in many contexts
    errorRate: ((result.errors + result.timeouts) / result.requests.total) * 100 || 0
  };
}

async function main() {
  const results = [];
  const summaryTable = new Table({
    head: ['Endpoint', 'Method', 'p50 (ms)', 'p95 (ms)', 'p99 (ms)', 'RPS', 'Error %'],
    style: { head: ['cyan'] }
  });

  for (const endpoint of endpoints) {
    const res = await runBenchmark(endpoint);
    results.push(res);
    
    const threshold = thresholds.endpoints[res.path] || thresholds.default;
    const p99Color = res.p99 > threshold.p99 ? chalk.red : chalk.green;
    
    summaryTable.push([
      res.path,
      res.method,
      res.p50,
      res.p95,
      p99Color(res.p99),
      Math.round(res.rps),
      res.errorRate.toFixed(2)
    ]);
  }

  console.log('\n' + summaryTable.toString());

  let hasRegression = false;
  for (const res of results) {
    const threshold = thresholds.endpoints[res.path] || thresholds.default;
    if (res.p99 > threshold.p99) {
      console.log(chalk.red(`❌ Regression detected on ${res.path}: p99 is ${res.p99}ms (threshold: ${threshold.p99}ms)`));
      hasRegression = true;
    }
  }

  // Save JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);
  
  fs.writeFileSync(
    path.join(resultsDir, `benchmark-${timestamp}.json`),
    JSON.stringify(results, null, 2)
  );

  // Generate Markdown
  let markdown = `# Benchmark Results - ${new Date().toLocaleString()}\n\n`;
  markdown += `**Target:** ${baseUrl}\n\n`;
  markdown += `| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error % |\n`;
  markdown += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  
  for (const res of results) {
    markdown += `| ${res.path} | ${res.method} | ${res.p50} | ${res.p95} | ${res.p99} | ${Math.round(res.rps)} | ${res.errorRate.toFixed(2)} |\n`;
  }

  fs.writeFileSync(path.join(resultsDir, `summary.md`), markdown);
  console.log(chalk.green(`\n✅ Results saved to benchmarks/results/`));

  if (hasRegression && process.env.FAIL_ON_REGRESSION === 'true') {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(chalk.red('Benchmark failed:'), err);
  process.exit(1);
});
