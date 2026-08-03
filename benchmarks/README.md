# API Benchmark Suite

Comprehensive latency and throughput benchmarks for all platform API endpoints.

## Quick Start

```bash
# Smoke test (CI, low concurrency)
SMOKE=true node benchmarks/run-benchmark.mjs

# Full benchmark
node benchmarks/run-benchmark.mjs
```

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` and set:
- `BENCHMARK_BASE_URL`: Target API server
- `BENCHMARK_TOKEN`: Valid JWT for auth-protected routes
- `BENCHMARK_ADMIN_TOKEN`: Admin JWT for admin routes

## Metrics

Per endpoint: p50, p95, p99 latency (ms), RPS, error rate (%), TTFB

## Output

Results written to `benchmarks/results/`:
- `summary.json` — Machine-readable results
- `summary.md` — Human-readable markdown report
