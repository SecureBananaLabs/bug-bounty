# API Benchmarks

This directory contains a reproducible benchmark suite for the FreelanceFlow API.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

`npm run benchmark` starts the local Express API in-process when `BENCHMARK_TARGET_URL` is not set. It runs every current `/api/*` route with synthetic payloads and writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`
- timestamped JSON and Markdown reports

`npm run benchmark:smoke` runs a shorter low-concurrency pass and fails when thresholds in `benchmarks/thresholds.json` are exceeded.

## Configuration

Copy `.env.benchmark.example` values into your shell or CI environment when benchmarking a remote target.

| Variable | Default | Description |
| --- | --- | --- |
| `BENCHMARK_TARGET_URL` | local in-process API | Target API origin. |
| `BENCHMARK_REQUESTS_PER_ENDPOINT` | `8`, or `2` for smoke | Requests to send to each endpoint. |
| `BENCHMARK_CONCURRENCY` | `4`, or `1` for smoke | Concurrent requests per endpoint. |
| `BENCHMARK_COOLDOWN_MS` | `30` | Pause between endpoints. |

## Metrics

Each endpoint report includes request count, sustained/peak requests per second, p50/p95/p99 latency, p50/p95/p99 time to first byte, error rate, and status distribution.
