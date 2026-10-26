# API Benchmark Summary

- Mode: full
- Target: local-express
- Started: 2026-05-21T03:25:49.696Z
- Routes covered: 21
- Total requests: 126
- Error rate: 0
- Max p99 latency: 31.96 ms
- Max p99 TTFB: 31.35 ms

| Endpoint | Requests | Error rate | p50 ms | p95 ms | p99 ms | p99 TTFB ms | Sustained RPS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET /health | 6 | 0 | 3.71 | 31.96 | 31.96 | 31.35 | 144.37 |
| POST /api/auth/register | 6 | 0 | 5.16 | 26.83 | 26.83 | 26.62 | 161.1 |
| POST /api/auth/login | 6 | 0 | 2.37 | 3.36 | 3.36 | 3.03 | 652.96 |
| POST /api/auth/refresh | 6 | 0 | 2.09 | 2.48 | 2.48 | 2.43 | 917.88 |
| GET /api/auth/oauth/github/callback | 6 | 0 | 1.33 | 1.49 | 1.49 | 1.44 | 1466.53 |
| GET /api/users | 6 | 0 | 0.68 | 1.16 | 1.16 | 1.13 | 2122.95 |
| POST /api/users | 6 | 0 | 1.29 | 1.49 | 1.49 | 1.42 | 1473.75 |
| GET /api/jobs | 6 | 0 | 0.72 | 1.6 | 1.6 | 1.57 | 1817.81 |
| POST /api/jobs | 6 | 0 | 1.91 | 2.25 | 2.25 | 2.19 | 915.41 |
| GET /api/proposals | 6 | 0 | 0.92 | 1.22 | 1.22 | 1.19 | 1870.69 |
| POST /api/proposals | 6 | 0 | 1.15 | 1.49 | 1.49 | 1.37 | 1402.57 |
| POST /api/payments | 6 | 0 | 0.97 | 1.76 | 1.76 | 1.68 | 1568.78 |
| GET /api/reviews | 6 | 0 | 1.2 | 1.58 | 1.58 | 1.54 | 1551.72 |
| POST /api/reviews | 6 | 0 | 0.66 | 0.91 | 0.91 | 0.87 | 2366.16 |
| GET /api/messages | 6 | 0 | 1.08 | 1.48 | 1.48 | 1.43 | 1524.12 |
| POST /api/messages | 6 | 0 | 0.7 | 1.26 | 1.26 | 1.21 | 2050.14 |
| GET /api/notifications | 6 | 0 | 0.56 | 0.81 | 0.81 | 0.79 | 2727.07 |
| POST /api/notifications | 6 | 0 | 1.95 | 2.18 | 2.18 | 2.13 | 1090.26 |
| POST /api/uploads | 6 | 0 | 1.68 | 10.72 | 10.72 | 10.64 | 412.71 |
| GET /api/search?q=benchmark%20api%20developer | 6 | 0 | 0.82 | 2.04 | 2.04 | 1.99 | 1487 |
| GET /api/admin/metrics | 6 | 0 | 1.46 | 4.9 | 4.9 | 4.76 | 765.66 |
