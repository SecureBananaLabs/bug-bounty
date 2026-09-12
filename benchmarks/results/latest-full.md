# API Benchmark Report

Generated: 2026-05-17T06:28:35.198Z
Mode: full
Target: local-auto-start
Requests per endpoint: 6
Concurrency: 2

| Endpoint | Method | Path | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| auth.register | POST | /api/auth/register | 11.76 | 107.12 | 107.12 | 105.89 | 46.1 | 6 | 0 | 201:6 |
| auth.login | POST | /api/auth/login | 4.81 | 8.03 | 8.03 | 7.84 | 334.55 | 6 | 0 | 200:6 |
| auth.oauthCallback | GET | /api/auth/oauth/github/callback | 2.61 | 4.03 | 4.03 | 3.73 | 628.58 | 6 | 0 | 200:6 |
| auth.refresh | POST | /api/auth/refresh | 2.75 | 2.91 | 2.91 | 2.75 | 704.61 | 6 | 0 | 200:6 |
| users.list | GET | /api/users | 3.02 | 4.66 | 4.66 | 4.5 | 600.77 | 6 | 0 | 200:6 |
| users.create | POST | /api/users | 2.66 | 3 | 3 | 2.89 | 704.56 | 6 | 0 | 201:6 |
| jobs.list | GET | /api/jobs | 1.74 | 2.05 | 2.05 | 1.97 | 1050 | 6 | 0 | 200:6 |
| jobs.create | POST | /api/jobs | 2.83 | 3.48 | 3.48 | 3.37 | 612.61 | 6 | 0 | 201:6 |
| proposals.list | GET | /api/proposals | 2.17 | 2.83 | 2.83 | 2.74 | 819.88 | 6 | 0 | 200:6 |
| proposals.create | POST | /api/proposals | 2.58 | 2.85 | 2.85 | 2.7 | 758.07 | 6 | 0 | 201:6 |
| payments.create | POST | /api/payments | 2.55 | 2.85 | 2.85 | 2.74 | 776.76 | 6 | 0 | 201:6 |
| reviews.list | GET | /api/reviews | 1.75 | 2.07 | 2.07 | 1.99 | 1054.65 | 6 | 0 | 200:6 |
| reviews.create | POST | /api/reviews | 2.49 | 3.19 | 3.19 | 3.1 | 745.74 | 6 | 0 | 201:6 |
| messages.list | GET | /api/messages | 1.63 | 2.02 | 2.02 | 1.94 | 1085.89 | 6 | 0 | 200:6 |
| messages.create | POST | /api/messages | 2.27 | 2.8 | 2.8 | 2.7 | 816.29 | 6 | 0 | 201:6 |
| notifications.list | GET | /api/notifications | 2.89 | 5.05 | 5.05 | 4.95 | 585.74 | 6 | 0 | 200:6 |
| notifications.create | POST | /api/notifications | 2.46 | 2.8 | 2.8 | 2.72 | 776.42 | 6 | 0 | 201:6 |
| uploads.create | POST | /api/uploads | 4.91 | 13.67 | 13.67 | 13.47 | 247.95 | 6 | 0 | 201:6 |
| search.global | GET | /api/search?q=benchmark%20developer | 1.79 | 3.28 | 3.28 | 3.19 | 848.57 | 6 | 0 | 200:6 |
| admin.metrics | GET | /api/admin/metrics | 2.59 | 4.15 | 4.15 | 4.07 | 657.48 | 6 | 0 | 200:6 |
