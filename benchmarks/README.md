# API Benchmark Suite

This directory contains a reproducible benchmark harness for every current `/api/*` endpoint in FreelanceFlow.

## Run

1. Start the API: `npm run dev -w apps/api`
2. In another terminal run: `npm run benchmark`

Optional environment variables can be copied from `.env.benchmark.example`. Results are written to `benchmarks/results/latest.json` and `benchmarks/results/latest.md`.

## Smoke gate

`npm run benchmark:smoke` uses low concurrency and fails when an endpoint exceeds the reviewable p99/error thresholds in `benchmarks/thresholds.json`.

The runner uses realistic synthetic request bodies, a dedicated benchmark JWT for the protected admin route, and records p50/p95/p99 latency, p95 TTFB, sustained RPS, peak RPS, HTTP status distribution, and error rate per endpoint.
