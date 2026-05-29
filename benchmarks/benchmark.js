import autocannon from 'autocannon';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createApp } from '../apps/api/src/app.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the Express app to get the list of routes
const app = createApp();
const endpoints = [];

// Dynamically discover routes under /api/
app._router.stack.forEach((layer) => {
  if (layer.route && layer.route.path.includes('/api/')) {
    endpoints.push(layer.route.path);
  }
});

// Read thresholds from file
let thresholds;
try {
  thresholds = JSON.parse(readFileSync(__dirname + '/thresholds.json', 'utf8'));
} catch (err) {
  console.error('Failed to load thresholds:', err.message);
  process.exit(1);
}

// Function to run benchmark for a single endpoint
async function benchmarkEndpoint(url) {
  const result = await autocannon({
    url,
    ...thresholds
  });
  
  return result;
}

// Run all benchmarks
async function runAllBenchmarks() {
  const results = {};
  for (const endpoint of endpoints) {
    console.log(`Benchmarking ${endpoint}...`);
    results[endpoint] = await benchmarkEndpoint(endpoint);
  }
  return results;
}

// Save results to file
function saveResults(results) {
  writeFileSync(
    __dirname + '/results/results.json',
    JSON.stringify(results, null, 2),
    'utf8'
  );
}

export { runAllBbenmarksmarks, saveResults };