import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.benchmark');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

const TARGET_HOST = process.env.BENCHMARK_HOST || 'http://localhost:3001';
const RESULTS_DIR = path.resolve(__dirname, 'results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// API endpoints to benchmark (based on routes in apps/api/src/app.js)
const endpoints = [
  { method: 'GET', path: '/health' },
  { method: 'POST', path: '/api/auth/register' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'GET', path: '/api/users' },
  { method: 'GET', path: '/api/users/1' },
  { method: 'PUT', path: '/api/users/1' },
  { method: 'GET', path: '/api/jobs' },
  { method: 'POST', path: '/api/jobs' },
  { method: 'GET', path: '/api/jobs/1' },
  { method: 'PUT', path: '/api/jobs/1' },
  { method: 'DELETE', path: '/api/jobs/1' },
  { method: 'GET', path: '/api/proposals' },
  { method: 'POST', path: '/api/proposals' },
  { method: 'GET', path: '/api/proposals/1' },
  // Add more endpoints as needed
];

// Benchmark configuration
const defaultOptions = {
  url: TARGET_HOST,
  connections: 100,
  pipelining: 10,
  duration: 30,
  timeout: 10
};

// Run benchmark for a single endpoint
async function benchmarkEndpoint(endpoint) {
  const options = {
    ...defaultOptions,
    method: endpoint.method,
    path: endpoint.path
  };

  return new Promise((resolve, reject) => {
    const instance = autocannon(options, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          ...result
        });
      }
    });
    
    autocannon.track(instance, {renderResultsTable: false, renderLatencyTable: true});
  });
}

// Calculate error rate
function calculateErrorRate(result) {
  const totalRequests = result.requests.total;
  const errors = result.errors;
  let errorCount = 0;
  
  if (typeof errors === 'object') {
    errorCount = Object.values(errors).reduce((sum, count) => sum + count, 0);
  }
  
  return totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
}

// Format results for output
function formatResults(results) {
  return results.map(result => ({
    endpoint: result.endpoint,
    p50: result.latency.percentiles['50'],
    p95: result.latency.percentiles['95'],
    p99: result.latency.percentiles['99'],
    rps: result.requests.average,
    errorRate: calculateErrorRate(result),
    ttbf: result.latency.average, // Using average latency as proxy for TTFB
  }));
}

// Save results to JSON file
function saveResultsToJson(results) {
  const filePath = path.join(RESULTS_DIR, 'benchmark-results.json');
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${filePath}`);
}

// Generate markdown summary
function generateMarkdownSummary(results) {
  let markdown = '# Benchmark Results\n\n';
  markdown += '| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate (%) | TTFB (ms) |\n';
  markdown += '|----------|----------|----------|----------|-----|----------------|-----------|\n';
  
  results.forEach(result => {
    markdown += `| ${result.endpoint} | ${result.p50.toFixed(2)} | ${result.p95.toFixed(2)} | ${result.p99.toFixed(2)} | ${result.rps.toFixed(2)} | ${result.errorRate.toFixed(2)} | ${result.ttbf.toFixed(2)} |\n`;
  });
  
  const filePath = path.join(RESULTS_DIR, 'benchmark-results.md');
  fs.writeFileSync(filePath, markdown);
  console.log(`Markdown summary saved to ${filePath}`);
}

// Main benchmark function
async function runBenchmark() {
  console.log(`Starting benchmark against ${TARGET_HOST}`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Benchmarking ${endpoint.method} ${endpoint.path}...`);
      const result = await benchmarkEndpoint(endpoint);
      results.push(result);
    } catch (error) {
      console.error(`Error benchmarking ${endpoint.method} ${endpoint.path}:`, error.message);
    }
  }
  
  const formattedResults = formatResults(results);
  saveResultsToJson(formattedResults);
  generateMarkdownSummary(formattedResults);
  
  console.log('Benchmark completed.');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmark().catch(console.error);
}

export default runBenchmark;