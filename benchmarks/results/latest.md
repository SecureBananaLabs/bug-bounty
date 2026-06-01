# API Benchmark Results

- Generated: 2026-06-01T16:07:41.032Z
- Mode: full
- Target: http://127.0.0.1:62834
- Requests per endpoint: 8
- Concurrency: 4
- Runtime: v24.12.0 on Windows_NT 10.0.26200 x64
- CPU cores: 32
- Memory: 31957 MB total

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error rate | Statuses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GET /health | 8 | 6.7 | 22.51 | 22.51 | 21.7 | 203.27 | 8 | 0% | 200: 8 |
| POST /api/auth/register | 8 | 3.74 | 14.18 | 14.18 | 14.12 | 439.12 | 8 | 0% | 201: 8 |
| POST /api/auth/login | 8 | 3.26 | 4.24 | 4.24 | 4.21 | 1079.21 | 8 | 0% | 200: 8 |
| GET /api/auth/oauth/:provider/callback | 8 | 1.77 | 2.19 | 2.19 | 2.15 | 1987.63 | 8 | 0% | 200: 8 |
| POST /api/auth/refresh | 8 | 1.72 | 2.14 | 2.14 | 2.11 | 2071.95 | 8 | 0% | 200: 8 |
| GET /api/users | 8 | 1.37 | 1.6 | 1.6 | 1.57 | 2471.04 | 8 | 0% | 200: 8 |
| POST /api/users | 8 | 1.85 | 2.33 | 2.33 | 2.29 | 1940.15 | 8 | 0% | 201: 8 |
| GET /api/jobs | 8 | 1.44 | 1.99 | 1.99 | 1.96 | 2394.99 | 8 | 0% | 200: 8 |
| POST /api/jobs | 8 | 2.29 | 2.8 | 2.8 | 2.76 | 1579.5 | 8 | 0% | 201: 8 |
| GET /api/proposals | 8 | 1.3 | 1.49 | 1.49 | 1.46 | 2751.22 | 8 | 0% | 200: 8 |
| POST /api/proposals | 8 | 1.49 | 1.99 | 1.99 | 1.96 | 2344.12 | 8 | 0% | 201: 8 |
| POST /api/payments | 8 | 1.83 | 2.23 | 2.23 | 2.19 | 1994.61 | 8 | 0% | 201: 8 |
| GET /api/reviews | 8 | 1.33 | 1.52 | 1.52 | 1.49 | 2697.78 | 8 | 0% | 200: 8 |
| POST /api/reviews | 8 | 1.63 | 2.08 | 2.08 | 2.04 | 2132.99 | 8 | 0% | 201: 8 |
| GET /api/messages | 8 | 1.59 | 2.17 | 2.17 | 2.13 | 2176.81 | 8 | 0% | 200: 8 |
| POST /api/messages | 8 | 1.52 | 1.94 | 1.94 | 1.91 | 2345.83 | 8 | 0% | 201: 8 |
| GET /api/notifications | 8 | 1.24 | 1.69 | 1.69 | 1.66 | 2631.58 | 8 | 0% | 200: 8 |
| POST /api/notifications | 8 | 1.49 | 1.87 | 1.87 | 1.84 | 2390.2 | 8 | 0% | 201: 8 |
| POST /api/uploads | 8 | 3.21 | 6.62 | 6.62 | 6.59 | 801.71 | 8 | 0% | 201: 8 |
| GET /api/search | 8 | 2.13 | 2.51 | 2.51 | 2.48 | 1747.34 | 8 | 0% | 200: 8 |
| GET /api/admin/metrics | 8 | 1.96 | 2.44 | 2.44 | 2.41 | 1825.36 | 8 | 0% | 200: 8 |

Threshold check: passed.
