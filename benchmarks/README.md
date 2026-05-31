# API Benchmark Suite

This benchmark suite covers every mounted `/api/*` route plus `/health`.
It uses only Node.js standard runtime APIs and can run against either:

- an in-process local Express app, when `BENCHMARK_TARGET_URL` is not set
- an already-running local or staging API, when `BENCHMARK_TARGET_URL` is set

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

`benchmark:smoke` uses low request counts and is suitable for CI.

## Configuration

Copy `benchmarks/.env.benchmark.example` into your shell environment or export the values you need:

```bash
BENCHMARK_TARGET_URL=http://127.0.0.1:4000
BENCHMARK_CONCURRENCY=4
BENCHMARK_REQUESTS=25
BENCHMARK_RESULTS_DIR=benchmarks/results
```

If `BENCHMARK_TARGET_URL` is omitted, the runner starts the API in-process on an ephemeral local port.

## Output

Full benchmark runs write:

- timestamped JSON to `benchmarks/results/`
- timestamped Markdown summaries to `benchmarks/results/`

Smoke runs validate thresholds but do not write results unless `--write-results` is passed.

## Metrics

Each endpoint report includes:

- p50, p95, and p99 latency in milliseconds
- p95 time-to-first-byte in milliseconds
- sustained and peak requests per second
- HTTP status distribution
- error rate percentage

Thresholds are configured in `benchmarks/thresholds.json`.
