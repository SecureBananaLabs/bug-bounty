# API Benchmark Suite

This suite benchmarks `/health` plus every mounted `/api/*` route in the Express API.

## Commands

- `npm run benchmark` starts the local API automatically unless `BENCHMARK_TARGET_URL` is set.
- `npm run benchmark:smoke` runs a short low-concurrency threshold gate for CI.

## Configuration

Copy `benchmarks/.env.benchmark.example` into your local environment or export the variables directly:

- `BENCHMARK_TARGET_URL`: optional target host. If omitted, the runner starts `apps/api/src/app.js` on an ephemeral local port.
- `BENCHMARK_REQUESTS_PER_ENDPOINT`: requests per endpoint, default `5` to keep local full-suite runs below the API's default rate limit.
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint, default `2`.
- `BENCHMARK_TIMEOUT_MS`: per-request timeout, default `5000`.
- `JWT_SECRET`: used to mint the benchmark admin token for protected routes.

Results are written to `benchmarks/results/api-benchmark-latest.json` and `benchmarks/results/api-benchmark-summary.md`.
