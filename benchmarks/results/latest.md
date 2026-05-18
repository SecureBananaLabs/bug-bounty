# API Benchmark Summary

- Mode: full
- Target: local
- Started: 2026-05-18T00:08:24.144Z
- Node: v25.9.0
- Platform: darwin arm64
- Connections: 2
- Requests per endpoint: 8
- Duration seconds: amount-based

| Endpoint | Route | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB ms | Error rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| auth-register | POST /api/auth/register | 8 | 8 | 8 | 0 | 0 | 4 | 12.91 | 0% |
| auth-login | POST /api/auth/login | 8 | 8 | 8 | 0 | 0 | 3 | 1.21 | 0% |
| auth-refresh | POST /api/auth/refresh | 8 | 8 | 8 | 2 | 0 | 6 | 2.27 | 0% |
| auth-oauth-callback | GET /api/auth/oauth/github/callback | 8 | 8 | 8 | 0 | 0 | 3 | 0.8 | 0% |
| users-list | GET /api/users | 8 | 8 | 8 | 1 | 0 | 6 | 2.05 | 0% |
| users-create | POST /api/users | 8 | 8 | 8 | 1 | 0 | 5 | 2.6 | 0% |
| jobs-list | GET /api/jobs | 8 | 8 | 8 | 1 | 0 | 9 | 2.06 | 0% |
| jobs-create | POST /api/jobs | 8 | 8 | 8 | 1 | 0 | 6 | 3.89 | 0% |
| proposals-list | GET /api/proposals | 8 | 8 | 8 | 1 | 0 | 7 | 2.38 | 0% |
| proposals-create | POST /api/proposals | 8 | 8 | 8 | 0 | 0 | 5 | 2.92 | 0% |
| payments-create | POST /api/payments | 8 | 8 | 8 | 1 | 0 | 6 | 2.15 | 0% |
| reviews-list | GET /api/reviews | 8 | 8 | 8 | 0 | 0 | 5 | 2.13 | 0% |
| reviews-create | POST /api/reviews | 8 | 8 | 8 | 0 | 0 | 6 | 2.02 | 0% |
| messages-list | GET /api/messages | 8 | 8 | 8 | 0 | 0 | 5 | 1.79 | 0% |
| messages-create | POST /api/messages | 8 | 8 | 8 | 1 | 0 | 8 | 2.21 | 0% |
| notifications-list | GET /api/notifications | 8 | 8 | 8 | 1 | 0 | 6 | 2.17 | 0% |
| notifications-create | POST /api/notifications | 8 | 8 | 8 | 0 | 0 | 3 | 0.68 | 0% |
| uploads-create | POST /api/uploads | 8 | 8 | 8 | 1 | 0 | 6 | 2.36 | 0% |
| search-global | GET /api/search?q=performance | 8 | 8 | 8 | 1 | 0 | 6 | 4.36 | 0% |
| admin-metrics | GET /api/admin/metrics | 8 | 8 | 8 | 1 | 0 | 6 | 4.8 | 0% |

Threshold result: pass.
