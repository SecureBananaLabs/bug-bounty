# API Benchmarks

This benchmark suite covers `/health` and every mounted `/api/` route in the Express backend. It runs locally by default, or against a staging target when `BENCHMARK_TARGET_URL` is set.

## Usage

```bash
npm run benchmark
npm run benchmark:smoke
```

Copy `.env.benchmark.example` if you want to target an existing server:

```bash
cp .env.benchmark.example .env.benchmark
BENCHMARK_TARGET_URL=https://staging.example.com npm run benchmark
```

## Outputs

Each run writes:

- JSON metrics to `benchmarks/results/<run-id>.json`
- Markdown summary to `benchmarks/results/<run-id>.md`

Captured metrics include p50/p95/p99 latency, p95 TTFB, sustained and peak requests per second, status-code distribution, and error rate per endpoint.

## Thresholds

`benchmarks/thresholds.json` stores reviewable smoke-gate thresholds. The smoke command exits non-zero when an endpoint exceeds its configured p99 latency or error-rate limit.
