# API benchmark suite

This benchmark suite exercises every mounted `/api/` endpoint in the Express API and records p50, p95, p99 latency, p99 time to first byte, sustained requests per second, peak requests per second, status distribution, and error rate.

Current endpoint coverage includes auth register/login/oauth/refresh, users, jobs, proposals, payments, reviews, messages, notifications, uploads, search, and admin metrics. JSON and multipart payloads use the current request schemas and realistic nested synthetic data. The admin metrics route uses a dedicated benchmark bearer token.

## Run locally

```sh
npm run benchmark
```

When `BENCHMARK_TARGET_URL` is not set, the runner starts the local Express app on a random loopback port and forces `NODE_ENV=benchmark`. That mode skips the normal API rate limiter so the benchmark measures route behavior instead of the limiter ceiling.

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

The smoke mode uses low request volume and validates the generated metrics against `benchmarks/thresholds.json`. It fails when any endpoint exceeds its configured p99 latency, p99 TTFB, or error-rate threshold.

Peak RPS is calculated as the highest completed-request count in a 100 ms bucket, scaled to one second, so short smoke runs still expose a peak-throughput signal.

## Output

Each run writes both timestamped and stable report files:

- `benchmarks/results/benchmark-<timestamp>.json`
- `benchmarks/results/benchmark-<timestamp>.md`
- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

Generated result files are ignored by git so local and CI environments do not churn the repository.
