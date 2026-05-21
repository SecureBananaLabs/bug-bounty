# API Benchmark Suite

Benchmark suite for all `/api/` endpoints using [k6](https://k6.io).

## Quick Start

```bash
# Install k6 (one-time)
# macOS: brew install k6
# Linux: https://k6.io/docs/get-started/installation/
# Docker: docker pull grafana/k6

# Run full benchmark suite
npm run benchmark

# Run a single benchmark
npm run benchmark:auth
npm run benchmark:jobs
npm run benchmark:payments
```

## Setup

1. Copy `.env.benchmark.example` to `.env.benchmark`
2. Set `BENCHMARK_HOST` to your target (default: `http://localhost:3000`)
3. Set `BENCHMARK_TOKEN` (for auth-protected routes)

## Metrics Captured

Per endpoint:
- p50, p95, p99 latency (ms)
- Requests per second (peak & sustained)
- Error rate (%)
- Time to first byte (TTFB)

## Output

Results are written to `benchmarks/results/` as JSON + markdown summary.

## CI Regression Gate

PRs run a smoke benchmark in CI. PR fails if p99 > thresholds in `thresholds.json`.
