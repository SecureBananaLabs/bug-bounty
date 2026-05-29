import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '.env.benchmark');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  const lines = env.split('\n');
  lines.forEach(line => {
    if (line.trim() !== '' && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      process.env[key.trim()] = value.trim();
    }
  });
}

const config = {
  connections: process.env.BENCHMARK_CONNECTIONS ? parseInt(process.env.BENCHMARK_CONNECTIONS) : 10,
  duration: process.env.BENCHMARK_DURATION ? parseInt(process. env.BENCHMARK_DURATION) : 10,
  pipelining: process.env.BENCHMARK_PIPELINING ? parseInt(process.env.BENCHMARK_PIPELINING) : 1,
  timeout: process.env.BENCHMARK_TIMEOUT ? parseInt(process.env.BENCHMARK_TIMEOUT) : 10,
  headers: process.env.BENCHMARK_HEADERS ? JSON.parse(process.env.BENCHMARK_HEADERS) : {},
  renderStatus: process.env.BENCHMARK_RENDER_STATUS ? process.env.BENCHMARK_RENDER_STATUS === 'true' : true,
  renderLatency: process.env.BENCHMARK_RENDER_LATENCY ? process.env.BENCHMARK_RENDER_LATENCY === 'true' : true,
  renderThroughput: process.env.BENCHMARK_THROUGHPUT ? process.env.BENCHMARK_THROUGHPUT === 'true' : true,
  renderConcurrency: process.env.BENCHMARK_CONCURRENCY ? process.env.BENCHMARK_CONCURRENCY === 'true' : true,
  renderTimeout: process.env.BENCHMARK_TIMEOUT ? process.env.BENCHMARK_TIMEOUT === 'true' : true
};

export default config;

// Define benchmark configuration
const benchmarkConfig = {
  url: process.env.BENCHMARK_URL || 'http://localhost:3000',
  method: process.env.BENCHMARK_METHOD || 'GET',
  headers: process.env.BENCHMARK_HEADERS ? JSON.parse(process.env.BENCHMARK_HEADERS) : {},
  body: process.env.BENCHMARK_BODY || null,
  // Duration in seconds
  duration: config.duration,
  // Number of concurrent connections
  connections: config.connections,
  // HTTP pipelining
  pipelining: config.pipelining,
  // Request timeout in seconds
  timeout: config.timeout,
  // Render options
  renderStatus: config.renderStatus,
  renderLatency: config.renderLatency,
  renderThroughput: config.renderThroughput,
  renderConcurrency: config.renderConcurrency,
  renderTimeout: config.renderTimeout
};

// Run the benchmark
autocannon(benchmarkConfig, (err, result) => {
  if (err) {
    console.error('Benchmark failed:', err);
    process.exit(1);
  }
  
  // Write results to file
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(resultsDir, 'results.json'), JSON.stringify(result, null, 2));
  
  // Generate markdown summary
  const summary = `
  # API Benchmark Results
  
  ## Summary
  | Metric | Value |
  |--------|-------|
  | p50 Latency | ${result.latency.mean} |
  | p95 Latency | ${result.latency.p95} |
  | p99 Latency | ${result.latency.p99} |
  | Requests per second | ${result.requests.mean} |
  | Error rate | ${result.errors} |
  | TTFB | ${result.ttfb} |
  `;
  fs.writeFileSync(path.join(resultsDir, 'summary.md'), summary);
  
  console.log('Benchmark completed successfully');
  console.log(`Results written to ${resultsDir}`);
});