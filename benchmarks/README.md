# API Benchmarks

This benchmark suite exercises `/health` and every mounted `/api/*` route in the Express API.
It records p50, p95, and p99 latency, p95 time to first byte, sustained RPS, one-second peak RPS, error rate, and response status counts for each endpoint.

## Run Locally

```bash
npm run benchmark
```

When `BENCHMARK_TARGET_URL` is not set, the runner starts the local Express app on an ephemeral loopback port and benchmarks that instance. Results are written to `benchmarks/results/` as JSON and Markdown.

For a CI-safe threshold gate:

```bash
npm run benchmark:smoke
```

## Configuration

Copy `benchmarks/.env.benchmark.example` values into your shell or CI environment when benchmarking a deployed target.

Important variables:

- `BENCHMARK_TARGET_URL`: benchmark an already running API instead of the local in-process app.
- `BENCHMARK_AUTH_TOKEN`: bearer token for protected routes when benchmarking staging.
- `BENCHMARK_ITERATIONS`: measured requests per endpoint.
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint.
- `BENCHMARK_WARMUP_ITERATIONS`: warmup requests per endpoint before measured requests.
- `BENCHMARK_OUTPUT_DIR`: report output directory.
- `BENCHMARK_THRESHOLDS_PATH`: JSON threshold config path.

The default full run uses five measured requests per endpoint, two-way concurrency, and one warmup request per endpoint. That keeps total local traffic below the development rate limiter while still covering the full route catalog.

## Route Coverage

The catalog currently covers:

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/oauth/github/callback`
- `POST /api/auth/refresh`
- `GET /api/users`
- `POST /api/users`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/proposals`
- `POST /api/proposals`
- `POST /api/payments`
- `GET /api/reviews`
- `POST /api/reviews`
- `GET /api/messages`
- `POST /api/messages`
- `GET /api/notifications`
- `POST /api/notifications`
- `POST /api/uploads`
- `GET /api/search`
- `GET /api/admin/metrics`

`/api/admin/metrics` is benchmarked with a dedicated benchmark admin JWT for local runs. For staging targets, provide `BENCHMARK_AUTH_TOKEN`.

## Thresholds

Thresholds live in `benchmarks/thresholds.json`. The smoke benchmark exits nonzero if an endpoint exceeds its configured `p99MaxMs` or `errorRateMax`.
