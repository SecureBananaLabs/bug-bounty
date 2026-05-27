# API Benchmarks

Run a reproducible benchmark against the local Express API or an external target.

```bash
npm run benchmark
npm run benchmark:smoke
```

Configuration can be supplied with environment variables. Copy `.env.benchmark.example`
when running outside the default local setup.

- `BENCHMARK_TARGET_URL`: target host. When omitted, the runner starts the local API.
- `BENCHMARK_AUTH_TOKEN`: bearer token for protected routes. When omitted, a local admin token is generated.
- `BENCHMARK_ITERATIONS`: requests per endpoint for the full suite.
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint.
- `BENCHMARK_P99_THRESHOLD_MS`: default p99 latency ceiling.
- `BENCHMARK_ERROR_RATE_THRESHOLD`: default allowed error rate percentage.

Results are written to:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

The smoke mode lowers request volume while still covering every configured endpoint.
