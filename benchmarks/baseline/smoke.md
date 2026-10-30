# API benchmark results

Generated: 2026-10-15T22:39:51.136Z

Mode: smoke; 10 measured requests per endpoint, concurrency 1, two warmup requests excluded.

Runtime: v22.23.3; linux 6.8.0-142-generic; DO-Regular; 1 host logical CPU(s). Host memory: 2063577088 bytes total, 1172459520 bytes free at start. Cgroup memory.max: 536870912; cpu.max: 100000 100000.

The current API uses in-memory collections and service placeholders. Local runs bypass only the rate limiter; production rate limiting is unchanged. These measurements are not production database or payment-service benchmarks. Host CPU/memory values can exceed container limits; record limits alongside results.

| Endpoint | p50 ms | p95 ms | p99 ms | sustained RPS | peak RPS | errors % | TTFB p50/p95/p99 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| POST /api/auth/register | 2.78 | 4.72 | 4.72 | 302.64 | 302.64 | 0.00 | 2.65 / 4.31 / 4.31 |
| POST /api/auth/login | 1.77 | 6.74 | 6.74 | 400.29 | 400.29 | 0.00 | 1.64 / 6.59 / 6.59 |
| GET /api/auth/oauth/:provider/callback | 1.35 | 2.22 | 2.22 | 622.27 | 622.27 | 0.00 | 1.22 / 2.07 / 2.07 |
| POST /api/auth/refresh | 1.87 | 3.17 | 3.17 | 418.63 | 418.63 | 0.00 | 1.72 / 3.00 / 3.00 |
| POST /api/users | 1.41 | 2.69 | 2.69 | 586.75 | 586.75 | 0.00 | 1.29 / 2.51 / 2.51 |
| GET /api/users | 4.29 | 13.49 | 13.49 | 184.69 | 184.69 | 0.00 | 3.90 / 10.13 / 10.13 |
| POST /api/jobs | 4.20 | 11.76 | 11.76 | 177.74 | 177.74 | 0.00 | 3.60 / 11.54 / 11.54 |
| GET /api/jobs | 3.97 | 6.39 | 6.39 | 215.84 | 215.84 | 0.00 | 3.70 / 6.23 / 6.23 |
| POST /api/proposals | 1.32 | 8.44 | 8.44 | 438.27 | 438.27 | 0.00 | 1.20 / 8.28 / 8.28 |
| GET /api/proposals | 1.35 | 2.75 | 2.75 | 566.25 | 566.25 | 0.00 | 1.19 / 2.66 / 2.66 |
| POST /api/payments | 2.19 | 4.68 | 4.68 | 342.45 | 342.45 | 0.00 | 2.09 / 4.52 / 4.52 |
| POST /api/reviews | 1.55 | 7.48 | 7.48 | 398.97 | 398.97 | 0.00 | 1.45 / 7.34 / 7.34 |
| GET /api/reviews | 3.20 | 7.00 | 7.00 | 269.11 | 269.11 | 0.00 | 2.02 / 3.06 / 3.06 |
| POST /api/messages | 1.17 | 5.51 | 5.51 | 540.60 | 540.60 | 0.00 | 1.10 / 5.38 / 5.38 |
| GET /api/messages | 1.08 | 3.34 | 3.34 | 636.06 | 636.06 | 0.00 | 1.02 / 3.25 / 3.25 |
| POST /api/notifications | 1.17 | 4.55 | 4.55 | 614.38 | 614.38 | 0.00 | 1.07 / 4.40 / 4.40 |
| GET /api/notifications | 0.99 | 1.26 | 1.26 | 919.90 | 919.90 | 0.00 | 0.92 / 1.18 / 1.18 |
| POST /api/uploads | 4.27 | 23.90 | 23.90 | 163.94 | 163.94 | 0.00 | 4.11 / 19.28 / 19.28 |
| GET /api/search | 2.20 | 3.85 | 3.85 | 410.39 | 410.39 | 0.00 | 1.71 / 3.72 / 3.72 |
| GET /api/admin/metrics | 3.97 | 6.61 | 6.61 | 237.95 | 237.95 | 0.00 | 3.83 / 6.45 / 6.45 |

Regression gate: **PASS**
