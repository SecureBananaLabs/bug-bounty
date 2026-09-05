# API Benchmark Suite

This suite benchmarks every Express route mounted under `/api/` and records p50, p95, p99 latency, requests per second, error rate, and a single-request TTFB probe for each endpoint. Throughput and error totals come from `autocannon`; latency percentiles are sampled separately so p95 is always available in the report.

## Quick start

```bash
npm install
npm run benchmark
```

The default run starts the API in-process on a temporary local port, disables rate limiting for the managed benchmark process, and isolates each endpoint in a fresh server instance so the shared in-memory limiter does not skew endpoint baselines. To benchmark an already running local or staging API, copy `.env.benchmark.example` to `.env.benchmark`, set `BENCHMARK_START_SERVER=false`, and set `BENCHMARK_BASE_URL`.

## Outputs

Each run writes:

- `benchmarks/results/api-benchmark-<timestamp>.json`
- `benchmarks/results/api-benchmark-<timestamp>.md`

The CI smoke job runs `npm run benchmark:smoke`, which uses a smaller request count and fails when an endpoint exceeds the configured p99 threshold in `benchmarks/thresholds.json`.
