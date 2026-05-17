# API Benchmarks

This directory contains the reproducible benchmark suite for the Express API.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the local Express app in-process and benchmarks it
over loopback. To target a deployed environment, copy `.env.benchmark.example`
to `.env.benchmark`, export the values you need, and set `BENCHMARK_BASE_URL`.

## Coverage

The route inventory in `routes.mjs` covers every current route mounted under
`/api/`, including auth, users, jobs, proposals, payments, reviews, messages,
notifications, uploads, search, and admin metrics. Protected admin metrics use
a dedicated benchmark JWT signed with `BENCHMARK_JWT_SECRET`.

## Results

Each run writes timestamped JSON and Markdown reports to
`benchmarks/results/`, then updates `latest.json` and `latest.md`. Per-endpoint
metrics include p50, p95, p99 latency, sustained and peak requests per second,
error rate, and a single-request TTFB sample.

## Regression Gate

`thresholds.json` stores reviewable p99, error-rate, and sustained-RPS
thresholds. CI runs `npm run benchmark:smoke`, which uses the smoke thresholds
and fails on threshold violations.
