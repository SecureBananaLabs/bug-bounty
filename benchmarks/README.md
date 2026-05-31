# API Benchmark Suite

This suite benchmarks every API route mounted by `apps/api/src/app.js` and writes both machine-readable JSON and a Markdown summary to `benchmarks/results/`.

## Run Locally

```sh
npm run benchmark
```

By default the runner imports the Express app, starts it on an ephemeral local port, generates a benchmark-only JWT for protected routes, and runs the full endpoint matrix. To target a deployed API instead, copy `benchmarks/.env.benchmark.example` to `benchmarks/.env.benchmark` and set `BENCHMARK_BASE_URL`.

Local runs set `NODE_ENV=benchmark` before importing the API so the global rate limiter does not dominate measurements. Deployed targets keep whatever rate limiting they are already running.

## Configuration

The runner reads these optional variables from `benchmarks/.env.benchmark` and the process environment:

- `BENCHMARK_BASE_URL`: target API origin. When omitted, a local API server is started automatically.
- `BENCHMARK_AUTH_TOKEN`: bearer token used for auth-protected routes when benchmarking an external target.
- `BENCHMARK_DURATION_MS`: per-endpoint runtime for full benchmarks. Defaults to `2000`.
- `BENCHMARK_CONCURRENCY`: concurrent request workers per endpoint. Defaults to `4`.
- `BENCHMARK_WARMUP_REQUESTS`: warmup requests before measuring each endpoint. Defaults to `1`.
- `BENCHMARK_OUTPUT_DIR`: result directory. Defaults to `benchmarks/results`.

For CI, `npm run benchmark:smoke` runs the same route matrix with a short duration and fails if any endpoint exceeds `benchmarks/thresholds.json`.

## Metrics

Each endpoint report includes:

- p50, p95, and p99 total latency in milliseconds
- p50, p95, and p99 time to first byte in milliseconds
- sustained and peak requests per second
- request count, status distribution, and error rate
- threshold pass or fail status

Payloads are intentionally shaped like marketplace production traffic: registrations, job posts, proposals, messages, payments, notifications, reviews, uploads, search queries, and the protected admin metrics endpoint.
