# API Benchmarks

This suite benchmarks every current route mounted under `/api/` in `apps/api/src/app.js`.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the local Express app on an ephemeral loopback port. Set `BENCHMARK_BASE_URL` in the environment or in `benchmarks/.env.benchmark` to target an already running local or staging API.

## Configuration

Copy `benchmarks/.env.benchmark.example` to `benchmarks/.env.benchmark` and adjust:

- `BENCHMARK_BASE_URL`: optional target host, for example `http://127.0.0.1:4000`
- `BENCHMARK_DURATION_SECONDS`: per-endpoint duration for full runs
- `BENCHMARK_CONNECTIONS`: autocannon connections for full runs
- `BENCHMARK_PIPELINING`: autocannon pipelining value
- `BENCHMARK_RESULTS_DIR`: output directory for JSON and Markdown reports

Smoke runs intentionally use lower concurrency and shorter duration so they are suitable for CI.

## Output

Each run writes:

- `benchmarks/results/<timestamp>.json`
- `benchmarks/results/<timestamp>.md`
- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

The Markdown report includes p50, p95, p99 latency, sustained and peak requests per second, error rate, and a measured TTFB sample for each endpoint.
