# API Benchmarks

This directory contains a dependency-free benchmark runner for the FreelanceFlow API. It covers every mounted `/api/*` route with realistic JSON or multipart payloads and a dedicated benchmark JWT for the protected admin route.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the Express app in-process on a random local port. Set `BENCHMARK_BASE_URL` to run against an already-running local or staging server.

## Output

Each run writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

The report includes p50, p95, p99 latency, p95 TTFB, sustained and peak requests per second, request count, status distribution, and error rate per endpoint.

## Configuration

Copy `benchmarks/.env.benchmark.example` into your shell or CI environment and adjust:

- `BENCHMARK_BASE_URL`
- `BENCHMARK_REQUESTS`
- `BENCHMARK_CONCURRENCY`
- `BENCHMARK_SMOKE`
- `BENCHMARK_FAIL_ON_THRESHOLD`

Thresholds live in `benchmarks/thresholds.json`.
