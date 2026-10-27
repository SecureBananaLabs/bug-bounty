# API benchmark (baseline)

2026-10-25T00:51:01.713Z — 2s per endpoint, concurrency 4.

In-memory placeholder services, not database/Stripe production performance; no warmup, includes first request; fixed-duration closed-loop load; body fully consumed; TTFB measured at response headers; secret headers and response bodies never stored.

| Endpoint | n | p50 ms | p95 ms | p99 ms | sustained RPS | peak 1s RPS | errors % | TTFB p50 ms | TTFB p95 ms | TTFB p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| POST /api/auth/register | 1735 | 4.15 | 6.22 | 11.24 | 866.56 | 936.00 | 0.00 | 4.11 | 6.15 | 11.20 |
| POST /api/auth/login | 2296 | 3.24 | 5.19 | 7.95 | 1146.85 | 1172.00 | 0.00 | 3.21 | 5.16 | 7.91 |
| GET /api/auth/oauth/github/callback | 3464 | 2.10 | 3.46 | 5.70 | 1731.51 | 1754.00 | 0.00 | 2.07 | 3.43 | 5.50 |
| POST /api/auth/refresh | 2872 | 2.62 | 3.02 | 6.36 | 1434.50 | 1492.00 | 0.00 | 2.60 | 3.00 | 6.25 |
| GET /api/users | 4096 | 1.81 | 2.18 | 4.61 | 2046.51 | 2048.00 | 0.00 | 1.79 | 2.15 | 4.59 |
| POST /api/users | 3638 | 2.05 | 2.38 | 4.63 | 1818.03 | 1841.00 | 0.00 | 2.03 | 2.36 | 4.61 |
| GET /api/jobs | 4212 | 1.80 | 1.98 | 4.09 | 2105.71 | 2108.00 | 0.00 | 1.78 | 1.96 | 4.07 |
| POST /api/jobs | 3416 | 2.22 | 2.68 | 4.89 | 1706.82 | 1740.00 | 0.00 | 2.20 | 2.65 | 4.85 |
| GET /api/proposals | 4141 | 1.81 | 2.12 | 4.27 | 2069.81 | 2096.00 | 0.00 | 1.79 | 2.10 | 4.24 |
| POST /api/proposals | 3656 | 2.10 | 2.26 | 4.44 | 1826.73 | 1828.00 | 0.00 | 2.08 | 2.24 | 4.42 |
| POST /api/payments | 3624 | 2.08 | 2.28 | 5.33 | 1811.81 | 1820.00 | 0.00 | 2.06 | 2.25 | 5.31 |
| GET /api/reviews | 4306 | 1.77 | 1.92 | 3.68 | 2152.04 | 2172.00 | 0.00 | 1.75 | 1.90 | 3.66 |
| POST /api/reviews | 3607 | 2.08 | 2.26 | 5.59 | 1802.34 | 1820.00 | 0.00 | 2.06 | 2.24 | 5.57 |
| GET /api/messages | 4284 | 1.79 | 1.94 | 3.69 | 2141.72 | 2151.00 | 0.00 | 1.77 | 1.92 | 3.67 |
| POST /api/messages | 3484 | 2.16 | 2.71 | 5.22 | 1740.91 | 1764.00 | 0.00 | 2.14 | 2.69 | 5.19 |
| GET /api/notifications | 4265 | 1.79 | 1.96 | 3.69 | 2131.79 | 2156.00 | 0.00 | 1.77 | 1.94 | 3.67 |
| POST /api/notifications | 3033 | 2.14 | 4.77 | 11.40 | 1515.96 | 1717.00 | 0.00 | 2.12 | 4.74 | 10.99 |
| POST /api/uploads | 2524 | 2.93 | 3.73 | 6.78 | 1260.71 | 1356.00 | 0.00 | 2.91 | 3.69 | 6.75 |
| GET /api/search?q=dashboard | 3736 | 1.97 | 3.09 | 5.09 | 1867.27 | 1928.00 | 0.00 | 1.95 | 3.08 | 5.06 |
| GET /api/admin/metrics | 2860 | 2.63 | 3.37 | 5.78 | 1429.21 | 1472.00 | 0.00 | 2.61 | 3.35 | 5.76 |

Gate: PASS
