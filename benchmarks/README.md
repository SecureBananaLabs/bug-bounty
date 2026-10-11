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
- `BENCHMARK_AUTH_TOKEN`: optional bearer token for protected routes when testing against an environment that already provides a dedicated benchmark account
- `BENCHMARK_AUTH_SECRET`: fallback secret used to create a short-lived local JWT for the `benchmark-user` admin identity
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

For local runs, the benchmark runner creates a short-lived `benchmark-user` admin JWT from `BENCHMARK_AUTH_SECRET` when `BENCHMARK_AUTH_TOKEN` is not provided. For shared or deployed environments, provide an explicit `BENCHMARK_AUTH_TOKEN` from a dedicated benchmark test account instead of using a personal token.

Run the low-concurrency smoke benchmark used by CI:

```bash
npm run benchmark:smoke
```

## Output

Each run writes two files under `benchmarks/results/`:

- `benchmark-<timestamp>.json`
- `benchmark-<timestamp>.md`

The report includes request count, sustained requests per second, peak 1-second requests per second, p50/p95/p99 latency, p95 time to first byte, and error rate for every configured endpoint. It also records the local Node.js, OS, CPU, and execution mode used for the run.

## Thresholds

`benchmarks/thresholds.json` stores reviewable p99 and error-rate limits. The runner exits with a non-zero status when any endpoint exceeds its threshold.
