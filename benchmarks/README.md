# API Benchmarks

This directory contains a reproducible benchmark suite for the platform API.

## Commands

```console
npm run benchmark
npm run benchmark:smoke
```

By default, the runner starts the local Express app on a random port and benchmarks every `/api/` endpoint. To run against an already running local or staging server, set `BENCHMARK_BASE_URL`.

## Reviewer Demo

Use `benchmark:smoke` for a short end-to-end review pass:

```console
npm ci
npm test
npm run benchmark:smoke
sed -n '1,80p' benchmarks/results/api-benchmark-latest.md
```

The smoke run starts the local API automatically, exercises all configured routes once, checks the thresholds in `thresholds.json`, and writes the JSON and Markdown reports under `benchmarks/results/`. See `demo-walkthrough.md` for a recording-ready walkthrough.

## Environment

Copy `.env.benchmark.example` into your local environment or CI secret store and set:

- `BENCHMARK_BASE_URL`: target server URL. If omitted, the local app is started automatically.
- `BENCHMARK_AUTH_TOKEN`: bearer token for protected routes. If omitted for a local run, a benchmark JWT is generated.
- `BENCHMARK_REQUESTS`: requests per endpoint. Defaults to `5`, or `1` in smoke mode.
- `BENCHMARK_CONCURRENCY`: concurrent requests per endpoint. Defaults to `2`, or `1` in smoke mode.

## Output

Each run writes:

- `benchmarks/results/api-benchmark-latest.json`
- `benchmarks/results/api-benchmark-latest.md`

The JSON result is machine-readable for regression tracking. The Markdown summary is designed to be pasted into PR descriptions.

## Thresholds

`thresholds.json` stores reviewable smoke-test gates. The runner fails when an endpoint exceeds its p99 latency threshold or error-rate threshold.
