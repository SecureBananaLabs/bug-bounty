# Benchmark API Suite

This directory contains performance benchmarks for the FreelanceFlow API.

## Prerequisites

- [k6](https://k6.io/docs/getting-started/installation/) installed
- API server running (locally or on staging)
- A valid benchmark JWT token for auth-protected routes

## Running

```bash
# Point to your API server
export API_BASE_URL=http://localhost:3001

# Run full benchmark suite
k6 run benchmark.js

# Run specific endpoint group
k6 run benchmark.js --env ENDPOINTS=auth
k6 run benchmark.js --env ENDPOINTS=jobs
k6 run benchmark.js --env ENDPOINTS=full
```

## Metrics Captured

- p50, p95, p99 latency (ms)
- Requests per second (peak and sustained)
- Error rate (%)
- Time to first byte (TTFB)

## Results

Results are written to `results/` as JSON and markdown summary.