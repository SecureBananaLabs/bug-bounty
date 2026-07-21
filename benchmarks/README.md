# FreelanceFlow API Benchmarks

A reproducible load-testing suite for every `/api/` endpoint in the FreelanceFlow
platform. It measures latency (p50/p95/p99), throughput (requests per second),
error rate, and time-to-first-byte (TTFB), then emits a JSON report and a
human-readable markdown summary for regression tracking.

## Tooling

- **[autocannon](https://github.com/mcollina/autocannon)** — Node.js HTTP/1.1
  benchmarking tool (no external runtime required beyond Node).
- **dotenv** — loads `.env.benchmark` for configuration.

## Setup

```bash
# From the repository root
npm install

# Start the API (in another terminal) on the default port 4000
npm run dev -w apps/api

# Configure your target (optional; defaults target http://localhost:4000)
cp benchmarks/.env.benchmark.example benchmarks/.env.benchmark
# edit benchmarks/.env.benchmark as needed
```

## Running the suite

```bash
# Full benchmark against the configured target
npm run benchmark

# Low-concurrency smoke run (used by CI regression gate)
npm run benchmark --workspace=@freelanceflow/benchmarks -- benchmark:smoke
```

Or directly inside the module:

```bash
cd benchmarks
npm run benchmark          # full
npm run benchmark:smoke    # smoke
```

## Auth-protected routes

Auth-protected endpoints are exercised with a dedicated benchmark token. By default
`run.js` signs a short-lived JWT using `BENCHMARK_JWT_SECRET` (which defaults to the
API's local development secret). For a deployed target, set `BENCHMARK_TOKEN` to a
pre-issued token or point `BENCHMARK_JWT_SECRET` at the target's secret.

## Configuration

All endpoints, realistic payloads, concurrency, and duration live in
[`bench.config.js`](./bench.config.js). Adjust per-endpoint load there.

## Output

Results are written to `benchmarks/results/`:

- `benchmark-<timestamp>.json` — full structured metrics
- `benchmark-<timestamp>.md` — human-readable summary
- `latest.json` / `latest.md` — most recent run

## Regression gate

Per-endpoint p99 latency thresholds are stored in
[`thresholds.json`](./thresholds.json) and are reviewable. The runner exits
non-zero if any endpoint's p99 exceeds its threshold, which CI uses to fail the
smoke benchmark.

| Field | Meaning |
| --- | --- |
| `p99Ms` | Maximum acceptable p99 latency (ms) for the endpoint |
