# API Benchmark Report

Generated: 2026-05-17T06:28:27.534Z
Mode: smoke
Target: local-auto-start
Requests per endpoint: 2
Concurrency: 1

| Endpoint | Method | Path | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| auth.register | POST | /api/auth/register | 10.58 | 102.89 | 102.89 | 100.85 | 17.53 | 2 | 0 | 201:2 |
| auth.login | POST | /api/auth/login | 4.71 | 7.81 | 7.81 | 7.35 | 157.26 | 2 | 0 | 200:2 |
| auth.oauthCallback | GET | /api/auth/oauth/github/callback | 2.74 | 3.71 | 3.71 | 3.4 | 303.63 | 2 | 0 | 200:2 |
| auth.refresh | POST | /api/auth/refresh | 3.49 | 3.61 | 3.61 | 3.33 | 277.76 | 2 | 0 | 200:2 |
| users.list | GET | /api/users | 3.78 | 4.34 | 4.34 | 4.11 | 241.52 | 2 | 0 | 200:2 |
| users.create | POST | /api/users | 3.16 | 3.62 | 3.62 | 3.21 | 291.6 | 2 | 0 | 201:2 |
| jobs.list | GET | /api/jobs | 1.78 | 2.08 | 2.08 | 1.91 | 508.98 | 2 | 0 | 200:2 |
| jobs.create | POST | /api/jobs | 3.12 | 4.76 | 4.76 | 4.26 | 251.15 | 2 | 0 | 201:2 |
| proposals.list | GET | /api/proposals | 2.76 | 2.97 | 2.97 | 2.61 | 343.97 | 2 | 0 | 200:2 |
| proposals.create | POST | /api/proposals | 3.79 | 4.33 | 4.33 | 4.13 | 243.47 | 2 | 0 | 201:2 |
| payments.create | POST | /api/payments | 3.03 | 4.61 | 4.61 | 4.38 | 259 | 2 | 0 | 201:2 |
| reviews.list | GET | /api/reviews | 1.61 | 2.17 | 2.17 | 1.96 | 521.06 | 2 | 0 | 200:2 |
| reviews.create | POST | /api/reviews | 1.89 | 2.36 | 2.36 | 2.18 | 465.18 | 2 | 0 | 201:2 |
| messages.list | GET | /api/messages | 1.51 | 1.53 | 1.53 | 1.39 | 648.03 | 2 | 0 | 200:2 |
| messages.create | POST | /api/messages | 2.39 | 2.62 | 2.62 | 2.47 | 395.09 | 2 | 0 | 201:2 |
| notifications.list | GET | /api/notifications | 1.78 | 1.98 | 1.98 | 1.83 | 517.73 | 2 | 0 | 200:2 |
| notifications.create | POST | /api/notifications | 2.31 | 2.78 | 2.78 | 2.64 | 387.8 | 2 | 0 | 201:2 |
| uploads.create | POST | /api/uploads | 3.22 | 14.59 | 14.59 | 14.46 | 111.95 | 2 | 0 | 201:2 |
| search.global | GET | /api/search?q=benchmark%20developer | 2.83 | 3.98 | 3.98 | 3.83 | 291.35 | 2 | 0 | 200:2 |
| admin.metrics | GET | /api/admin/metrics | 2.1 | 2.98 | 2.98 | 2.86 | 389.04 | 2 | 0 | 200:2 |
