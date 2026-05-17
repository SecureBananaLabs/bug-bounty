# API Benchmarks

This directory contains a reproducible benchmark suite for every current route mounted under `/api`.

## Run

```bash
npm run benchmark
```

By default the runner starts the Express app on a random local port, benchmarks each endpoint, and writes results under `benchmarks/results/`.

To benchmark an already running local or staging API, set `BENCHMARK_BASE_URL`:

```bash
BENCHMARK_BASE_URL=http://127.0.0.1:4000 npm run benchmark
```

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` if you want to keep local benchmark settings:

```bash
BENCHMARK_BASE_URL=http://127.0.0.1:4000
BENCHMARK_DURATION_SECONDS=5
BENCHMARK_CONNECTIONS=10
BENCHMARK_PIPELINING=1
```

The runner also reads those values directly from the shell environment.
Local benchmark runs set `BENCHMARK_MODE=true` so the API rate limiter does not turn the performance suite into rate-limit noise. Do not set this flag in production.

## Output

The suite writes:

- `benchmarks/results/api-benchmark-results.json` for machine-readable regression tracking
- `benchmarks/results/api-benchmark-summary.md` for a human-readable report

Each endpoint report includes:

- p50, p95, and p99 latency in milliseconds
- average and peak requests per second
- error rate percentage, including HTTP 4xx/5xx responses
- time to first byte in milliseconds
- response status code distribution

## Endpoint Coverage

The endpoint inventory lives in `api-endpoints.js`. It currently covers:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/oauth/:provider/callback`
- `/api/auth/refresh`
- `/api/users`
- `/api/jobs`
- `/api/proposals`
- `/api/payments`
- `/api/reviews`
- `/api/messages`
- `/api/notifications`
- `/api/uploads`
- `/api/search`
- `/api/admin/metrics`

The admin route uses a benchmark login token so authenticated routes are exercised with realistic headers.
