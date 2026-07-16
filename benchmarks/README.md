# API Benchmarks

This directory contains the reproducible API benchmark suite for the Express backend.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the API in-process on an ephemeral loopback port. Set `BENCHMARK_TARGET_URL` to benchmark an already running local or staging API.

## Configuration

Copy `.env.benchmark.example` into your shell or CI environment and override:

- `BENCHMARK_TARGET_URL` for an external target.
- `BENCHMARK_DURATION_SECONDS`, `BENCHMARK_CONCURRENCY`, and `BENCHMARK_MAX_REQUESTS_PER_ENDPOINT` for load level.
- `BENCHMARK_AUTH_TOKEN` for protected routes when benchmarking an external target.

Results are written to `benchmarks/results/api-benchmark-latest.json` and `benchmarks/results/api-benchmark-latest.md`.

## Coverage

The suite exercises `/health` plus every route mounted under `/api` in `apps/api/src/app.js`, including auth, users, jobs, proposals, payments, reviews, messages, notifications, uploads, search, and admin metrics.
