# API Benchmark Suite

This benchmark suite measures the FreelanceFlow API with a dependency-free Node.js runner. It covers every route mounted under `/api/` plus `/health` as a readiness baseline.

## Run locally

```bash
cp .env.benchmark.example .env.benchmark
npm run dev -w apps/api
npm run benchmark
```

Useful overrides:

```bash
BENCHMARK_BASE_URL=http://127.0.0.1:4000 \
BENCHMARK_CONCURRENCY=4 \
BENCHMARK_REQUESTS_PER_ENDPOINT=10 \
BENCHMARK_WARMUP_REQUESTS=1 \
npm run benchmark
```

The runner writes both JSON and Markdown reports to `benchmarks/results/`.

The default request volume stays below the API's 200-request rate limit window. Increase it only when the benchmark target has a matching benchmark-specific limit or isolated environment.

## Auth

`/api/admin/metrics` is benchmarked with a dedicated benchmark token. Set `BENCHMARK_AUTH_TOKEN` to use a prebuilt token, or set `JWT_SECRET` to match the API server and the runner will create an HS256 token for `benchmark_admin`.

## CI smoke gate

The `API benchmark smoke` workflow starts the API, sends a low-volume smoke benchmark, and fails when p99 latency or error rate exceeds `benchmarks/thresholds.json`.
