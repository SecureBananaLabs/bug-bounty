# API Benchmark Suite

This suite benchmarks the FreelanceFlow API with repeatable local settings and
writes both machine-readable and Markdown reports.

## Run

Start the API locally:

```bash
npm install
PORT=4000 npm run dev -w apps/api
```

In another shell, run the full benchmark:

```bash
npm run benchmark
```

The script reads these environment variables:

- `BENCHMARK_BASE_URL`: API origin. Defaults to `http://127.0.0.1:4000`.
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint. Defaults to `10`.
- `BENCHMARK_DURATION_MS`: measured run time per endpoint. Defaults to `10000`.
- `BENCHMARK_WARMUP_MS`: warmup time before measurement. Defaults to `1000`.
- `BENCHMARK_MAX_REQUESTS_PER_ENDPOINT`: optional request cap for smoke runs.
- `BENCHMARK_OUTPUT_DIR`: report directory. Defaults to `benchmarks/results`.
- `BENCHMARK_TOKEN`: optional bearer token for protected routes.

See `benchmark.env.example` for a copyable template.

The API currently has a global rate limiter. For quick local smoke runs, set
`BENCHMARK_MAX_REQUESTS_PER_ENDPOINT` to a small value. For load runs, leave it
unset so `429` responses are captured in the error-rate and status-code output.

## Coverage

The benchmark covers every route mounted by `apps/api/src/app.js`, including:

- health check
- auth register, login, OAuth callback, and refresh
- users, jobs, proposals, payments, reviews, messages, notifications, uploads
- search
- admin metrics with a benchmark bearer token

Each endpoint has a realistic method, query string, or request body that matches
the current route/controller schema. Non-2xx/3xx responses are counted as
errors unless an endpoint explicitly declares additional accepted statuses.

## Metrics

For each endpoint, the report captures:

- p50, p95, and p99 full response latency
- p50, p95, and p99 time to first byte
- sustained and peak requests per second
- total requests, successful requests, and error rate
