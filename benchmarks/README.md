# API Benchmarks

This benchmark suite covers every currently mounted API endpoint in `apps/api/src/app.js`, plus `/health`.

## Commands

```sh
npm run benchmark
npm run benchmark:smoke
npm run benchmark:coverage
```

By default the runner starts the Express app in-process on a random loopback port. To run against an already running local or staging server, set `BENCHMARK_TARGET_URL`.

## Configuration

Copy `.env.benchmark.example` into your shell environment or CI secret configuration and adjust values as needed:

- `BENCHMARK_TARGET_URL`: optional target base URL. If unset, the runner starts the local app.
- `BENCHMARK_ADMIN_TOKEN`: optional bearer token for protected admin routes. If unset for local runs, the runner creates a short-lived benchmark token.
- `BENCHMARK_CONCURRENCY`: parallel requests per endpoint.
- `BENCHMARK_REQUESTS_PER_ENDPOINT`: measured requests per endpoint.
- `BENCHMARK_OUTPUT_DIR`: output directory for JSON and Markdown reports.

Thresholds live in `benchmarks/thresholds.json`. `npm run benchmark:smoke` is the low-concurrency gate command intended for CI, while local full runs provide broader baseline data.

`npm run benchmark:coverage` checks the benchmark endpoint inventory against the API route mounts in `apps/api/src/app.js`.

## Output

Each run writes:

- `benchmarks/results/full-latest.json`
- `benchmarks/results/full-latest.md`
- `benchmarks/results/smoke-latest.json`
- `benchmarks/results/smoke-latest.md`

Reports include p50, p95, p99 latency, p99 time to first byte, requests per second, peak requests per second, and error rate for each endpoint.
