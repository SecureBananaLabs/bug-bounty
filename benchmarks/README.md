# 🚀 API Performance Benchmark Suite

> Resolves [#30](https://github.com/SecureBananaLabs/bug-bounty/issues/30) — $750 USD

## Overview
Automated latency (p50, p95, p99), throughput (RPS), TTFB, and error rate benchmark suite powered by `autocannon`.

## Quickstart

```bash
# 1. Install dependencies
cd benchmarks && npm install && cd ..

# 2. Configure target host
cp .env.benchmark .env.benchmark.local

# 3. Run benchmarks
npm run benchmark
# or directly:
node benchmarks/run.js
```

## Metrics Captured
- **Latency Distribution:** p50, p95, p99 percentiles in milliseconds
- **Throughput:** Requests per second (RPS) and bytes per second
- **Error Rates:** Non-2xx HTTP responses, network errors, timeouts
- **TTFB:** Time-to-first-byte under concurrency load

## Output Artifacts
- `benchmarks/benchmark-report.json`: Machine-readable results for CI regression gating
- `benchmarks/benchmark-report.md`: Markdown summary table
