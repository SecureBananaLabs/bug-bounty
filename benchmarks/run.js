// Benchmark runner - measures API endpoint performance using autocannon
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
const { TARGET, ENDPOINTS, PROFILES } = require('./config');

const RESULT_DIR = path.join(__dirname, 'results');
if (!fs.existsSync(RESULT_DIR)) fs.mkdirSync(RESULT_DIR, { recursive: true });

const isCI = process.argv.includes('--ci');
const profileName = isCI ? 'smoke' : (process.env.BENCHMARK_PROFILE || 'light');
const profile = PROFILES[profileName] || PROFILES.light;

async function benchmarkEndpoint(endpoint) {
  const url = `${TARGET}${endpoint.path}`;
  const opts = {
    url,
    method: endpoint.method || 'GET',
    connections: profile.connections,
    duration: profile.duration,
    title: endpoint.path,
    headers: { 'Content-Type': 'application/json' },
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    bailout: isCI ? 3 : undefined,
  };

  return new Promise((resolve) => {
    autocannon(opts, (err, result) => {
      if (err) {
        resolve({ path: endpoint.path, error: err.message });
        return;
      }
      resolve({
        path: endpoint.path,
        method: endpoint.method || 'GET',
        latency_p50: result.latency.p50,
        latency_p95: result.latency.p95,
        latency_p99: result.latency.p99,
        requests_per_second: result.requests.average,
        error_rate_pct: (result.errors / Math.max(result.requests.total, 1)) * 100,
        throughput_bytes: result.throughput.average,
        duration_ms: result.duration,
        total_requests: result.requests.total,
        total_errors: result.errors,
        duration: result.duration,
      });
    });
  });
}

async function run() {
  console.log(`Benchmark profile: ${profile.title}`);
  console.log(`Target: ${TARGET}`);
  console.log(`Endpoints: ${ENDPOINTS.length}`);
  console.log('');

  const results = [];
  for (const ep of ENDPOINTS) {
    process.stdout.write(`  ${ep.method || 'GET'} ${ep.path}... `);
    const r = await benchmarkEndpoint(ep);
    results.push(r);
    if (r.error) {
      console.log(`ERROR: ${r.error}`);
    } else {
      console.log(`p50=${r.latency_p50.toFixed(0)}ms p95=${r.latency_p95.toFixed(0)}ms p99=${r.latency_p99.toFixed(0)}ms rps=${r.requests_per_second.toFixed(0)} err=${r.error_rate_pct.toFixed(2)}%`);
    }
  }

  // Generate report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const report = {
    timestamp: new Date().toISOString(),
    profile: profileName,
    target: TARGET,
    results,
    summary: {
      avg_p50: results.filter(r => !r.error).reduce((s, r) => s + r.latency_p50, 0) / results.filter(r => !r.error).length,
      avg_p95: results.filter(r => !r.error).reduce((s, r) => s + r.latency_p95, 0) / results.filter(r => !r.error).length,
      avg_p99: results.filter(r => !r.error).reduce((s, r) => s + r.latency_p99, 0) / results.filter(r => !r.error).length,
      total_rps: results.filter(r => !r.error).reduce((s, r) => s + r.requests_per_second, 0),
      avg_error_pct: results.filter(r => !r.error).reduce((s, r) => s + r.error_rate_pct, 0) / results.filter(r => !r.error).length,
    }
  };

  // Write JSON
  const jsonPath = path.join(RESULT_DIR, `benchmark-${profileName}-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\nJSON report: ${jsonPath}`);

  // Write markdown summary
  const mdPath = path.join(RESULT_DIR, `benchmark-${profileName}-${timestamp}.md`);
  let md = `# Benchmark Report: ${profile.title}\n\n`;
  md += `- **Date**: ${new Date().toISOString()}\n`;
  md += `- **Profile**: ${profileName}\n`;
  md += `- **Target**: ${TARGET}\n`;
  md += `- **Connections**: ${profile.connections}\n`;
  md += `- **Duration**: ${profile.duration}s\n\n`;
  md += '| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error % |\n';
  md += '|----------|--------|----------|----------|----------|-----|---------|\n';
  for (const r of results) {
    if (r.error) {
      md += `| ${r.path} | ${r.method} | ERROR | - | - | - | - |\n`;
    } else {
      md += `| ${r.path} | ${r.method} | ${r.latency_p50.toFixed(0)} | ${r.latency_p95.toFixed(0)} | ${r.latency_p99.toFixed(0)} | ${r.requests_per_second.toFixed(0)} | ${r.error_rate_pct.toFixed(2)}% |\n`;
    }
  }
  md += '\n### Summary\n\n';
  md += `- **Average p50**: ${report.summary.avg_p50.toFixed(0)}ms\n`;
  md += `- **Average p95**: ${report.summary.avg_p95.toFixed(0)}ms\n`;
  md += `- **Average p99**: ${report.summary.avg_p99.toFixed(0)}ms\n`;
  md += `- **Total throughput**: ${report.summary.total_rps.toFixed(0)} req/s\n`;
  md += `- **Average error rate**: ${report.summary.avg_error_pct.toFixed(2)}%\n`;
  fs.writeFileSync(mdPath, md);
  console.log(`Markdown report: ${mdPath}`);

  // Check thresholds
  const thresholds = require('./thresholds.json');
  const failed = [];
  for (const r of results) {
    if (r.error) continue;
    const p99Threshold = thresholds.p99_latency_ms[profileName] || 1000;
    const errThreshold = thresholds.error_rate_pct[profileName] || 1;
    if (r.latency_p99 > p99Threshold) {
      failed.push(\`\${r.path}: p99 \${r.latency_p99.toFixed(0)}ms > threshold \${p99Threshold}ms\`);
    }
    if (r.error_rate_pct > errThreshold) {
      failed.push(\`\${r.path}: error rate \${r.error_rate_pct.toFixed(2)}% > threshold \${errThreshold}%\`);
    }
  }
  if (failed.length > 0) {
    console.log('\nTHRESHOLD FAILURES:');
    failed.forEach(f => console.log(\`  [FAIL] \${f}\`));
    if (isCI) process.exit(1);
  } else {
    console.log('\nAll thresholds passed.');
  }
}

run().catch(console.error);
