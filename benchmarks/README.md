# API benchmarks

Run the API locally, then execute:

```bash
cp .env.benchmark.example .env.benchmark
set -a && . ./.env.benchmark && set +a
npm run benchmark
```

Results are written to `benchmarks/results/` as JSON and markdown.

The suite covers every route mounted under `/api/` and records p50, p95, p99 latency, sustained/peak requests per second, error rate, and TTFB. CI can lower `BENCHMARK_CONCURRENCY` and `BENCHMARK_DURATION_MS` for smoke runs.
