# API benchmark (smoke)

2026-10-25T00:50:21.024Z — 1s per endpoint, concurrency 1.

In-memory placeholder services, not database/Stripe production performance; no warmup, includes first request; fixed-duration closed-loop load; body fully consumed; TTFB measured at response headers; secret headers and response bodies never stored.

| Endpoint | n | p50 ms | p95 ms | p99 ms | sustained RPS | peak 1s RPS | errors % | TTFB p50 ms | TTFB p95 ms | TTFB p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| POST /api/auth/register | 781 | 1.03 | 1.79 | 3.40 | 780.35 | 780.00 | 0.00 | 0.99 | 1.57 | 3.26 |
| POST /api/auth/login | 948 | 0.93 | 1.11 | 3.10 | 947.75 | 947.00 | 0.00 | 0.89 | 1.07 | 3.06 |
| GET /api/auth/oauth/github/callback | 1474 | 0.57 | 0.72 | 2.52 | 1473.34 | 1473.00 | 0.00 | 0.54 | 0.68 | 2.37 |
| POST /api/auth/refresh | 1180 | 0.76 | 0.86 | 1.47 | 1179.12 | 1179.00 | 0.00 | 0.72 | 0.83 | 1.44 |
| GET /api/users | 1473 | 0.51 | 1.20 | 3.52 | 1472.63 | 1472.00 | 0.00 | 0.48 | 1.09 | 3.48 |
| POST /api/users | 1271 | 0.60 | 1.26 | 4.82 | 1270.94 | 1270.00 | 0.00 | 0.56 | 1.18 | 4.78 |
| GET /api/jobs | 1520 | 0.47 | 1.15 | 3.59 | 1518.98 | 1519.00 | 0.00 | 0.44 | 1.03 | 3.10 |
| POST /api/jobs | 1368 | 0.58 | 1.21 | 2.99 | 1367.44 | 1367.00 | 0.00 | 0.56 | 1.14 | 2.86 |
| GET /api/proposals | 1953 | 0.45 | 0.52 | 0.61 | 1952.11 | 1952.00 | 0.00 | 0.43 | 0.50 | 0.59 |
| POST /api/proposals | 1630 | 0.54 | 0.65 | 1.10 | 1629.73 | 1629.00 | 0.00 | 0.51 | 0.62 | 0.95 |
| POST /api/payments | 1733 | 0.52 | 0.60 | 0.68 | 1732.48 | 1732.00 | 0.00 | 0.50 | 0.57 | 0.65 |
| GET /api/reviews | 1971 | 0.45 | 0.52 | 0.58 | 1970.58 | 1970.00 | 0.00 | 0.43 | 0.50 | 0.56 |
| POST /api/reviews | 1700 | 0.52 | 0.61 | 0.85 | 1699.56 | 1699.00 | 0.00 | 0.50 | 0.59 | 0.82 |
| GET /api/messages | 1928 | 0.46 | 0.54 | 0.65 | 1927.78 | 1927.00 | 0.00 | 0.44 | 0.52 | 0.63 |
| POST /api/messages | 1666 | 0.54 | 0.61 | 1.10 | 1665.49 | 1665.00 | 0.00 | 0.52 | 0.59 | 1.08 |
| GET /api/notifications | 1962 | 0.45 | 0.52 | 0.60 | 1958.85 | 1961.00 | 0.00 | 0.43 | 0.50 | 0.58 |
| POST /api/notifications | 1701 | 0.52 | 0.59 | 0.75 | 1700.07 | 1700.00 | 0.00 | 0.50 | 0.57 | 0.73 |
| POST /api/uploads | 1056 | 0.81 | 1.32 | 3.09 | 1055.68 | 1055.00 | 0.00 | 0.79 | 1.29 | 3.07 |
| GET /api/search?q=dashboard | 1769 | 0.50 | 0.59 | 1.36 | 1768.64 | 1768.00 | 0.00 | 0.47 | 0.57 | 1.33 |
| GET /api/admin/metrics | 1352 | 0.66 | 0.76 | 1.63 | 1351.60 | 1351.00 | 0.00 | 0.64 | 0.74 | 1.61 |

Gate: PASS
