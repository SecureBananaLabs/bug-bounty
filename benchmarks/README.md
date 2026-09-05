# FreelanceFlow API Benchmark Suite

Benchmark suite for all platform API endpoints using [autocannon](https://github.com/mcollina/autocannon).

## Quick Start

```bash
cd benchmarks && npm install
npm run benchmark
```

## Configuration

| Env Variable | Default | Description |
|---|---|---|
| `BENCH_URL` | `http://localhost:4000` | Target API base URL |
| `SMOKE` | `false` | Set to `true` for CI smoke test (5s, 10 connections) |

### Environment Template

Copy `.env.benchmark` and fill in your target:

```bash
cp .env.benchmark .env
# Edit .env with your API host
```

## Benchmarked Endpoints

| Endpoint | Method | Path | Notes |
|---|---|---|---|
| Health Check | GET | `/health` | Unauthenticated |
| List Jobs | GET | `/api/jobs` | Unauthenticated |
| Create Job | POST | `/api/jobs` | Auth required |
| Register | POST | `/api/auth/register` | Unauthenticated |
| Login | POST | `/api/auth/login` | Unauthenticated |
| List Users | GET | `/api/users` | Auth required |
| List Reviews | GET | `/api/reviews` | Auth required |
| List Payments | GET | `/api/payments` | Auth required |
| Create Payment | POST | `/api/payments` | Auth required |
| Notifications | GET | `/api/notifications` | Auth required |
| Search | GET | `/api/search` | Unauthenticated |

## Metrics Captured

Per endpoint:
- **p50, p95, p99 latency** (ms)
- **Requests per second** (peak and sustained)
- **Error rate** (%)
- **Time to first byte** (TTFB, ms)

## Output

Results are saved to `benchmarks/results/` as:
- `bench-{timestamp}.json` — Full results
- `bench-{timestamp}.md` — Human-readable summary

## CI Smoke Test

```bash
SMOKE=true npm run benchmark:smoke
```

Exits with code **1** if any p99 latency exceeds thresholds defined in `thresholds.json`.

## Threshold Configuration

Edit `thresholds.json` to adjust acceptable p99 latency and error rate per endpoint.

## Run with Benchmark Token

For auth-protected routes, set `BENCH_TOKEN` in your environment:

```bash
BENCH_TOKEN=your_jwt_token npm run benchmark
```