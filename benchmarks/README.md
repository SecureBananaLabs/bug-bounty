# API Benchmark Suite

Reproducible benchmark suite for all FreelanceFlow `/api/` endpoints.

## What it measures
- **Latency**: p50, p95, p99 (ms)
- **Throughput**: requests per second (peak + sustained)
- **Error rate**: percentage of non-2xx responses
- **Time to first byte (TTFB)**: average response start time

## Setup (3 steps)

### 1. Install
```bash
cd benchmarks
npm install
```

### 2. Configure
```bash
cp .env.benchmark.example .env.benchmark
# Edit .env.benchmark with your target host and test token
```

### 3. Run
```bash
npm run benchmark
```

Results are written to `results/` as:
- `benchmark-{timestamp}.json` — raw data
- `benchmark-{timestamp}.md` — human-readable summary

## Run against a specific host
```bash
BENCHMARK_HOST=http://staging.example.com:3001 BENCHMARK_TOKEN=abc123 npm run benchmark
```

## CI smoke test
```bash
npm run benchmark:smoke
```
Runs at low concurrency (5 connections, 5 seconds). Fails if any endpoint exceeds its p99 threshold defined in `thresholds.json`.

## Endpoints covered
| Endpoint | Method | Auth? |
|----------|--------|-------|
| `/health` | GET | No |
| `/api/auth/register` | POST | No |
| `/api/auth/login` | POST | No |
| `/api/users` | GET | Yes |
| `/api/jobs` | GET / POST | Yes |
| `/api/proposals` | GET | Yes |
| `/api/reviews` | GET | Yes |
| `/api/messages` | GET | Yes |
| `/api/notifications` | GET | Yes |
| `/api/search?q=javascript` | GET | Yes |
| `/api/admin/metrics` | GET | Yes |

## Thresholds
All threshold values are stored in `thresholds.json`. Adjust per environment.

## Regression tracking
Compare two benchmark runs:
```bash
node compare.js results/benchmark-123.json results/benchmark-456.json
```
