# Benchmark Results

**Target:** http://localhost:4000
**Connections:** 5 | **Duration:** 2s per endpoint

| Endpoint | Method | Path | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate | TTFB (ms) | Status |
|---|---|---|---|---|---|---|---|---|---|
| Health Check | GET | `/health` | 1 | undefined | 3 | 3206.00 | 0.00% | 1 | ✅ PASS |
| Get Users | GET | `/api/users` | 1 | undefined | 3 | 3174.00 | 0.00% | 1 | ✅ PASS |
| Get Jobs | GET | `/api/jobs` | 1 | undefined | 4 | 3090.00 | 0.00% | 1 | ✅ PASS |
| Search | GET | `/api/search?q=test` | 0 | undefined | 2 | 5169.50 | 0.00% | 1 | ✅ PASS |
| Admin Metrics | GET | `/api/admin/metrics` | 0 | undefined | 1 | 8785.00 | 0.00% | 1 | ✅ PASS |
| Post Job | POST | `/api/jobs` | 2 | undefined | 8 | 1976.50 | 0.00% | 1 | ✅ PASS |
