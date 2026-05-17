# API Benchmark Report

Generated: 2026-05-17T06:23:15.542Z
Mode: smoke
Target: local-auto-start
Requests per endpoint: 2
Concurrency: 1

| Endpoint | Method | Path | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| auth.register | POST | /api/auth/register | 7.92 | 86.38 | 86.38 | 85.1 | 21.09 | 2 | 0 | 201:2 |
| auth.login | POST | /api/auth/login | 3.48 | 4.87 | 4.87 | 4.63 | 233.99 | 2 | 0 | 200:2 |
| auth.oauthCallback | GET | /api/auth/oauth/github/callback | 2.68 | 4.52 | 4.52 | 4.14 | 273.06 | 2 | 0 | 200:2 |
| auth.refresh | POST | /api/auth/refresh | 1.97 | 2.66 | 2.66 | 2.44 | 425.82 | 2 | 0 | 200:2 |
| users.list | GET | /api/users | 2.15 | 3.37 | 3.37 | 3.2 | 356.96 | 2 | 0 | 200:2 |
| users.create | POST | /api/users | 2.21 | 2.33 | 2.33 | 2.2 | 435.07 | 2 | 0 | 201:2 |
| jobs.list | GET | /api/jobs | 1.42 | 1.56 | 1.56 | 1.43 | 659.17 | 2 | 0 | 200:2 |
| jobs.create | POST | /api/jobs | 1.7 | 2.84 | 2.84 | 2.65 | 435.37 | 2 | 0 | 201:2 |
| proposals.list | GET | /api/proposals | 1.78 | 1.78 | 1.78 | 1.59 | 553.56 | 2 | 0 | 200:2 |
| proposals.create | POST | /api/proposals | 2.88 | 3.1 | 3.1 | 2.92 | 331.09 | 2 | 0 | 201:2 |
| payments.create | POST | /api/payments | 2.84 | 3.29 | 3.29 | 3.11 | 323.04 | 2 | 0 | 201:2 |
| reviews.list | GET | /api/reviews | 1.84 | 6.09 | 6.09 | 5.92 | 250.72 | 2 | 0 | 200:2 |
| reviews.create | POST | /api/reviews | 1.54 | 2.21 | 2.21 | 2.03 | 526.3 | 2 | 0 | 201:2 |
| messages.list | GET | /api/messages | 1.45 | 1.51 | 1.51 | 1.41 | 658.83 | 2 | 0 | 200:2 |
| messages.create | POST | /api/messages | 1.74 | 2.03 | 2.03 | 1.88 | 525.13 | 2 | 0 | 201:2 |
| notifications.list | GET | /api/notifications | 1.32 | 1.46 | 1.46 | 1.22 | 704.2 | 2 | 0 | 200:2 |
| notifications.create | POST | /api/notifications | 1.83 | 2 | 2 | 1.87 | 516.1 | 2 | 0 | 201:2 |
| uploads.create | POST | /api/uploads | 3.14 | 11.17 | 11.17 | 11.03 | 139.24 | 2 | 0 | 201:2 |
| search.global | GET | /api/search?q=benchmark%20developer | 1.25 | 2.62 | 2.62 | 2.51 | 511.46 | 2 | 0 | 200:2 |
| admin.metrics | GET | /api/admin/metrics | 1.91 | 2.65 | 2.65 | 2.54 | 435.17 | 2 | 0 | 200:2 |
