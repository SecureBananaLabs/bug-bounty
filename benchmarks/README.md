# API Benchmark Suite

This benchmark suite measures every mounted API route in the local Express app:

- latency: p50, p95, p99
- throughput: sustained and peak requests per second
- error rate
- time to first byte

Run the full local benchmark:

```bash
npm run benchmark
```

Run the low-concurrency CI smoke gate:

```bash
npm run benchmark:smoke
```

Configuration can be supplied with environment variables. Copy `.env.benchmark.example` for a documented starting point. If `BENCHMARK_TARGET_URL` is omitted or points to port `0`, the runner starts the local API in-process and benchmarks it over loopback. If a URL is supplied, the runner benchmarks that host instead.

The default local run caps each endpoint with `BENCHMARK_MAX_REQUESTS_PER_ENDPOINT` so the suite can benchmark all routes without accidentally turning the app-level rate limiter into the only measured bottleneck. Increase the cap or duration when benchmarking a staging host with an appropriate rate-limit policy.

Results are written to `benchmarks/results/` as a timestamped JSON file and a matching Markdown summary.
