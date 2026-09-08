# 📊 FreelanceFlow Benchmark Report

**Generated:** 2026-06-11T11:26:01.059Z
**Target:** http://localhost:4000

## 📈 Summary

| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Errors | TTFB (ms) |
|----------|----------|----------|----------|-----|--------|-----------|
| health | 0 | 0 | 0 | 28280.0 | 0 | 0.04 |
| register | 0 | 1 | 1 | 14738.5 | 0 | 0.07 |
| login | 0 | 1 | 1 | 15131.3 | 0 | 0.07 |
| list_jobs | 0 | 0 | 0 | 27800.0 | 0 | 0.04 |
| search | 0 | 0 | 0 | 26227.2 | 0 | 0.04 |

## 🔍 Detailed

### health (`GET /health`)

- **Duration:** 10s | **Connections:** 10
- **Latency:** avg=0.01ms, p50=0ms, p95=0ms, p99=0ms, max=6ms
- **Throughput:** avg=26416221.1 req/s, total=290557126
- **Errors:** 0 | **Timeouts:** 0 | **Non-2xx:** 0

### register (`POST /api/auth/register`)

- **Duration:** 10s | **Connections:** 10
- **Latency:** avg=0.12ms, p50=0ms, p95=1ms, p99=1ms, max=6ms
- **Throughput:** avg=17581893.8 req/s, total=193404388
- **Errors:** 0 | **Timeouts:** 0 | **Non-2xx:** 0

### login (`POST /api/auth/login`)

- **Duration:** 10s | **Connections:** 10
- **Latency:** avg=0.12ms, p50=0ms, p95=1ms, p99=1ms, max=5ms
- **Throughput:** avg=17232616.7 req/s, total=189569465
- **Errors:** 0 | **Timeouts:** 0 | **Non-2xx:** 0

### list_jobs (`GET /api/jobs`)

- **Duration:** 10s | **Connections:** 10
- **Latency:** avg=0.01ms, p50=0ms, p95=0ms, p99=0ms, max=2ms
- **Throughput:** avg=25933637.8 req/s, total=285291807
- **Errors:** 0 | **Timeouts:** 0 | **Non-2xx:** 0

### search (`GET /api/search?q=test`)

- **Duration:** 10s | **Connections:** 10
- **Latency:** avg=0.01ms, p50=0ms, p95=0ms, p99=0ms, max=2ms
- **Throughput:** avg=25832652.8 req/s, total=258333980
- **Errors:** 0 | **Timeouts:** 0 | **Non-2xx:** 0

