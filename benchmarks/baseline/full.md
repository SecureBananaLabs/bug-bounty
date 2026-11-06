# API benchmark results

Generated: 2026-10-15T22:41:08.816Z

Mode: full; 200 measured requests per endpoint, concurrency 4, two warmup requests excluded.

Runtime: v22.23.3; linux 6.8.0-142-generic; DO-Regular; 1 host logical CPU(s). Host memory: 2063577088 bytes total, 1168072704 bytes free at start. Cgroup memory.max: 536870912; cpu.max: 100000 100000.

The current API uses in-memory collections and service placeholders. Local runs bypass only the rate limiter; production rate limiting is unchanged. These measurements are not production database or payment-service benchmarks. Host CPU/memory values can exceed container limits; record limits alongside results.

| Endpoint | p50 ms | p95 ms | p99 ms | sustained RPS | peak RPS | errors % | TTFB p50/p95/p99 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| POST /api/auth/register | 10.33 | 42.21 | 87.82 | 250.37 | 250.37 | 0.00 | 10.18 / 41.89 / 85.02 |
| POST /api/auth/login | 7.63 | 67.83 | 121.42 | 180.02 | 192.00 | 0.00 | 7.57 / 67.69 / 121.33 |
| GET /api/auth/oauth/:provider/callback | 5.15 | 15.50 | 24.08 | 575.75 | 575.75 | 0.00 | 5.06 / 15.45 / 23.99 |
| POST /api/auth/refresh | 8.88 | 28.27 | 37.23 | 343.75 | 343.75 | 0.00 | 8.65 / 28.18 / 37.08 |
| POST /api/users | 16.62 | 49.83 | 62.85 | 165.54 | 172.00 | 0.00 | 16.55 / 49.66 / 62.71 |
| GET /api/users | 8.92 | 23.44 | 27.99 | 368.82 | 368.82 | 0.00 | 8.65 / 22.68 / 26.81 |
| POST /api/jobs | 5.45 | 15.43 | 34.37 | 532.17 | 532.17 | 0.00 | 5.38 / 15.32 / 34.29 |
| GET /api/jobs | 23.34 | 50.57 | 120.40 | 131.69 | 132.00 | 0.00 | 22.62 / 49.86 / 117.89 |
| POST /api/proposals | 5.68 | 15.95 | 18.13 | 552.01 | 552.01 | 0.00 | 5.61 / 15.86 / 17.98 |
| GET /api/proposals | 16.39 | 39.78 | 85.58 | 194.50 | 196.00 | 0.00 | 15.90 / 38.26 / 85.31 |
| POST /api/payments | 12.27 | 24.85 | 27.51 | 304.18 | 304.18 | 0.00 | 12.19 / 24.34 / 27.42 |
| POST /api/reviews | 6.45 | 36.09 | 49.80 | 330.39 | 330.39 | 0.00 | 6.35 / 35.60 / 49.74 |
| GET /api/reviews | 7.99 | 19.37 | 36.46 | 398.89 | 398.89 | 0.00 | 7.87 / 19.26 / 36.31 |
| POST /api/messages | 5.40 | 16.09 | 17.60 | 583.55 | 583.55 | 0.00 | 5.34 / 15.67 / 17.52 |
| GET /api/messages | 28.77 | 87.44 | 140.67 | 108.61 | 120.00 | 0.00 | 27.88 / 87.22 / 135.97 |
| POST /api/notifications | 3.87 | 10.25 | 14.88 | 855.35 | 855.35 | 0.00 | 3.83 / 10.16 / 14.86 |
| GET /api/notifications | 6.87 | 15.03 | 16.98 | 510.47 | 510.47 | 0.00 | 6.79 / 14.57 / 16.67 |
| POST /api/uploads | 12.16 | 34.41 | 58.14 | 243.67 | 243.67 | 0.00 | 11.73 / 34.33 / 58.06 |
| GET /api/search | 4.03 | 28.63 | 41.97 | 588.85 | 588.85 | 0.00 | 4.00 / 28.55 / 41.90 |
| GET /api/admin/metrics | 5.06 | 12.18 | 16.25 | 676.34 | 676.34 | 0.00 | 5.02 / 12.12 / 16.20 |

Regression gate: **PASS**
