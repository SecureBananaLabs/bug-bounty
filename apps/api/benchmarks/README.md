# API Benchmark Suite

Comprehensive API endpoint benchmarking for the FreelanceFlow platform.

## Quick Start

```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Ubuntu/Debian)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Run benchmarks
k6 run benchmarks/all-endpoints.js
```

## What Gets Tested

All ` /api/` endpoints are benchmarked:

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/*` | POST | Authentication |
| `/api/users/*` | GET/POST | User management |
| `/api/jobs/*` | GET/POST | Job listings |
| `/api/proposals/*` | GET/POST | Proposals |
| `/api/payments/*` | GET/POST | Payments |
| `/api/reviews/*` | GET/POST | Reviews |
| `/api/messages/*` | GET/POST | Messaging |
| `/api/notifications/*` | GET/POST | Notifications |
| `/api/uploads/*` | POST | File uploads |
| `/api/search/*` | GET | Search |
| `/api/admin/*` | GET | Admin |

## Metrics Captured

- **p50, p95, p99 latency** (ms)
- **Requests per second** (throughput)
- **Error rate** (%)
- **TTFB** (Time to First Byte, ms)

## Configuration

Create a `.env.benchmark` file:

```
TARGET_HOST=http://localhost:3000
BENCHMARK_TOKEN=your_test_token_here
DURATION_SECONDS=30
VIRTUAL_USERS=10
```
