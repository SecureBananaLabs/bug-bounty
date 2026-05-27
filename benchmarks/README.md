# API Benchmark Suite

This benchmark suite measures the FreelanceFlow API endpoints with a reproducible Node.js runner.

## Configure

Copy `.env.benchmark.example` to `.env.benchmark` and adjust the target URL if needed.

```bash
cp .env.benchmark.example .env.benchmark
```

Supported settings:

- `BENCHMARK_TARGET_URL`: API base URL, for example `http://127.0.0.1:4000`
- `BENCHMARK_DURATION_SECONDS`: seconds to run each endpoint
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint
- `BENCHMARK_AUTH_TOKEN`: optional bearer token for protected routes
- `BENCHMARK_AUTH_SECRET`: fallback secret used to create a local benchmark JWT
- `BENCHMARK_RESULTS_DIR`: output directory for JSON and Markdown reports
- `RATE_LIMIT_MAX`: set a high value, such as `10000000`, when starting the local API for benchmark runs

## Run

Start the API locally:

```bash
npm run start -w apps/api
```

Run the full benchmark:

```bash
npm run benchmark
```

Run the low-concurrency smoke benchmark used by CI:

```bash
npm run benchmark:smoke
```

## Output

Each run writes two files under `benchmarks/results/`:

- `benchmark-<timestamp>.json`
- `benchmark-<timestamp>.md`

The report includes request count, p50/p95/p99 latency, p95 time to first byte, requests per second, and error rate for every configured endpoint.

## Thresholds

`benchmarks/thresholds.json` stores reviewable p99 and error-rate limits. The runner exits with a non-zero status when any endpoint exceeds its threshold.
