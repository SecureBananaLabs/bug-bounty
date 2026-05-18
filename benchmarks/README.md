# API Benchmark Suite

Measures p50, p95, p99 latency, RPS, error rate, and TTFB for all `/api/` endpoints.

## Setup

```bash
cd benchmarks
npm install
```

## Run

```bash
# From repo root
npm run benchmark

# Or directly
cd benchmarks && node benchmark.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BENCHMARK_URL` | `http://localhost:3000` | Target API base URL |
| `BENCHMARK_TOKEN` | `test-token` | Auth token for protected routes |
| `BENCHMARK_DURATION` | `10` | Seconds per endpoint |
| `BENCHMARK_CONNECTIONS` | `10` | Concurrent connections |

## Output

Console: per-endpoint p50/p95/p99/RPS/error-rate table  
File: `benchmarks/report-<timestamp>.json` (full results)

## Endpoints Benchmarked

- `GET /api/jobs` — public job listings
- `GET /api/jobs/search` — job search
- `GET /api/users/profile` — authenticated user profile
- `GET /api/notifications` — authenticated notifications
- `GET /api/messages` — authenticated messages
- `GET /api/proposals` — authenticated proposals
- `GET /api/reviews` — public reviews
- `POST /api/auth/login` — auth login (load test)
