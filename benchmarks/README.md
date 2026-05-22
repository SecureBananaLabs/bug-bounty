# API Benchmarks

This directory contains an `autocannon` benchmark suite for the Express API.

## Run

Copy `.env.benchmark.example` to `.env.benchmark` if you want to customize the target or load profile, then run:

```bash
npm run benchmark
```

For a short local or CI check:

```bash
npm run benchmark:smoke
```

By default the runner starts `apps/api/src/server.js`, waits for `/health`, benchmarks every route under `/api/` plus `/health`, writes JSON and Markdown reports to `benchmarks/results/`, and exits non-zero when thresholds fail.

## Configuration

- `BENCHMARK_BASE_URL`: target API URL.
- `BENCHMARK_START_SERVER`: start the local API before running.
- `BENCHMARK_DURATION_SECONDS`: seconds per endpoint.
- `BENCHMARK_CONNECTIONS`: concurrent connections.
- `BENCHMARK_PIPELINING`: autocannon pipelining setting.
- `BENCHMARK_RESULTS_DIR`: output directory.
- `BENCHMARK_AUTH_TOKEN`: optional bearer token for protected routes.
- `BENCHMARK_SMOKE`: use smoke defaults and thresholds.
- `BENCHMARK_DISABLE_RATE_LIMIT`: disable the Express rate limiter when the runner starts the local API.

Thresholds live in `benchmarks/thresholds.json`. Use the smoke profile for CI and the default profile for fuller local or staging runs.
