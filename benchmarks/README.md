# API Benchmark Suite

Benchmark all `/api/*` endpoints using [autocannon](https://github.com/mcollina/autocannon).

## Quick Start

```bash
# Install
npm install

# Run full benchmark (15s, 20 connections)
npm run benchmark

# Quick smoke test (5s, 5 connections)
npm run benchmark:quick
```

## Configuration

Copy `.env.benchmark.template` to `.env.benchmark` and adjust:

| Variable | Default | Description |
|----------|---------|-------------|
| `BENCHMARK_HOST` | `http://localhost:3000` | Target server URL |
| `BENCHMARK_DURATION` | `15` | Test duration in seconds |
| `BENCHMARK_CONNECTIONS` | `20` | Concurrent connections |
| `BENCHMARK_TOKEN` | `bench-token` | Auth token for protected routes |

## Output

Results are saved to `benchmarks/results/` as:
- `benchmark-{timestamp}.json` — full raw data
- `benchmark-{timestamp}.md` — human-readable summary
- `latest.md` — always points to latest run

## Regression Gate

Thresholds in `thresholds.json` are checked. CI smoke test fails if p99 > 5000ms or error rate > 5%.
