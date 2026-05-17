import { readFileSync, existsSync } from 'fs';

const resultsPath = new URL('./results/summary.json', import.meta.url).pathname;
if (!existsSync(resultsPath)) {
  console.log('No benchmark results found. Skipping threshold check.');
  process.exit(0);
}

const results = JSON.parse(readFileSync(resultsPath, 'utf-8'));
const thresholdsPath = new URL('./thresholds.json', import.meta.url).pathname;
const thresholds = JSON.parse(readFileSync(thresholdsPath, 'utf-8'));

let failed = false;
for (const ep of results.endpoints || []) {
  const defaultThreshold = thresholds.p99_latency_ms?._default || 1000;
  const threshold = thresholds.p99_latency_ms?.[ep.name] || defaultThreshold;
  if (ep.p99 > threshold) {
    console.error(`THRESHOLD EXCEEDED: ${ep.name} p99=${ep.p99}ms > ${threshold}ms`);
    failed = true;
  }
  if (ep.errorRate > (thresholds.error_rate_percent || 5)) {
    console.error(`ERROR RATE EXCEEDED: ${ep.name} ${ep.errorRate}% > ${thresholds.error_rate_percent || 5}%`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('All thresholds passed.');
