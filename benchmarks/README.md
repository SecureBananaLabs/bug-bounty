# API Benchmarks

This benchmark suite covers every current API route plus `/health`.

## Commands

```bash
npm run benchmark:coverage
npm run benchmark:smoke
npm run benchmark
```

By default the runner starts a local Express server on an ephemeral port. Set
`BENCHMARK_TARGET_URL` to run against an already running local or staging server.

## Outputs

JSON and Markdown reports are written to `benchmarks/results/`.

The runner records:

- p50, p95, and p99 latency
- p95 time to first byte
- sustained and peak requests per second
- error rate based on each scenario's expected status code
- status-code distribution

Thresholds live in `benchmarks/thresholds.json` and are enforced by the smoke
benchmark command.
