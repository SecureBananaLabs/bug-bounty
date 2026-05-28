import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(importMeta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.benchmark');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  const envVars = envConfig.split('\n').filter(line => line.includes('='));
  envVars.forEach(envVar => {
    const [key, value] = envVar.split('=');
    process.env[key.trim()] = value.trim();
  });
}

const baseUrl = process.env.BENCHMARK_BASE_URL || 'http://localhost:3000';
const token = process.env.BENCHMARK_TOKEN || 'test-token';

const endpoints = [
  { path: '/api/auth/login', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'password' }) },
  { path: '/api/jobs', method: 'GET' },
  { path: '/api/jobs', method: 'POST', body: JSON.stringify({ title: 'Test Job', description: 'Test Description' }) },
  { path: '/api/users/profile', method: 'GET' },
  { path: '/api/proposals', method: 'POST', body: JSON.stringify({ jobId: 1, content: 'Test Proposal' }) },
  { path: '/api/search/jobs?query=test', method: 'GET' },
];

const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

async function runBenchmark(endpoint) {
  const url = `${baseUrl}${endpoint.path}`;
  const headers = endpoint.path.includes('/api/') && !endpoint.path.includes('/auth/') 
    ? { 'Authorization': `Bearer ${token}` } 
    : {};

  const instance = autocannon({
    url,
    method: endpoint.method,
    headers,
    body: endpoint.body,
    connections: 10,
    pipelining: 1,
    duration: 10,
    requests: [
      {
        method: endpoint.method,
        path: endpoint.path,
        headers,
        body: endpoint.body
      }
    ]
  }, (err, results) => {
    if (err) {
      console.error(`Error benchmarking ${endpoint.path}:`, err);
      return;
    }
    
    saveResults(endpoint.path, results);
    checkThresholds(endpoint.path, results);
  });

  autocannon.track(instance, { renderResultsTable: false });
  return new Promise((resolve) => {
    instance.on('done', (result) => {
      resolve(result);
    });
  });
}

function saveResults(endpointPath, results) {
  const fileName = endpointPath.replace(/\//g, '_');
  const jsonPath = path.join(resultsDir, `${fileName}.json`);
  const markdownPath = path.join(resultsDir, `${fileName}.md`);
  
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  fs.writeFileSync(markdownPath, generateMarkdownReport(endpointPath, results));
}

function generateMarkdownReport(endpointPath, results) {
  return `# Benchmark Results: ${endpointPath}

| Metric | Value |
|--------|-------|
| p50 Latency (ms) | ${results.latency.p50} |
| p95 Latency (ms) | ${results.latency.p95} |
| p99 Latency (ms) | ${results.latency.p99} |
| Requests per Second | ${results.requests.average} |
| Error Rate (%) | ${((results.errors / results.requests.total) * 100).toFixed(2)} |
| TTFB (ms) | ${results.latency.total} |
`;
}

function checkThresholds(endpointPath, results) {
  const thresholdsPath = path.join(__dirname, 'thresholds.json');
  if (!fs.existsSync(thresholdsPath)) return;
  
  const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, 'utf-8'));
  const endpointThreshold = thresholds.endpoints[endpointPath];
  
  if (endpointThreshold && results.latency.p99 > endpointThreshold.p99Latency) {
    console.error(`❌ FAILED: ${endpointPath} exceeded p99 latency threshold (${results.latency.p99}ms > ${endpointThreshold.p99Latency}ms)`);
    process.exit(1);
  }
}

async function runAllBenchmarks() {
  for (const endpoint of endpoints) {
    await runBenchmark(endpoint);
  }
  console.log('✅ All benchmarks completed');
}

runAllBenchmarks();