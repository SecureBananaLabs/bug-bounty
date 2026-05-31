# API Benchmark Suite

Measures **p50, p95, p99 latency**, **RPS**, **error rate**, and **TTFB** for all FreelanceFlow `/api/` endpoints.

## Quick start

```bash
cd benchmarks
npm install
npm run benchmark
```

## Configuration

Copy `.env.benchmark.example` → `.env.benchmark` and fill in:

| Variable | Default | Description |
|---|---|---|
| `BENCHMARK_HOST` | `http://localhost:3000` | Target server URL |
| `BENCHMARK_TOKEN` | _(empty)_ | JWT for auth-protected routes |
| `BENCHMARK_REFRESH_TOKEN` | _(empty)_ | Refresh token for `/api/auth/refresh` |
| `STAGING_URL` | _(empty)_ | Shortcut for `npm run benchmark:staging` |

## Scripts

| Command | Description |
|---|---|
| `npm run benchmark` | Run full suite (10s × 10 conns per endpoint) |
| `npm run benchmark:ci` | Short CI run (5s × 20 conns), writes `benchmark-report.json` |
| `npm run benchmark:staging` | Run against `$STAGING_URL` (15s × 50 conns) |

## CLI options

```
--duration <s>       Seconds per endpoint (default: 10)
--connections <n>    Concurrent connections (default: 10)
--pipelining <n>     Pipelining factor (default: 1)
--report <path>      Write JSON report to file
```

Example:

```bash
BENCHMARK_HOST=http://localhost:3000 \
BENCHMARK_TOKEN=eyJ... \
node benchmark.js --duration 20 --connections 50 --report ./results.json
```

## Endpoints covered

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/refresh` | public |
| GET | `/api/jobs` | optional |
| POST | `/api/jobs` | required |
| GET | `/api/users` | optional |
| GET | `/api/search?q=design` | optional |
| GET | `/api/proposals` | required |
| POST | `/api/proposals` | required |
| GET | `/api/reviews` | optional |
| GET | `/api/messages` | required |
| GET | `/api/notifications` | required |
| POST | `/api/payments` | required |
| GET | `/api/admin/metrics` | admin |

## Output

```
🔥 FreelanceFlow API Benchmark
   Host:        http://localhost:3000
   Duration:    10s per endpoint
   Connections: 10
   Endpoints:   14

  Running GET /api/jobs ... p50=4ms  p99=12ms  rps=2310  err=0.00%
  ...

📊 Summary

+---------------------------+--------+--------+--------+---------+----------------+-------------+
| endpoint                  | p50_ms | p95_ms | p99_ms | rps_avg | error_rate_pct | ttfb_p50_ms |
+---------------------------+--------+--------+--------+---------+----------------+-------------+
| GET /api/jobs             | 4      | 9      | 12     | 2310    | 0.00           | 4           |
| POST /api/auth/login      | 38     | 72     | 95     | 248     | 0.00           | 38          |
...

⚠️  Top 3 slowest endpoints (p99):
  1. POST /api/auth/login  →  p99=95ms
  2. POST /api/payments    →  p99=61ms
  3. POST /api/jobs        →  p99=28ms
```

## Re-running for regression tracking

The `--report` flag writes a machine-readable JSON file. Commit `benchmark-report.json` to track regressions across builds:

```bash
npm run benchmark:ci
git add benchmark-report.json
git commit -m "chore: update benchmark baseline"
```
