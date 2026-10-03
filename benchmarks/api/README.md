# API Benchmark Suite

This benchmark suite exercises every current `/api/*` route in the Express API and records latency, throughput, error rate, and TTFB metrics.

By default the runner starts the API app on a random local port, runs the benchmark, writes reports, and shuts the server down. You can also point it at an already running API server with `--base-url`.

## Run

```bash
npm run benchmark:api
```

The default run sends a small request set to avoid tripping the API rate limiter during local smoke tests:

```bash
node benchmarks/api/benchmark.mjs --requests-per-endpoint 6 --concurrency 2
```

For a larger run against a deployed or locally tuned server:

```bash
node benchmarks/api/benchmark.mjs \
  --base-url http://127.0.0.1:4000 \
  --requests-per-endpoint 100 \
  --concurrency 10 \
  --output benchmarks/api/results/staging.json \
  --markdown benchmarks/api/results/staging.md
```

## Covered Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/oauth/:provider/callback`
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

## Metrics

Each endpoint report includes:

- request count
- status-code distribution
- error rate
- sustained and peak requests per second
- p50, p95, p99, and max latency
- p50, p95, p99, and max TTFB
- up to three sample errors for failed requests

Reports are written to:

- `benchmarks/results/api-latest.json`
- `benchmarks/results/api-latest.md`

## Benchmark Environment

Copy the template and adjust values for staging or CI:

```bash
cp benchmarks/api/.env.benchmark.example .env.benchmark
```

The runner reads these environment variables when they are exported by your shell or CI job:

- `API_BENCHMARK_BASE_URL`
- `API_BENCHMARK_REQUESTS_PER_ENDPOINT`
- `API_BENCHMARK_CONCURRENCY`
- `API_BENCHMARK_TIMEOUT_MS`
- `API_BENCHMARK_JSON`
- `API_BENCHMARK_MARKDOWN`

## Regression Gate

The smoke gate compares a JSON report with `benchmarks/thresholds.json`:

```bash
npm run benchmark:api:smoke
```

The gate fails if any endpoint exceeds its p99 latency threshold or error-rate threshold.
