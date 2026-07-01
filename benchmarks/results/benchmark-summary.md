# API Benchmark Results

**Run at:** 2026-05-31T08:56:29.505Z
**Tool:** autocannon (10 connections, 5s duration per endpoint)
**Runtime:** Node.js v22.22.3

| Endpoint | Method | p50 | p95 | p99 | RPS | Error % |
|----------|--------|-----|-----|-----|-----|---------|
| GET /health | GET | 1ms | 3ms | 3ms | 5743.6 | 0% |
| POST /auth/register | POST | 1ms | 4ms | 4ms | 5050.6 | 0% |
| POST /auth/login | POST | 1ms | 3ms | 3ms | 5550 | 0% |
| GET /users | GET | 1ms | 3ms | 3ms | 6491.6 | 0% |
| POST /users | POST | 1ms | 4ms | 4ms | 5355.6 | 0% |
| GET /jobs | GET | 1ms | 3ms | 3ms | 6485.2 | 0% |
| POST /jobs | POST | 1ms | 4ms | 4ms | 5237.2 | 0% |
| GET /proposals | GET | 1ms | 3ms | 3ms | 6583.6 | 0% |
| POST /proposals | POST | 1ms | 3ms | 3ms | 5552.4 | 0% |
| POST /payments | POST | 1ms | 3ms | 3ms | 5602 | 0% |
| GET /reviews | GET | 1ms | 3ms | 3ms | 6570.8 | 0% |
| POST /reviews | POST | 1ms | 3ms | 3ms | 5551.6 | 0% |
| GET /messages | GET | 1ms | 3ms | 3ms | 6565.2 | 0% |
| POST /messages | POST | 1ms | 3ms | 3ms | 5568.4 | 0% |
| GET /notifications | GET | 1ms | 3ms | 3ms | 6526.8 | 0% |
| POST /notifications | POST | 1ms | 3ms | 3ms | 5501.2 | 0% |
| GET /search?q=js | GET | 1ms | 3ms | 3ms | 6303.6 | 0% |
| POST /uploads | POST | 1ms | 3ms | 3ms | 6519.6 | 0% |
| GET /admin/metrics | GET | 1ms | 3ms | 3ms | 6538 | 0% |

## Observations

All endpoints perform within bounds (p99 < 100ms).

---

Benchmark executed by LUMEN autonomous agent.