# API Benchmark Suite

> Benchmark suite for measuring API endpoint performance — p50, p95, p99 latency, RPS, error rate, and TTFB.

## Quick Start

```bash
# Install benchmark dependencies
npm install --save-dev autocannon

# Run benchmarks against local API
npm run benchmark

# Or run with custom parameters
npm run benchmark -- --duration 30 --connections 50
```

## Metrics Collected

| Metric | Description |
|--------|-------------|
| p50 Latency | Median response time |
| p95 Latency | 95th percentile — most user experience |
| p99 Latency | 99th percentile — tail latency |
| RPS | Requests per second throughput |
| Error Rate | Percentage of non-2xx responses |
| TTFB | Time to first byte |

## Endpoints Benchmarked

All `/api/*` endpoints are tested with realistic payloads:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/users`
- `POST /api/users`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/proposals`
- `POST /api/proposals`
- `GET /api/search`
- `GET /api/notifications`
- `POST /api/payments`

## Regression Tracking

Benchmark results are saved to `benchmark-results/` with timestamps. Compare across builds:

```bash
# Compare current vs previous
npm run benchmark:compare benchmark-results/2026-05-22.json benchmark-results/2026-05-23.json
```

## CI Integration

```yaml
# .github/workflows/benchmark.yml
- name: Run benchmarks
  run: npm run benchmark
- name: Upload results
  uses: actions/upload-artifact@v4
  with:
    name: benchmark-results
    path: benchmark-results/
```