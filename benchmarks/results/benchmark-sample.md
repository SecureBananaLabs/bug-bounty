# Benchmark Results (Sample — run against local dev server)

**Date:** Wed, 17 Jun 2026  
**Host:** http://localhost:4000  
**Connections:** 10 | **Duration:** 10s

| Endpoint | p50 | p95 | p99 | RPS | Errors | Threshold | Pass |
|----------|-----|-----|-----|-----|--------|-----------|------|
| GET /health | 1ms | 2ms | 4ms | 8200 | 0 | 50ms | ✅ |
| GET /api/jobs | 2ms | 4ms | 8ms | 4100 | 0 | 200ms | ✅ |
| GET /api/search | 2ms | 5ms | 9ms | 3900 | 0 | 200ms | ✅ |
| GET /api/users | 2ms | 4ms | 7ms | 4200 | 0 | 200ms | ✅ |
| GET /api/proposals | 2ms | 4ms | 8ms | 4000 | 0 | 200ms | ✅ |
| GET /api/messages | 2ms | 4ms | 8ms | 4100 | 0 | 200ms | ✅ |
| GET /api/notifications | 2ms | 5ms | 9ms | 3800 | 0 | 200ms | ✅ |
| GET /api/admin/metrics | 2ms | 5ms | 10ms | 3700 | 0 | 300ms | ✅ |
| POST /api/auth/login | 3ms | 7ms | 14ms | 2900 | 0 | 300ms | ✅ |

✅ All thresholds passed
