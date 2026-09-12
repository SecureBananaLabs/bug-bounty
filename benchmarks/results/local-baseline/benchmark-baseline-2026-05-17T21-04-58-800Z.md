# API Benchmark Summary

- Target: local in-process server
- Mode: baseline
- Started: 2026-05-17T21:04:58.800Z
- Completed: 2026-05-17T21:04:58.902Z
- Endpoints: 20
- Requests per endpoint: 5
- Concurrency: 2

| Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Error rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| auth_register | POST /api/auth/register | 5 | 3.88 | 23.48 | 23.48 | 23.34 | 157.06 | 0% |
| auth_login | POST /api/auth/login | 5 | 2.92 | 3.48 | 3.48 | 3.46 | 631.5 | 0% |
| auth_oauth_callback | GET /api/auth/oauth/github/callback?code=benchmark-code | 5 | 1.15 | 2.19 | 2.19 | 2.17 | 1243.32 | 0% |
| auth_refresh | POST /api/auth/refresh | 5 | 1.91 | 2.06 | 2.06 | 2.05 | 1000.48 | 0% |
| users_list | GET /api/users | 5 | 0.87 | 1.05 | 1.05 | 1.03 | 2049.85 | 0% |
| users_create | POST /api/users | 5 | 0.98 | 1.12 | 1.12 | 1.1 | 1759.76 | 0% |
| jobs_list | GET /api/jobs | 5 | 0.88 | 1.03 | 1.03 | 1.02 | 2078.31 | 0% |
| jobs_create | POST /api/jobs | 5 | 1.24 | 1.5 | 1.5 | 1.49 | 1464.6 | 0% |
| proposals_list | GET /api/proposals | 5 | 1.39 | 2.17 | 2.17 | 2.16 | 1312.4 | 0% |
| proposals_create | POST /api/proposals | 5 | 0.99 | 1.15 | 1.15 | 1.14 | 1790.57 | 0% |
| payments_create | POST /api/payments | 5 | 0.97 | 1.18 | 1.18 | 1.17 | 1806.62 | 0% |
| reviews_list | GET /api/reviews | 5 | 0.82 | 1 | 1 | 0.99 | 2153.87 | 0% |
| reviews_create | POST /api/reviews | 5 | 1.04 | 1.13 | 1.13 | 1.12 | 1775.19 | 0% |
| messages_list | GET /api/messages | 5 | 0.82 | 1.01 | 1.01 | 1 | 2084.2 | 0% |
| messages_create | POST /api/messages | 5 | 1 | 1.15 | 1.15 | 1.14 | 1813.37 | 0% |
| notifications_list | GET /api/notifications | 5 | 0.87 | 1.01 | 1.01 | 1 | 2077.27 | 0% |
| notifications_create | POST /api/notifications | 5 | 1.04 | 1.19 | 1.19 | 1.18 | 1745.57 | 0% |
| uploads_create | POST /api/uploads | 5 | 1.89 | 5.18 | 5.18 | 5.16 | 603.82 | 0% |
| search | GET /api/search?q=developer&category=automation | 5 | 0.97 | 1.34 | 1.34 | 1.32 | 1753.83 | 0% |
| admin_metrics | GET /api/admin/metrics | 5 | 1.84 | 2.69 | 2.69 | 2.68 | 898.1 | 0% |
