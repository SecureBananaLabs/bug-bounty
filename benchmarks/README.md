# API Benchmarks

Dependency-free benchmark suite for the Express API.

## Commands

```bash
npm run benchmark:smoke
npm run benchmark
```

By default, the runner starts the local API app on an ephemeral loopback port. To run against an existing target, set `BENCHMARK_TARGET_URL`.

## Configuration

Copy `benchmarks/env.benchmark.example` when an external target needs a benchmark token or fixed URL. Do not commit secrets or live tokens.

## Outputs

The runner writes:

- `benchmarks/results/smoke.json`
- `benchmarks/results/smoke.md`
- `benchmarks/results/full.json`
- `benchmarks/results/full.md`

Each result records p50, p95, p99 latency, p95 TTFB, requests per second, error rate, status code, and threshold gate state for every route in the manifest.
