# API Benchmark Suite

Benchmarks the FreelanceFlow API endpoints measuring p50, p95, p99 latency,
requests per second (RPS), error rate, and time to first byte (TTFB).

## Usage

```bash
# Start the API server first
npm run dev -w apps/api

# In another terminal, run benchmarks
cd apps/api/benchmarks
node benchmark.js
```

## Configuration (via environment variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `BENCHMARK_URL` | `http://localhost:3000` | Target API URL |
| `BENCHMARK_CONCURRENCY` | `10` | Concurrent connections |
| `BENCHMARK_REQUESTS` | `500` | Requests per endpoint |
| `BENCHMARK_WARMUP` | `50` | Warmup requests per endpoint |
| `BENCHMARK_TIMEOUT` | `10000` | Request timeout (ms) |

## Endpoints Tested

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/jobs` | List jobs |
| GET | `/api/proposals` | List proposals |
| GET | `/api/users` | List users |
| GET | `/api/search?q=developer` | Search |
| GET | `/api/notifications` | List notifications |
| GET | `/api/messages` | List messages |
| GET | `/api/reviews` | List reviews |

## Output

Results are saved to `results/` directory as:
- `benchmark-{timestamp}.json` — raw data
- `benchmark-{timestamp}.md` — markdown summary table

Issue: #30 — Benchmark APIs with p50, p95, p99 latency, RPS, error rate and TTFB
Bounty: $750 USD
