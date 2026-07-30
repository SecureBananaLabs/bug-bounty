# API Benchmark Suite

Automated performance benchmarking for all `/api/` endpoints.

## Quick Start

```bash
# Ensure the API server is running
cd apps/api && npm run dev

# In another terminal, run benchmarks
cd benchmarks && npm run benchmark
```

## Usage

### Full Benchmark (10 connections, 10s)
```bash
npm run benchmark
```

### Quick Smoke Test (2 connections, 3s) — for CI
```bash
npm run benchmark:quick
```

### Custom Configuration
```bash
BENCHMARK_TARGET=https://staging.example.com \
BENCHMARK_CONNECTIONS=20 \
BENCHMARK_DURATION=30 \
BENCHMARK_AUTH_TOKEN=eyJ... \
npm run benchmark
```

## Output

Results are written to `benchmarks/results/`:
- `benchmark-{timestamp}.json` — Full JSON results
- `benchmark-summary.md` — Human-readable markdown summary
- `latest.json` — Latest run (overwritten each run)

## Thresholds (CI Gate)

Defined in `thresholds.json`. CI fails if:
- **Smoke**: p99 > 500ms or error rate > 5%
- **Full**: p99 > 2000ms or error rate > 10%

## Endpoints Tested

| Endpoint | Method | Auth | Description |
|----------|--------|:----:|-------------|
| `/health` | GET | No | Health check |
| `/api/auth/register` | POST | No | User registration |
| `/api/auth/login` | POST | No | User login |
| `/api/auth/refresh` | POST | Yes | Token refresh |
| `/api/users` | GET | Yes | List users |
| `/api/users/me` | GET | Yes | Current user |
| `/api/jobs` | GET | No | List jobs |
| `/api/jobs` | POST | Yes | Create job |
| `/api/proposals` | GET | Yes | List proposals |
| `/api/payments` | GET | Yes | List payments |
| `/api/reviews` | GET | No | List reviews |
| `/api/messages` | GET | Yes | List messages |
| `/api/notifications` | GET | Yes | List notifications |
| `/api/uploads` | POST | Yes | File upload (empty) |
| `/api/search` | GET | No | Search |
| `/api/admin/stats` | GET | Yes | Admin stats |

## Architecture

```
benchmarks/
├── run-benchmarks.js      # Main benchmark runner
├── benchmark-config.js    # Endpoint definitions & settings
├── thresholds.json        # CI pass/fail thresholds
├── package.json           # Dependencies (autocannon)
├── results/               # Output directory
│   ├── latest.json        # Most recent run
│   ├── benchmark-*.json   # Historical runs
│   └── benchmark-summary.md
└── README.md
```
