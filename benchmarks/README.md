# API Benchmarks

This directory contains the reproducible API benchmark suite for the platform.
It uses `autocannon` to exercise every route registered under `/api/` and writes
both machine-readable JSON and a Markdown summary to `benchmarks/results/`.

## Run locally

```bash
npm run benchmark
```

When `BENCHMARK_BASE_URL` is omitted, the runner starts the local Express API on
a random localhost port with `NODE_ENV=benchmark` and benchmarks that process.
That local benchmark mode skips the development API rate limiter so the suite
measures endpoint behavior instead of exhausting the shared request bucket.
To benchmark an already
running local or staging API, copy the template and set the target:

```bash
cp benchmarks/.env.benchmark.example .env.benchmark
BENCHMARK_BASE_URL=http://127.0.0.1:4000 npm run benchmark
```

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `BENCHMARK_BASE_URL` | auto-start local API | API host to benchmark. |
| `BENCHMARK_AUTH_TOKEN` | generated benchmark admin token | Token used for auth-protected benchmark routes. |
| `BENCHMARK_CONNECTIONS` | `10` full, `1` smoke | Concurrent connections per endpoint. |
| `BENCHMARK_DURATION_SECONDS` | `10` full, `2` smoke | Duration per endpoint. |
| `BENCHMARK_REQUESTS_PER_ENDPOINT` | `150` full, `20` smoke | Request cap per endpoint to keep CI runs below API rate limits. |
| `BENCHMARK_PIPELINING` | `1` | HTTP pipelining factor passed to autocannon. |

## Smoke gate

```bash
npm run benchmark:smoke
```

The smoke run uses low concurrency and shorter duration for CI. Regression
thresholds live in `benchmarks/thresholds.json`. The command exits non-zero if
any endpoint exceeds the configured p99 latency or error-rate threshold.
Autocannon does not expose an exact p95 bucket in every version; in that case
the runner reports the nearest more conservative p97.5 value in the p95 column.

## Endpoint coverage

Endpoint definitions live in `benchmarks/endpoints.mjs`. Payloads are based on
the current request validators and service shapes so the suite covers realistic
platform objects such as users, jobs, proposals, messages, reviews, payments,
notifications, uploads, search, and admin metrics.
