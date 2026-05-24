# API Benchmark Suite

Comprehensive benchmarking for all FreelanceFlow API endpoints.

## Quick Start

```bash
# Install dependencies (only Python stdlib + requests needed)
pip install requests

# Run full benchmark against local server
python benchmarks/api_benchmark.py

# Run smoke test (2s per endpoint, 2 workers)
python benchmarks/api_benchmark.py --smoke

# Run against a specific URL
python benchmarks/api_benchmark.py --base-url https://staging.example.com

# Run CI smoke gate (checks against thresholds)
python benchmarks/smoke_check.py
```

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` and adjust:

```bash
cp .env.benchmark.example .env.benchmark
```

Or use environment variables:
- `BENCHMARK_URL` — Target server URL (default: `http://localhost:3000`)
- `BENCHMARK_DURATION` — Seconds per endpoint (default: `10`)
- `BENCHMARK_CONCURRENCY` — Concurrent workers (default: `10`)

## Metrics Captured

Per endpoint:
- **p50, p95, p99 latency** (ms)
- **Requests per second** (peak and sustained)
- **Error rate** (%)
- **Time to first byte (TTFB)** (p50, p95, p99)
- **Status code distribution**

## Output

Results are written to `benchmarks/results/`:
- `benchmark_results.json` — Machine-readable JSON
- `benchmark_results.md` — Human-readable Markdown summary

## Thresholds

`thresholds.json` defines per-endpoint regression limits:
- `p99_latency_ms` — Maximum acceptable p99 latency
- `error_rate_pct` — Maximum acceptable error rate

The CI smoke gate (`smoke_check.py`) fails if any endpoint exceeds its threshold.

## CI Integration

```yaml
# GitHub Actions example
- name: Smoke Benchmark
  run: |
    npm start &
    sleep 3
    python benchmarks/smoke_check.py
```

## Endpoints Covered

| Route | Method | Auth |
|-------|--------|------|
| `/health` | GET | No |
| `/api/auth/register` | POST | No |
| `/api/auth/login` | POST | No |
| `/api/auth/oauth/:provider/callback` | GET | No |
| `/api/auth/refresh` | POST | No |
| `/api/users` | GET/POST | No |
| `/api/jobs` | GET/POST | No |
| `/api/proposals` | GET/POST | No |
| `/api/payments` | POST | No |
| `/api/reviews` | GET/POST | No |
| `/api/messages` | GET/POST | No |
| `/api/notifications` | GET/POST | No |
| `/api/uploads` | POST | No |
| `/api/search` | GET | No |
| `/api/admin/metrics` | GET | Yes |
