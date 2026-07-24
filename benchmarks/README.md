# API Benchmark Suite

This directory contains the benchmark suite for the FreelanceFlow API.

## Quick Start

```bash
# 1. Copy and configure the environment file
cp .env.benchmark.example .env.benchmark
# Edit .env.benchmark with your target host and auth tokens

# 2. Install dependencies (from repo root)
npm install

# 3. Run the full benchmark suite
npm run benchmark
```

## What It Measures

For every `/api/*` endpoint:

| Metric | Description |
|--------|-------------|
| p50 latency | Median response time (ms) |
| p95 latency | 95th percentile response time (ms) |
| p99 latency | 99th percentile response time (ms) — used for CI gate |
| RPS | Sustained requests per second |
| Error rate | % of requests that returned an error |
| TTFB p95 | Time to first byte at 95th percentile (ms) |

## Output

Results are written to `benchmarks/results/` as:
- `benchmark-<timestamp>.json` — full machine-readable results
- `benchmark-<timestamp>.md` — human-readable markdown summary

## CI Smoke Gate

The CI workflow runs a low-concurrency smoke benchmark (`BENCHMARK_CONNECTIONS=2`, `BENCHMARK_DURATION=5`) and fails if any endpoint's p99 latency exceeds the threshold defined in `thresholds.json`.

## Thresholds

Edit `benchmarks/thresholds.json` to adjust per-endpoint p99 thresholds.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BENCHMARK_HOST` | `http://localhost:3000` | Target API host |
| `BENCHMARK_DURATION` | `10` | Seconds per endpoint |
| `BENCHMARK_CONNECTIONS` | `10` | Concurrent connections |
| `BENCHMARK_AUTH_TOKEN` | — | JWT for authenticated routes |
| `BENCHMARK_ADMIN_TOKEN` | — | JWT for admin routes |
| `BENCHMARK_RESULTS_DIR` | `benchmarks/results` | Output directory |
