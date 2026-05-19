# API Benchmark Suite

Performance benchmark for all FreelanceFlow API endpoints under `/api/`.

## Quick Start

```bash
# 1. Install dependencies
npm install -w benchmarks

# 2. Configure target
cp benchmarks/.env.benchmark benchmarks/.env
# Edit benchmarks/.env — set BENCHMARK_HOST to your running server

# 3. Run benchmark
npm run benchmark -w benchmarks
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run benchmark -w benchmarks` | Full benchmark against all endpoints |
| `npm run benchmark:smoke -w benchmarks` | Smoke test (low concurrency, short duration) for CI |

## Configuration

Copy `.env.benchmark` to `.env` and edit:

| Variable | Default | Description |
|----------|---------|-------------|
| `BENCHMARK_HOST` | `http://localhost:4000` | Target API server |
| `JWT_SECRET` | `development-secret` | Must match server for auth-protected endpoints |
| `BENCHMARK_DURATION` | `10` | Seconds per endpoint (full mode) |
| `BENCHMARK_CONNECTIONS` | `10` | Concurrent connections (full mode) |
| `SMOKE_DURATION` | `3` | Seconds per endpoint (smoke mode) |
| `SMOKE_CONNECTIONS` | `2` | Concurrent connections (smoke mode) |

## Output

Results are saved to `benchmarks/results/`:

- `benchmark-full-<timestamp>.json` — Machine-readable JSON with all metrics
- `benchmark-full-<timestamp>.md` — Human-readable Markdown summary

## Regression Gate

CI runs a smoke benchmark on every PR. If any endpoint's p99 latency exceeds the threshold defined in `thresholds.json`, the CI pipeline fails.

Thresholds are reviewable and should be updated as the application evolves.
