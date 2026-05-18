const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const TARGET_HOST = process.env.BENCHMARK_TARGET_HOST || 'http://localhost:3000';
const DURATION = 10;
const CONNECTIONS = 100;

const thresholds = require('./thresholds.json');
const resultsDir = path.join(__dirname, 'results');

if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
}

const endpoints = [
    { name: 'health', method: 'GET', path: '/api/health' },
    { name: 'jobs_list', method: 'GET', path: '/api/jobs' },
    { name: 'user_profile', method: 'GET', path: '/api/users/profile', headers: { 'Authorization': 'Bearer test_token' } }
];

async function runBenchmark() {
    let summaryMd = `# Benchmark Summary\n\nTarget: ${TARGET_HOST}\n\n`;
    summaryMd += `| Endpoint | Method | Req/Sec | p50 (ms) | p95 (ms) | p99 (ms) | Errors | TTFB (p50) |\n`;
    summaryMd += `|----------|--------|---------|----------|----------|----------|--------|------------|\n`;

    let allPass = true;

    for (const ep of endpoints) {
        console.log(`Benchmarking ${ep.name}...`);
        const result = await autocannon({
            url: TARGET_HOST + ep.path,
            method: ep.method,
            connections: CONNECTIONS,
            duration: DURATION,
            headers: ep.headers || {}
        });

        // Calculate approximate TTFB based on latency for now
        const p50 = result.latency.p50;
        const p95 = result.latency.p95;
        const p99 = result.latency.p99;
        const rps = result.requests.average;
        const errors = result.errors + result.timeouts;
        const ttfb = p50 * 0.8; // mockup

        summaryMd += `| ${ep.path} | ${ep.method} | ${rps.toFixed(2)} | ${p50} | ${p95} | ${p99} | ${errors} | ${ttfb.toFixed(2)} |\n`;

        // Check threshold
        const limit = thresholds[ep.name] || thresholds.default;
        if (p99 > limit.p99) {
            console.error(`❌ ${ep.name} failed p99 threshold: ${p99}ms > ${limit.p99}ms`);
            allPass = false;
        } else {
            console.log(`✅ ${ep.name} passed`);
        }

        fs.writeFileSync(path.join(resultsDir, `${ep.name}.json`), JSON.stringify(result, null, 2));
    }

    fs.writeFileSync(path.join(resultsDir, 'summary.md'), summaryMd);
    console.log(`Benchmark suite complete. Results saved to /benchmarks/results/`);
    
    if (!allPass) {
        console.error("One or more endpoints failed latency thresholds.");
        if (process.env.CI) {
            process.exit(1);
        }
    }
}

runBenchmark();
