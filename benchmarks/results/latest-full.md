# API Benchmark Report

Generated: 2026-05-17T06:23:26.679Z
Mode: full
Target: local-auto-start
Requests per endpoint: 6
Concurrency: 2

| Endpoint | Method | Path | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| auth.register | POST | /api/auth/register | 12.7 | 96.55 | 96.55 | 95 | 49.23 | 6 | 0 | 201:6 |
| auth.login | POST | /api/auth/login | 6.54 | 8.3 | 8.3 | 8.09 | 300.27 | 6 | 0 | 200:6 |
| auth.oauthCallback | GET | /api/auth/oauth/github/callback | 2.55 | 3.26 | 3.26 | 3.13 | 667.13 | 6 | 0 | 200:6 |
| auth.refresh | POST | /api/auth/refresh | 3.16 | 5.34 | 5.34 | 5.15 | 511.39 | 6 | 0 | 200:6 |
| users.list | GET | /api/users | 2.18 | 3.46 | 3.46 | 3.36 | 748.05 | 6 | 0 | 200:6 |
| users.create | POST | /api/users | 3.04 | 3.35 | 3.35 | 3.26 | 635.97 | 6 | 0 | 201:6 |
| jobs.list | GET | /api/jobs | 1.94 | 3.3 | 3.3 | 3.21 | 805.67 | 6 | 0 | 200:6 |
| jobs.create | POST | /api/jobs | 2.64 | 3.53 | 3.53 | 3.45 | 665.2 | 6 | 0 | 201:6 |
| proposals.list | GET | /api/proposals | 1.91 | 2.46 | 2.46 | 2.35 | 969.99 | 6 | 0 | 200:6 |
| proposals.create | POST | /api/proposals | 2.62 | 2.95 | 2.95 | 2.84 | 706.76 | 6 | 0 | 201:6 |
| payments.create | POST | /api/payments | 2.43 | 2.94 | 2.94 | 2.86 | 763.82 | 6 | 0 | 201:6 |
| reviews.list | GET | /api/reviews | 1.81 | 2.09 | 2.09 | 2.01 | 1042.66 | 6 | 0 | 200:6 |
| reviews.create | POST | /api/reviews | 2.61 | 3.27 | 3.27 | 3.16 | 720.88 | 6 | 0 | 201:6 |
| messages.list | GET | /api/messages | 1.73 | 2.22 | 2.22 | 2.13 | 1033.27 | 6 | 0 | 200:6 |
| messages.create | POST | /api/messages | 2.52 | 4.59 | 4.59 | 4.46 | 607.4 | 6 | 0 | 201:6 |
| notifications.list | GET | /api/notifications | 2 | 2.52 | 2.52 | 2.43 | 931.95 | 6 | 0 | 200:6 |
| notifications.create | POST | /api/notifications | 2.8 | 2.92 | 2.92 | 2.82 | 714.18 | 6 | 0 | 201:6 |
| uploads.create | POST | /api/uploads | 4.88 | 15.07 | 15.07 | 14.92 | 235.12 | 6 | 0 | 201:6 |
| search.global | GET | /api/search?q=benchmark%20developer | 2.07 | 4.34 | 4.34 | 4.22 | 700.71 | 6 | 0 | 200:6 |
| admin.metrics | GET | /api/admin/metrics | 2.48 | 3.95 | 3.95 | 3.86 | 666.24 | 6 | 0 | 200:6 |
