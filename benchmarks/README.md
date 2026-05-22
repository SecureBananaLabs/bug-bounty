# API Benchmarks

This suite benchmarks every mounted `/api/*` endpoint in the Express API and records p50, p95, p99 latency, p95 time to first byte, sustained and peak requests per second, status distribution, and error rate.

## Commands

```sh
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the local Express app in-process on a random loopback port. Set `BENCHMARK_TARGET_URL` to run against an already-running local or staging server.

## Configuration

Create `.env.benchmark` at the repository root or under `benchmarks/` using `benchmarks/.env.benchmark.example` as a template.

Supported settings:

- `BENCHMARK_TARGET_URL`: optional base URL, for example `http://127.0.0.1:4000`.
- `BENCHMARK_AUTH_TOKEN`: optional bearer token for protected routes. If omitted, the local stub login endpoint is used to obtain a benchmark token.
- `BENCHMARK_REQUESTS`: requests per endpoint. Defaults to `8`, or `3` in smoke mode.
- `BENCHMARK_CONCURRENCY`: workers per endpoint. Defaults to `2`, or `1` in smoke mode.
- `BENCHMARK_WARMUP_REQUESTS`: warmup requests per endpoint. Defaults to `1`, or `0` in smoke mode.
- `BENCHMARK_OUTPUT_DIR`: output directory. Defaults to `benchmarks/results`.
- `BENCHMARK_THRESHOLDS`: threshold JSON file. Defaults to `benchmarks/thresholds.json`.

## Output

Each run writes timestamped JSON and Markdown reports to `benchmarks/results/`, plus `latest.json` and `latest.md` for quick regression comparison. Generated result files are ignored by git so local timing noise does not churn commits.

## Regression Gate

`benchmarks/thresholds.json` stores reviewable p99 latency, error-rate, and minimum sustained-RPS thresholds. `npm run benchmark:smoke` exits non-zero if any endpoint violates its gate, and `.github/workflows/benchmark-smoke.yml` runs that smoke gate in CI.
