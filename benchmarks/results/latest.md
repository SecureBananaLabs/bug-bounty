# API Benchmark Summary

- Mode: full
- Target: http://127.0.0.1:62422
- Started: 2026-06-30T17:51:37.911Z
- Node.js: v24.11.1
- Platform: Windows_NT 10.0.19045 x64
- CPU: 12th Gen Intel(R) Core(TM) i5-12400F (12 cores)
- Requests per endpoint: 24
- Concurrency: 4

| Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| auth_register | POST /api/auth/register | 24 | 4.52 | 15.44 | 16.21 | 15.29 | 526.79 | 24 | 0 |
| auth_login | POST /api/auth/login | 24 | 3.2 | 3.94 | 4.17 | 3.9 | 1171.95 | 24 | 0 |
| auth_oauth_callback | GET /api/auth/oauth/github/callback | 24 | 1.9 | 2.2 | 2.26 | 2.15 | 2011.6 | 24 | 0 |
| auth_refresh | POST /api/auth/refresh | 24 | 2.91 | 3.87 | 3.91 | 3.8 | 1313.18 | 24 | 0 |
| users_list | GET /api/users | 24 | 1.67 | 1.77 | 1.8 | 1.72 | 2381.85 | 24 | 0 |
| users_create | POST /api/users | 24 | 2.42 | 3.38 | 3.43 | 3.34 | 1601.87 | 24 | 0 |
| jobs_list | GET /api/jobs | 24 | 1.66 | 1.8 | 1.82 | 1.77 | 2419.5 | 24 | 0 |
| jobs_create | POST /api/jobs | 24 | 2.4 | 3.46 | 3.51 | 3.43 | 1478.53 | 24 | 0 |
| proposals_list | GET /api/proposals | 24 | 1.54 | 1.97 | 2.01 | 1.92 | 2394.85 | 24 | 0 |
| proposals_create | POST /api/proposals | 24 | 2.75 | 3.71 | 3.89 | 3.64 | 1374.18 | 24 | 0 |
| payments_create | POST /api/payments | 24 | 2.14 | 2.89 | 3.17 | 2.83 | 1705.96 | 24 | 0 |
| reviews_list | GET /api/reviews | 24 | 1.71 | 2.41 | 2.42 | 2.35 | 2177.78 | 24 | 0 |
| reviews_create | POST /api/reviews | 24 | 2.72 | 4.44 | 4.54 | 4.39 | 1352.96 | 24 | 0 |
| messages_list | GET /api/messages | 24 | 1.93 | 2.08 | 2.08 | 2.03 | 2171.51 | 24 | 0 |
| messages_create | POST /api/messages | 24 | 2.3 | 2.93 | 2.97 | 2.89 | 1645.53 | 24 | 0 |
| notifications_list | GET /api/notifications | 24 | 1.64 | 2.75 | 2.82 | 2.69 | 2102.64 | 24 | 0 |
| notifications_create | POST /api/notifications | 24 | 2.39 | 5.07 | 5.11 | 5.04 | 1460.07 | 24 | 0 |
| uploads_create | POST /api/uploads | 24 | 3.87 | 9.76 | 9.88 | 9.72 | 841.6 | 24 | 0 |
| search_query | GET /api/search | 24 | 1.89 | 2.48 | 2.52 | 2.43 | 2003.66 | 24 | 0 |
| admin_metrics | GET /api/admin/metrics | 24 | 3.38 | 9.64 | 10.27 | 9.59 | 944.92 | 24 | 0 |
