# API Benchmark Summary

- Mode: smoke
- Target: local-express
- Started: 2026-05-21T03:25:23.773Z
- Routes covered: 21
- Total requests: 42
- Error rate: 0
- Max p99 latency: 22.07 ms
- Max p99 TTFB: 21.31 ms

| Endpoint | Requests | Error rate | p50 ms | p95 ms | p99 ms | p99 TTFB ms | Sustained RPS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET /health | 2 | 0 | 3.66 | 22.07 | 22.07 | 21.31 | 75.29 |
| POST /api/auth/register | 2 | 0 | 2.03 | 12.75 | 12.75 | 12.64 | 133.38 |
| POST /api/auth/login | 2 | 0 | 1.62 | 1.97 | 1.97 | 1.87 | 512.28 |
| POST /api/auth/refresh | 2 | 0 | 1.52 | 1.6 | 1.6 | 1.42 | 575.33 |
| GET /api/auth/oauth/github/callback | 2 | 0 | 1.54 | 1.85 | 1.85 | 1.71 | 546.84 |
| GET /api/users | 2 | 0 | 1.1 | 1.22 | 1.22 | 1.14 | 806.46 |
| POST /api/users | 2 | 0 | 1.31 | 1.7 | 1.7 | 1.62 | 626.48 |
| GET /api/jobs | 2 | 0 | 1.35 | 1.54 | 1.54 | 1.45 | 640.91 |
| POST /api/jobs | 2 | 0 | 1.28 | 2.35 | 2.35 | 2.27 | 528.39 |
| GET /api/proposals | 2 | 0 | 1.35 | 1.36 | 1.36 | 1.28 | 685.21 |
| POST /api/proposals | 2 | 0 | 0.71 | 1.34 | 1.34 | 1.26 | 914.79 |
| POST /api/payments | 2 | 0 | 0.57 | 0.72 | 0.72 | 0.65 | 1448.66 |
| GET /api/reviews | 2 | 0 | 0.49 | 0.5 | 0.5 | 0.44 | 1865.74 |
| POST /api/reviews | 2 | 0 | 0.68 | 1.32 | 1.32 | 1.23 | 935.11 |
| GET /api/messages | 2 | 0 | 1.08 | 1.19 | 1.19 | 1.1 | 825.07 |
| POST /api/messages | 2 | 0 | 1.32 | 1.58 | 1.58 | 1.46 | 656.01 |
| GET /api/notifications | 2 | 0 | 0.46 | 1.72 | 1.72 | 1.67 | 888.15 |
| POST /api/notifications | 2 | 0 | 0.37 | 0.48 | 0.48 | 0.44 | 2000 |
| POST /api/uploads | 2 | 0 | 1.93 | 7.5 | 7.5 | 7.41 | 208.61 |
| GET /api/search?q=benchmark%20api%20developer | 2 | 0 | 1.22 | 1.77 | 1.77 | 1.72 | 616.93 |
| GET /api/admin/metrics | 2 | 0 | 2.09 | 3.26 | 3.26 | 3.12 | 362.4 |
