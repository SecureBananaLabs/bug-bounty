import autocannon from 'autocannon';
import { writeFileSync, mkdirSync } from 'fs';
import { endpoints } from './endpoints.mjs';

const BASE_URL = process.env.BENCHMARK_BASE_URL || 'http://localhost:3001';
const IS_SMOKE = process.env.SMOKE === 'true';
const CONNECTIONS = IS_SMOKE ? 5 : 50;
const DURATION = IS_SMOKE ? 10 : 30;

const resultsDir = new URL('./results', import.meta.url).pathname;
mkdirSync(resultsDir, { recursive: true });
const report = { timestamp: new Date().toISOString(), baseUrl: BASE_URL, smoke: IS_SMOKE, endpoints: [] };

async function runEndpoint(ep) {
  return new Promise((resolve) => {
    const instance = autocannon({
      url: `${BASE_URL}${ep.path}`,
      method: ep.method,
      headers: ep.headers || {},
      body: ep.body,
      connections: CONNECTIONS,
      duration: DURATION,
      timeout: 10,
    });
    
    instance.on('done', (result) => {
      resolve({
        name: ep.name,
        p50: result.latency.p50,
        p95: result.latency.p95,
        p99: result.latency.p99,
        avgLatency: result.latency.average,
        rps: result.requests.average,
        errorRate: result.errors ? (result.errors / result.requests.total * 100).toFixed(1) : 0,
        ttfb: result.latency.p50, // autocannon p50 ~= TTFB
      });
    });
    
    autocannon.track(instance);
  });
}

async function main() {
  console.log(`Benchmarking ${endpoints.length} endpoints (${IS_SMOKE ? 'smoke' : 'full'})...`);
  console.log(`Target: ${BASE_URL}, Connections: ${CONNECTIONS}, Duration: ${DURATION}s\n`);

  for (const ep of endpoints) {
    process.stdout.write(`  ${ep.name}... `);
    const result = await runEndpoint(ep);
    report.endpoints.push(result);
    console.log(`p50=${result.p50}ms p99=${result.p99}ms rps=${result.rps.toFixed(1)} err=${result.errorRate}%`);
  }

  // Write JSON
  writeFileSync(`${resultsDir}/summary.json`, JSON.stringify(report, null, 2));

  // Write Markdown
  let md = `# API Benchmark Report\n\n`;
  md += `**Date:** ${report.timestamp}\n`;
  md += `**Mode:** ${IS_SMOKE ? 'Smoke' : 'Full'}\n`;
  md += `**Target:** ${report.baseUrl}\n`;
  md += `**Connections:** ${CONNECTIONS}, **Duration:** ${DURATION}s\n\n`;
  md += `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate |\n`;
  md += `|----------|---------|---------|---------|-----|------------|\n`;

  for (const ep of report.endpoints) {
    md += `| ${ep.name} | ${ep.p50} | ${ep.p95} | ${ep.p99} | ${ep.rps.toFixed(1)} | ${ep.errorRate}% |\n`;
  }

  writeFileSync(`${resultsDir}/summary.md`, md);
  console.log(`\nReports written to ${resultsDir}`);
}

main().catch(console.error);
