# API Benchmark Summary

- Mode: smoke
- Target: local
- Routes covered: 20
- Requests per endpoint: 1
- Concurrency per endpoint: 1
- Runtime: v26.0.0
- OS: Darwin 25.4.0 arm64
- Threshold result: passed

| Route | Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| auth.register | POST /api/auth/register | 1 | 15.74 | 15.74 | 15.74 | 15.36 | 63.38 | 63.53 | 0 |
| auth.login | POST /api/auth/login | 1 | 1.51 | 1.51 | 1.51 | 1.45 | 662.01 | 664.12 | 0 |
| auth.oauthCallback | GET /api/auth/oauth/github/callback | 1 | 0.81 | 0.81 | 0.81 | 0.75 | 1229.57 | 1236.28 | 0 |
| auth.refresh | POST /api/auth/refresh | 1 | 0.55 | 0.55 | 0.55 | 0.51 | 1793.32 | 1803.29 | 0 |
| users.list | GET /api/users | 1 | 0.43 | 0.43 | 0.43 | 0.38 | 2285.71 | 2300.83 | 0 |
| users.create | POST /api/users | 1 | 0.6 | 0.6 | 0.6 | 0.55 | 1667.13 | 1675.51 | 0 |
| jobs.list | GET /api/jobs | 1 | 0.41 | 0.41 | 0.41 | 0.37 | 2398.32 | 2421.31 | 0 |
| jobs.create | POST /api/jobs | 1 | 0.62 | 0.62 | 0.62 | 0.58 | 1598.94 | 1605.99 | 0 |
| proposals.list | GET /api/proposals | 1 | 0.41 | 0.41 | 0.41 | 0.37 | 2423.51 | 2438.52 | 0 |
| proposals.create | POST /api/proposals | 1 | 0.61 | 0.61 | 0.61 | 0.57 | 1637 | 1645.53 | 0 |
| payments.create | POST /api/payments | 1 | 0.41 | 0.41 | 0.41 | 0.39 | 2406.5 | 2420.09 | 0 |
| reviews.list | GET /api/reviews | 1 | 0.32 | 0.32 | 0.32 | 0.29 | 3069.44 | 3109.62 | 0 |
| reviews.create | POST /api/reviews | 1 | 0.38 | 0.38 | 0.38 | 0.36 | 2591.23 | 2616.38 | 0 |
| messages.list | GET /api/messages | 1 | 0.24 | 0.24 | 0.24 | 0.22 | 4135.79 | 4169.55 | 0 |
| messages.create | POST /api/messages | 1 | 0.35 | 0.35 | 0.35 | 0.32 | 2848.33 | 2858.16 | 0 |
| notifications.list | GET /api/notifications | 1 | 0.24 | 0.24 | 0.24 | 0.21 | 4207.59 | 4229.08 | 0 |
| notifications.create | POST /api/notifications | 1 | 0.36 | 0.36 | 0.36 | 0.34 | 2768.49 | 2776.17 | 0 |
| uploads.create | POST /api/uploads | 1 | 3.47 | 3.47 | 3.47 | 3.44 | 288.46 | 288.59 | 0 |
| search.query | GET /api/search?q=benchmark | 1 | 0.63 | 0.63 | 0.63 | 0.61 | 1579.67 | 1583.74 | 0 |
| admin.metrics | GET /api/admin/metrics | 1 | 0.64 | 0.64 | 0.64 | 0.61 | 1567.5 | 1570.68 | 0 |


