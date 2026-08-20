# API Benchmark Suite

This suite benchmarks every mounted API route in `apps/api/src/app.js` plus `/health`.

## Run

```bash
npm run benchmark
```

By default the runner starts the API in-process on a random local port. To target an already running server, copy `.env.benchmark.example` to `.env.benchmark` and set `BENCHMARK_TARGET_URL`.

For CI or quick local checks:

```bash
npm run benchmark:smoke
```

## Output

Each run writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

The JSON file is useful for regression automation. The Markdown file is designed to be pasted into a pull request description.

## Metrics

Each endpoint records:

- p50, p95, and p99 latency in milliseconds
- average and peak requests per second
- error count and error rate
- non-2xx response count
- measured time to first byte

Thresholds live in `benchmarks/thresholds.json`. `npm run benchmark:smoke` fails when the configured p99, error-rate, or non-2xx threshold is exceeded.
