import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  url: process.env.BENCHMARK_TARGET || 'http://localhost:3000',
  duration: 10,
  connections: 10,
  pipelining: 1,
  timeout: 10
};

// Results storage
const resultsDir = path.join(__dirname, 'results');
const resultsFile = path.join(resultsDir, 'benchmark-results.json');

// Thresholds
const thresholdsFile = path.join(__dirname, 'thresholds.json');

// Run benchmark
async function runBenchmark() {
  const results = await autocannon(config);
  
  // Process results
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }
  
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  // Generate markdown
  const summary = `
    # Benchmark Results
    
    ## Summary
    | Metric | Value |
    |--------|-------|
    | p50 Latency | ${results.latency.mean} ms |
    | p95 Latency | ${results.latency["95"]) } ms |
    | p99 Latency | ${results.latency["99"]) } ms |
    | Requests Per Second | ${results.requests.average} |
    | Error Rate | ${results.errors} |
    | TTFB | ${results.latency.mean} ms |
  `;
  
  // Save summary
  const summaryFile = path.join(__dirname, 'results', 'summary.md');
  fs.writeFileSync(summaryFile, summary);
  
  console.log('Benchmark completed');
}

runBenchmark().catch(console.error);