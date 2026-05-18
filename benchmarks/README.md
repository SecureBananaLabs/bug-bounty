# API Benchmark Suite

This suite benchmarks every current `/api` route with realistic JSON or multipart payloads. It records p50, p95, p99 latency, sustained and peak requests per second, error rate, status-code distribution, throughput, and sampled time to first byte.

## Local Run

Use `benchmarks/benchmark.env.example` as the local environment template. Start the API with a benchmark-friendly rate limit:

```bash
RATE_LIMIT_MAX=10000 JWT_SECRET=benchmark-secret npm run start -w apps/api
```

Then run the full benchmark from another shell:

```bash
BENCHMARK_BASE_URL=http://127.0.0.1:4000 npm run benchmark
```

For a quick CI-style gate:

```bash
BENCHMARK_BASE_URL=http://127.0.0.1:4000 npm run benchmark:smoke
```

Generated JSON and Markdown reports are written to `benchmarks/results/`.

## Auth

The runner benchmarks auth-protected routes with `BENCHMARK_AUTH_TOKEN` when it is provided. If no token is provided, the runner registers a benchmark admin user through `/api/auth/register` and uses the returned token for routes such as `/api/admin/metrics`.

## Thresholds

Thresholds live in `benchmarks/thresholds.json`. The smoke CI job fails when any endpoint exceeds its p99 latency, p99 TTFB, or error-rate threshold.
