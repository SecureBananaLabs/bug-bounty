const fs = require('fs');
const path = require('path');

const analyzeResults = (resultsDir = path.join(__dirname, 'results')) => {
  const files = fs.readdirSync(resultsDir);
  const jsonFiles = files.filter(f => f.endsWith('.json') && f.startsWith('summary-'));
  
  if (jsonFiles.length === 0) {
    console.log('No benchmark results found');
    return;
  }
  
  const latestFile = jsonFiles.sort().pop();
  const results = JSON.parse(fs.readFileSync(path.join(resultsDir, latestFile)));
  
  console.log('\n=== BENCHMARK ANALYSIS ===\n');
  
  results.forEach(result => {
    console.log(`Endpoint: ${result.method} ${result.endpoint}`);
    console.log(`p50 Latency: ${result.latency.p50} ms`);
    console.log(`p95 Latency: ${result.latency.p95} ms`);
    console.log(`p99 Latency: ${result.latency.p99} ms`);
    console.log(`Requests/sec: ${result.requests.average}`);
    console.log(`Error Rate: ${result.errors.rate}%`);
    console.log(`TTFB: ${result.latency.firstByte} ms`);
    console.log('------------------------');
  });
};

if (require.main === module) {
  analyzeResults();
}

module.exports = { analyzeResults };