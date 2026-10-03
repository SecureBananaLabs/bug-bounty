const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const runBenchmarks = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const results = [];
  
  for (const endpoint of config.endpoints) {
    console.log(`Running benchmark for ${endpoint.path}...`);
    
    const result = await autocannon({
      url: `${config.server}${endpoint.path}`,
      method: endpoint.method,
      headers: endpoint.headers,
      body: endpoint.body,
      connections: endpoint.connections || config.default.connections,
      duration: endpoint.duration || config.default.duration,
      timeout: endpoint.timeout || config.default.timeout,
    });
    
    results.push({
      endpoint: endpoint.path,
      method: endpoint.method,
      ...result,
    });
    
    // Save individual result
    const fileName = `${endpoint.path.replace(/\//g, '-')}-${timestamp}.json`;
    fs.writeFileSync(
      path.join(resultsDir, fileName),
      JSON.stringify(result, null, 2)
    );
  }
  
  // Save summary
  fs.writeFileSync(
    path.join(resultsDir, `summary-${timestamp}.json`),
    JSON.stringify(results, null, 2)
  );
  
  // Generate markdown report
  generateMarkdownReport(results, timestamp);
};

const generateMarkdownReport = (results, timestamp) => {
  const report = `# Benchmark Results - ${timestamp}\n\n`;
  
  results.forEach(result => {
    report += `## ${result.method} ${result.endpoint}\n\n`;
    report += `### Metrics\n\n`;
    report += `- **p50 Latency**: ${result.latency.p50} ms\n`;
    report += `- **p95 Latency**: ${result.latency.p95} ms\n`;
    report += `- **p99 Latency**: ${result.latency.p99} ms\n`;
    report += `- **Requests per Second**: ${result.requests.average}\n`;
    report += `- **Error Rate**: ${result.errors.rate}%\n`;
    report += `- **Time to First Byte (TTFB)**: ${result.latency.firstByte} ms\n\n`;
    
    if (result.errors.rate > config.thresholds.errorRate) {
      report += `⚠️  Error rate exceeds threshold of ${config.thresholds.errorRate}%\n\n`;
    }
    
    if (result.latency.p99 > config.thresholds.p99Latency) {
      report += `⚠️  p99 latency exceeds threshold of ${config.thresholds.p99Latency}ms\n\n`;
    }
  });
  
  fs.writeFileSync(
    path.join(resultsDir, `report-${timestamp}.md`),
    report
  );
};

if (require.main === module) {
  runBenchmarks().catch(console.error);
}

module.exports = { runBenchmarks };