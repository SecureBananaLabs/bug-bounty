# API Benchmark Suite

Reproducible benchmark suite for all `/api/` endpoints.

## Quick Start

### Option 1: k6 (recommended for production-grade benchmarking)

```bash
# Install k6
brew install k6       # macOS
sudo apt install k6   # Linux

# Run benchmarks
k6 run benchmarks/api-benchmark.js

# With custom options
k6 run --vus 50 --duration 60s benchmarks/api-benchmark.js

# Output report to JSON
k6 run benchmarks/api-benchmark.js --summary-export=benchmarks/report.json
```

### Option 2: Node.js (zero dependencies)

```bash
node benchmarks/simple-benchmark.js
```

## Metrics Collected

| Metric | Description |
|--------|-------------|
| **p50 latency** | Median response time |
| **p95 latency** | 95th percentile — catches tail latency |
| **p99 latency** | 99th percentile — worst-case performance |
| **RPS** | Requests per second |
| **Error rate** | Percentage of failed requests |
| **TTFB** | Time to first byte |

## Endpoints Covered

All endpoints under `/api/` including:
- Health & meta (`/api/health`, `/api/version`)
- Authentication (`/api/auth/login`, `/api/auth/register`)
- Users (`/api/users`, `/api/users/me`)
- Jobs (`/api/jobs` with search/filter)
- Proposals, Messages, Notifications (auth-protected)
- Reviews, Search, Admin, Upload

## CI Integration

```yaml
# .github/workflows/benchmark.yml
- name: Run API benchmarks
  run: |
    k6 run benchmarks/api-benchmark.js --summary-export=benchmarks/ci-report.json
- name: Check thresholds
  run: |
    node scripts/check-benchmark-thresholds.js benchmarks/ci-report.json
```

## Reports

- `benchmarks/report.json` — k6 detailed report
- `benchmarks/report-simple.json` — Node.js benchmark report
