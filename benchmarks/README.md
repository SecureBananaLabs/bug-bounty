# API benchmark suite

This benchmark suite uses `autocannon` to exercise every mounted `/api/` endpoint in the Express API and records p50, p95, p99 latency, p99 response-header timing as the TTFB signal, sustained requests per second, peak requests per second, status distribution, and error rate.

Current endpoint coverage includes auth register/login/oauth/refresh, users, jobs, proposals, payments, reviews, messages, notifications, uploads, search, and admin metrics. JSON and multipart payloads use the current request schemas and realistic nested synthetic data. The admin metrics route uses a dedicated benchmark bearer token.

## Run locally

```sh
npm run benchmark
```

When `BENCHMARK_TARGET_URL` is not set, the runner starts the local Express app on a random loopback port and sets `NODE_ENV=benchmark`. By default it also sets `BENCHMARK_DISABLE_RATE_LIMIT=1` so the benchmark measures route behavior instead of the limiter ceiling. Set `BENCHMARK_DISABLE_RATE_LIMIT=0` to include the normal API limiter in local runs.

To benchmark an already-running API, copy `benchmarks/.env.benchmark.example` to `benchmarks/.env.benchmark` and set:

```sh
BENCHMARK_TARGET_URL=http://127.0.0.1:4000
BENCHMARK_AUTH_TOKEN=<token for /api/admin/metrics>
```

If `BENCHMARK_AUTH_TOKEN` is omitted, the runner creates a local benchmark admin token with the configured `JWT_SECRET`.

## CI smoke run

```sh
npm run benchmark:smoke
```

The smoke mode uses low request volume and validates the generated metrics against `benchmarks/thresholds.json`. It fails when any endpoint is missing from `benchmarks/routes.js` or exceeds its configured p99 latency, p99 TTFB/header timing, or error-rate threshold.

Peak RPS comes from `autocannon`'s per-second request histogram. The sample interval defaults to 1000 ms and can be changed with `BENCHMARK_SAMPLE_INTERVAL_MS`.

## Output

Each run writes both timestamped and stable report files:

- `benchmarks/results/benchmark-<timestamp>.json`
- `benchmarks/results/benchmark-<timestamp>.md`
- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

Generated result files are ignored by git so local and CI environments do not churn the repository.
