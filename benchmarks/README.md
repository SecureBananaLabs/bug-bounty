# API Benchmarks

This directory contains the reproducible benchmark suite for the Express API.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default, the runner starts the local Express app on an ephemeral loopback port. To benchmark an already-running local or staging API, set `BENCHMARK_TARGET_URL`.

The runner covers `/health` plus every mounted `/api/*` route, including the protected admin metrics route with a dedicated benchmark JWT. Results are written to:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` when local overrides are needed.

Supported variables:

- `BENCHMARK_TARGET_URL`: external API base URL, for example `http://127.0.0.1:4000`
- `BENCHMARK_AUTH_TOKEN`: optional bearer token for protected benchmark routes
- `BENCHMARK_ITERATIONS`: request count per endpoint
- `BENCHMARK_WARMUP`: warmup requests per endpoint
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint
- `BENCHMARK_MODE`: set to `smoke` to use smoke thresholds

Thresholds live in `benchmarks/thresholds.json` and are intentionally reviewable.
