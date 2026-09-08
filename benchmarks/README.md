# API Benchmarks

This suite benchmarks every platform API route mounted by `apps/api/src/app.js`, plus `/health`.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default, the runner starts the Express app locally on an ephemeral loopback port. Set `BENCHMARK_TARGET_URL` to benchmark an already-running local or staging API.

## Configuration

Copy `benchmarks/.env.benchmark.example` into your shell or benchmark environment and adjust:

- `BENCHMARK_TARGET_URL`: optional target API base URL.
- `BENCHMARK_ITERATIONS`: measured requests per endpoint.
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint.
- `BENCHMARK_WARMUP`: warmup requests per endpoint before metrics are recorded.
- `BENCHMARK_RESULTS_DIR`: where JSON and Markdown results are written.
- `JWT_SECRET`: token secret used when starting the local app and signing the benchmark admin token.

## Output

Each run writes:

- `benchmarks/results/api-benchmark-<timestamp>.json`
- `benchmarks/results/api-benchmark-<timestamp>.md`
- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

Metrics captured per endpoint:

- p50, p95, and p99 latency in milliseconds
- p50, p95, and p99 time to first byte in milliseconds
- sustained and peak requests per second
- error rate
- status-code distribution

## Regression Gate

`benchmarks/thresholds.json` defines reviewable p99 latency and error-rate thresholds. `npm run benchmark:smoke` uses lower concurrency and fewer iterations so it can be used as a local or CI smoke gate, and exits non-zero when any endpoint exceeds its threshold.
