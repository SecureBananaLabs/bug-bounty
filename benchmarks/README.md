# API Benchmark Suite

Reproducible load-testing of all `GET /api/*` and `POST /api/*` endpoints using [autocannon](https://github.com/mcollina/autocannon).

## Quick Start

```bash
# Install autocannon
npm install --save-dev autocannon

# Copy and configure environment
cp benchmarks/.env.benchmark.example benchmarks/.env.benchmark
# Edit benchmarks/.env.benchmark → set API_BASE_URL

# Run full benchmark
npm run benchmark

# Run CI smoke test
npm run benchmark:ci
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:3000` | Target server |
| `BENCHMARK_TOKEN` | *(empty)* | Auth token for protected endpoints |
| `CONCURRENCY` | `10` | Parallel workers for full run |
| `DURATION` | `30` | Test duration in seconds |
| `CI_CONCURRENCY` | `2` | Workers for CI smoke test |
| `CI_DURATION` | `10` | Duration for CI smoke test |

## Endpoints Tested

All `GET` and `POST` endpoints under `/api/` plus the root route:

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/jobs`, `POST /api/jobs`
- `GET /api/proposals`, `POST /api/proposals`
- `POST /api/payments`
- `GET /api/reviews`, `POST /api/reviews`
- `GET /api/messages`, `POST /api/messages`
- `GET /api/notifications`
- `GET /api/search?q=dev`
- `GET /api/users`
- `GET /api/admin/metrics` (auth-protected)
- `GET /` (root)

## Output

Results saved to `benchmarks/results/` as:
- `benchmark-<timestamp>.json` — machine-readable
- `benchmark-<timestamp>.md` — human-readable markdown table

## Thresholds

Defined in `benchmarks/thresholds.json`. CI fails if:
- Any endpoint p99 latency > threshold
- Any endpoint error rate > threshold

Default: p99 < 500ms, errors < 5%

## Adding New Endpoints

Edit `benchmarks/benchmark.js` → `ENDPOINTS` array.
