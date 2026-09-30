# API Benchmark Summary

- Mode: smoke
- Target: http://127.0.0.1:62415
- Started: 2026-06-30T17:51:31.658Z
- Node.js: v24.11.1
- Platform: Windows_NT 10.0.19045 x64
- CPU: 12th Gen Intel(R) Core(TM) i5-12400F (12 cores)
- Requests per endpoint: 4
- Concurrency: 1

| Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| auth_register | POST /api/auth/register | 4 | 2.38 | 47.06 | 47.06 | 46.2 | 68.89 | 4 | 0 |
| auth_login | POST /api/auth/login | 4 | 1.41 | 1.97 | 1.97 | 1.84 | 600.41 | 4 | 0 |
| auth_oauth_callback | GET /api/auth/oauth/github/callback | 4 | 0.73 | 1.6 | 1.6 | 1.51 | 871.14 | 4 | 0 |
| auth_refresh | POST /api/auth/refresh | 4 | 0.98 | 1.33 | 1.33 | 1.27 | 882.05 | 4 | 0 |
| users_list | GET /api/users | 4 | 0.63 | 0.96 | 0.96 | 0.91 | 1356.02 | 4 | 0 |
| users_create | POST /api/users | 4 | 0.78 | 1.17 | 1.17 | 1.11 | 1106.44 | 4 | 0 |
| jobs_list | GET /api/jobs | 4 | 0.6 | 0.74 | 0.74 | 0.68 | 1519.06 | 4 | 0 |
| jobs_create | POST /api/jobs | 4 | 0.89 | 1.37 | 1.37 | 1.31 | 905.14 | 4 | 0 |
| proposals_list | GET /api/proposals | 4 | 0.64 | 0.87 | 0.87 | 0.8 | 1415.28 | 4 | 0 |
| proposals_create | POST /api/proposals | 4 | 0.7 | 0.83 | 0.83 | 0.78 | 1328.86 | 4 | 0 |
| payments_create | POST /api/payments | 4 | 0.69 | 0.84 | 0.84 | 0.79 | 1339.94 | 4 | 0 |
| reviews_list | GET /api/reviews | 4 | 0.53 | 0.8 | 0.8 | 0.75 | 1590.65 | 4 | 0 |
| reviews_create | POST /api/reviews | 4 | 0.75 | 1.31 | 1.31 | 1.25 | 1084.57 | 4 | 0 |
| messages_list | GET /api/messages | 4 | 0.5 | 0.66 | 0.66 | 0.62 | 1823.74 | 4 | 0 |
| messages_create | POST /api/messages | 4 | 0.64 | 0.78 | 0.78 | 0.72 | 1451.69 | 4 | 0 |
| notifications_list | GET /api/notifications | 4 | 0.47 | 0.56 | 0.56 | 0.5 | 1966.86 | 4 | 0 |
| notifications_create | POST /api/notifications | 4 | 0.68 | 0.71 | 0.71 | 0.66 | 1443.68 | 4 | 0 |
| uploads_create | POST /api/uploads | 4 | 1.14 | 5.29 | 5.29 | 5.23 | 416.13 | 4 | 0 |
| search_query | GET /api/search | 4 | 0.54 | 1.4 | 1.4 | 1.35 | 1185.61 | 4 | 0 |
| admin_metrics | GET /api/admin/metrics | 4 | 0.78 | 1.42 | 1.42 | 1.36 | 981.57 | 4 | 0 |
