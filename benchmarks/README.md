# API Benchmarks

Run the full local API benchmark from the repository root:

```sh
npm run benchmark
```

Run the CI-sized smoke benchmark:

```sh
npm run benchmark:smoke
```

The runner starts `apps/api` on an ephemeral local port unless `BENCHMARK_BASE_URL`
is set. Copy `.env.benchmark.example` to `.env.benchmark` to override iteration
counts, concurrency, auth token, results directory, or a remote target URL.

Each run writes both JSON and Markdown reports to `benchmarks/results`. The
threshold gate is configured in `benchmarks/thresholds.json` and fails the
process when aggregate p95 latency, aggregate error rate, aggregate RPS, or an
endpoint-specific threshold falls outside the configured limits.
