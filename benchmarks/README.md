# API Benchmarks

This directory contains a reproducible benchmark suite for the FreelanceFlow API. It covers every mounted `/api/*` endpoint plus `/health`, records latency and throughput metrics, and writes both machine-readable and human-readable reports.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
npm run benchmark:verify
```

`npm run benchmark` starts the local Express app in-process unless `BENCHMARK_TARGET_URL` is set. The smoke command uses lower request counts and is intended for CI.

## Configuration

Copy `benchmarks/.env.benchmark.example` to your shell or CI environment and set only the values you need:

- `BENCHMARK_TARGET_URL`: optional external API base URL.
- `BENCHMARK_AUTH_TOKEN`: dedicated benchmark JWT for protected routes when targeting staging.
- `BENCHMARK_CONCURRENCY` / `BENCHMARK_REQUESTS_PER_ENDPOINT`: full-suite load settings.
- `BENCHMARK_SMOKE_CONCURRENCY` / `BENCHMARK_SMOKE_REQUESTS_PER_ENDPOINT`: CI smoke settings.
- `BENCHMARK_THRESHOLDS`: path to reviewable threshold JSON.

## Output

Each run writes JSON and Markdown to `benchmarks/results/`. The Markdown report is suitable for pasting into a PR description, while the JSON output preserves raw per-request samples for later regression analysis.
