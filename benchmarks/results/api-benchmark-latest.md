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
| auth.register | POST /api/auth/register | 1 | 15.51 | 15.51 | 15.51 | 15.1 | 64.29 | 64.46 | 0 |
| auth.login | POST /api/auth/login | 1 | 1.59 | 1.59 | 1.59 | 1.53 | 628.29 | 630.82 | 0 |
| auth.oauthCallback | GET /api/auth/oauth/github/callback | 1 | 0.82 | 0.82 | 0.82 | 0.76 | 1213.9 | 1220.88 | 0 |
| auth.refresh | POST /api/auth/refresh | 1 | 0.57 | 0.57 | 0.57 | 0.53 | 1744.56 | 1754.39 | 0 |
| users.list | GET /api/users | 1 | 0.46 | 0.46 | 0.46 | 0.41 | 2156.72 | 2171.75 | 0 |
| users.create | POST /api/users | 1 | 0.59 | 0.59 | 0.59 | 0.55 | 1684.45 | 1692.88 | 0 |
| jobs.list | GET /api/jobs | 1 | 0.41 | 0.41 | 0.41 | 0.36 | 2434.32 | 2457 | 0 |
| jobs.create | POST /api/jobs | 1 | 0.63 | 0.63 | 0.63 | 0.59 | 1593.31 | 1599.9 | 0 |
| proposals.list | GET /api/proposals | 1 | 0.41 | 0.41 | 0.41 | 0.37 | 2422.04 | 2437.29 | 0 |
| proposals.create | POST /api/proposals | 1 | 0.76 | 0.76 | 0.76 | 0.71 | 1316.44 | 1323.19 | 0 |
| payments.create | POST /api/payments | 1 | 0.57 | 0.57 | 0.57 | 0.54 | 1749.78 | 1759.4 | 0 |
| reviews.list | GET /api/reviews | 1 | 0.36 | 0.36 | 0.36 | 0.33 | 2763.06 | 2799.48 | 0 |
| reviews.create | POST /api/reviews | 1 | 0.43 | 0.43 | 0.43 | 0.4 | 2312.36 | 2333.72 | 0 |
| messages.list | GET /api/messages | 1 | 0.25 | 0.25 | 0.25 | 0.22 | 4006.01 | 4039.03 | 0 |
| messages.create | POST /api/messages | 1 | 0.37 | 0.37 | 0.37 | 0.34 | 2726.34 | 2736.61 | 0 |
| notifications.list | GET /api/notifications | 1 | 0.24 | 0.24 | 0.24 | 0.22 | 4079.55 | 4097.66 | 0 |
| notifications.create | POST /api/notifications | 1 | 0.37 | 0.37 | 0.37 | 0.35 | 2693.6 | 2708.81 | 0 |
| uploads.create | POST /api/uploads | 1 | 2.72 | 2.72 | 2.72 | 2.7 | 367.08 | 367.29 | 0 |
| search.query | GET /api/search?q=benchmark | 1 | 0.61 | 0.61 | 0.61 | 0.58 | 1642.6 | 1645.75 | 0 |
| admin.metrics | GET /api/admin/metrics | 1 | 0.63 | 0.63 | 0.63 | 0.61 | 1572.22 | 1575.32 | 0 |


