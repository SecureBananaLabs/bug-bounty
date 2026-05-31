# API Benchmark Suite

This suite benchmarks the Express API routes mounted by `apps/api/src/app.js`.
It can start the local app in-process or target a running API with
`BENCHMARK_TARGET_URL`.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

`benchmark:smoke` is meant for CI. It uses low concurrency and the same
threshold checks as the full benchmark.

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` and adjust values as needed.
Environment variables already exported in the shell take precedence.

Protected routes use `BENCHMARK_AUTH_TOKEN` when provided. If the benchmark
starts the local app, it generates a dedicated admin-scoped benchmark JWT.

## Outputs

Every run writes timestamped JSON and Markdown reports under
`benchmarks/results/`, plus `latest.json` and `latest.md` convenience copies.
Each report includes p50, p95, p99 latency, p95 TTFB, sustained and peak RPS,
error rate, and non-2xx rate per endpoint.

Thresholds live in `benchmarks/thresholds.json` so reviewers can tune the smoke
gate without editing benchmark code.
