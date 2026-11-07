# API benchmark suite

This benchmark suite covers every mounted `/api/*` route in the Express API and includes `/health` as a baseline service check.

## Run

```bash
npm run benchmark
```

By default the runner starts the local API app on an ephemeral port. To benchmark an already-running local or staging server, copy `.env.benchmark.example` to `.env.benchmark` and set `BENCHMARK_TARGET_URL`.

For the low-volume regression gate:

```bash
npm run benchmark:smoke
```

## Output

Each run writes:

- `benchmarks/results/api-benchmark-<timestamp>.json`
- `benchmarks/results/api-benchmark-<timestamp>.md`
- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

Metrics per endpoint include p50, p95, p99 latency, p95 TTFB, sustained RPS, peak one-second RPS, and error rate.
