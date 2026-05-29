import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(importMeta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.benchmark');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const baseUrl = process.env.BENCHMARK_BASE_URL || 'http://localhost:3000';
const token = process.env.BENCHMARK_AUTH_TOKEN || 'test-token';

const endpoints = [
  { path: '/api/auth/login', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'password' }) },
  { path: '/api/jobs', method: 'GET' },
  { path: '/api/jobs', method: 'POST', body: JSON.stringify({ title: 'Test Job', description: 'Test Description' }) },
  { path: '/api/users/profile', method: 'GET' },
  { path: '/api/proposals', method: 'POST', body: JSON.stringify({ jobId: 1, content: 'Test proposal' }) },
  { path: '/api/search/jobs', method: 'GET', query: 'q=test' }
];

const thresholds = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'thresholds.json'), 'utf8'));

async function runBenchmark() {
  const results = [];
  
  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint.path}${endpoint.query ? '?' + endpoint.query : ''}`;
    
    const requestOptions = {
      url,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      connections: 10,
      pipelining: 1,
      duration: 10,
      ...(endpoint.body && { body: endpoint.body })
    };
    
    const result = await autocannon(requestOptions);
    
    const endpointKey = endpoint.path;
    const threshold = thresholds.endpoints[endpointKey];
    
    results.push({
      endpoint: endpoint.path,
      method: endpoint.method,
      requests: {
        average: result.requests.average,
        mean: result.requests.mean,
        total: result.requests.total
      },
      latency: {
        average: result.latency.average,
        mean: result.latency.mean,
        p50: result.latency.percentiles['50'],
        p95: result.latency.percentiles['95'],
        p99: result.latency.percentiles['99'],
        max: result.latency.max
      },
      throughput: {
        average: result.throughput.average
      },
      errors: {
        errors: result.errors,
        timeouts: result.timeouts,
        disconnects: result.disconnects
      },
      threshold: threshold ? {
        p99Latency: threshold.p99Latency,
        exceeded: result.latency.percentiles['99'] > threshold.p99Latency
      } : null
    });
  }
  
  // Save results
  const resultsDir = path.resolve(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(
    path.join(resultsDir, `benchmark-results-${timestamp}.json`),
    JSON.stringify(results, null, 2)
  );
  
  // Generate markdown report
  generateMarkdownReport(results, timestamp);
  
  // Check thresholds for CI
  const exceededThresholds = results.filter(r => r.threshold?.exceeded);
  if (exceededThresholds.length > 0) {
    console.error('Thresholds exceeded:');
    exceededThresholds.forEach(r => console.error(`${r.endpoint}: p99 ${r.latency.p99}ms > ${r.threshold.p99Latency}ms`));
    process.exit(1);
  }
}

function generateMarkdownReport(results, timestamp) {
  let markdown = `# Benchmark Results - ${timestamp}\n\n`;
  markdown += '| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate (%) |\n';
  markdown += '|----------|--------|----------|----------|----------|-----|----------------|\n';
  
  results.forEach(result => {
    const errorRate = ((result.errors.errors + result.errors.timeouts + result.errors.disconnects) / result.requests.total) * 100;
    markdown += `| ${result.endpoint} | ${result.method} | ${result.latency.p50} | ${result.latency.p95} | ${result.latency.p99} | ${result.throughput.average.toFixed(2)} | ${errorRate.toFixed(2)} |\n`;
  });
  
  fs.writeFileSync(
    path.join(__dirname, 'results', `benchmark-report-${timestamp}.md`),
    markdown
  );
  
  console.log(`Markdown report saved to results/benchmark-report-${timestamp}.md`);
}

runBenchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});