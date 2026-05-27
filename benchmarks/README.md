# FreelanceFlow API Benchmark Suite

Automated benchmarking for all FreelanceFlow REST API endpoints.

## Quick Start

```bash
# 1. Start the API server
npm run dev --workspace=apps/api

# 2. In another terminal, run the benchmark
node benchmarks/api-benchmark.js
```

## Configuration

Copy `.env.benchmark` to `.env` (or `.env.benchmark.local`) and configure:

```bash
cp .env.example .env
# Edit .env with your values
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3001` | Target API base URL |
| `BENCHMARK_TOKEN` | _(empty)_ | JWT token for protected routes |
| `CONCURRENCY` | `10` | Concurrent connections per burst |
| `DURATION_MS` | `5000` | Duration of each endpoint test (ms) |

## Metrics Captured

- **p50 / p95 / p99 Latency** (ms) — response time percentiles
- **RPS** — requests per second (throughput)
- **Error Rate** (%) — failed or non-2xx responses
- **TTFB** — time to first byte (average, ms)

## Output Files

| File | Description |
|------|-------------|
| `results/latest.json` | Most recent benchmark results (JSON) |
| `results/report.md` | Human-readable markdown report |
| `results/results_<timestamp>.json` | Archived results |

## Thresholds

Edit `thresholds.json` to set p99 latency thresholds per endpoint. The benchmark script will flag endpoints that exceed their threshold.

## CI Integration

The benchmark can be run as a CI smoke test:

```bash
# Runs quick smoke test (shorter duration)
CONCURRENCY=2 DURATION_MS=2000 node benchmarks/api-benchmark.js
```

Exit code 0 = all endpoints passed thresholds  
Exit code 1 = one or more endpoints offline or exceeded thresholds
