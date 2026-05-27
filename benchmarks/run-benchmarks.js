import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const BENCHMARK_TOKEN = process.env.BENCHMARK_TOKEN;
const REPORT_DIR = path.resolve('benchmarks/results');

// Ensure the results directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const endpoints = [
  { path: '/api/auth/register', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'password123' }) },
  { path: '/api/auth/login', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'password123' }) },
  { path: '/api/users', method: 'GET' },
  { path: '/api/jobs', method: 'GET' },
  { path: '/api/jobs', method: 'POST', body: JSON.stringify({ title: 'Test Job', description: 'This is a test job', budget: 100 }) },
  { path: '/api/proposals', method: 'GET' },
  { path: '/api/proposals', method: 'POST', body: JSON.stringify({ jobId: 1, coverLetter: 'I am very interested in this job' }) },
  // ... add more endpoints as needed
];

// Benchmark configuration
const config = {
  url: API_BASE_URL,
  pipelining: 1,
  duration: 10,
  connections: 10,
  headers: {
    'Authorization': BENCHMARK_TOKEN ? `Bearer ${BENCHMARK_TOKEN}` : undefined
  }
};

// Run the benchmark against each endpoint
async function runBenchmark() {
  const results = [];

  for (const endpoint of endpoints) {
    const endpointConfig = {
      ...config,
      ...endpoint
    };

    try {
      const result = await new Promise((resolve, _) => {
        autocannon(endpointConfig, (err, results) => {
          if (err) {
            console.error('Bench error: ', err);
            resolve({});
          } else {
            console.log('Bench completed');
            resolve(results);
          }
        });
      });
      results.push(result);
    } catch (error) {
      console.error('Error running benchmark:', error);
    }
  }

  // Process results and save to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFilePath = path.join(REPORT_DIR, `results-${timestamp}.json`);
  fs.writeFileSync(resultsFilePath, JSON.stringify(results, null, 2));

  // Generate markdown summary
  let summary = `# Benchmark Results - ${timestamp}\n\n`;
  summary += `## Summary\n\n`;
  
  results.forEach((result, index) => {
    const endpoint = endpoints[index].path;
    summary += `### ${endpoint}\n`;
    summary += `Latency (ms): p50: ${result.latency.percentiles[50]}, p95: ${result.latency.percentiles[95]}, p99: ${result.latency.percentiles[99]}\n`;
    summary += `Requests per second: ${result.requests.mean}\n`;
    summary += `Error rate: ${result.errors.stat ? (result.errors.total / result.requests.total * 100).toFixed(2) + '%' : 'N/A'}\n\n`;
  });
  
  const summaryPath = path.join(REPORT_DIR, 'summary.md');
  fs.writeFileSync(summaryPath, summary);
  console.log(`Benchmark summary saved to ${summaryPath}`);
}

runBenchmark();