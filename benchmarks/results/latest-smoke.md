# API Benchmark Summary

- Mode: smoke
- Target: local
- Started: 2026-05-18T00:10:27.868Z
- Node: v25.9.0
- Platform: darwin arm64
- Connections: 1
- Requests per endpoint: 3
- Duration seconds: amount-based

| Endpoint | Route | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB ms | Error rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| auth-register | POST /api/auth/register | 3 | 3 | 3 | 0 | 0 | 3 | 11.75 | 0% |
| auth-login | POST /api/auth/login | 3 | 3 | 3 | 1 | 0 | 4 | 4.56 | 0% |
| auth-refresh | POST /api/auth/refresh | 3 | 3 | 3 | 1 | 0 | 5 | 2.84 | 0% |
| auth-oauth-callback | GET /api/auth/oauth/github/callback | 3 | 3 | 3 | 1 | 0 | 4 | 3.2 | 0% |
| users-list | GET /api/users | 3 | 3 | 3 | 1 | 0 | 4 | 2.58 | 0% |
| users-create | POST /api/users | 3 | 3 | 3 | 1 | 0 | 4 | 3.52 | 0% |
| jobs-list | GET /api/jobs | 3 | 3 | 3 | 1 | 0 | 4 | 2.8 | 0% |
| jobs-create | POST /api/jobs | 3 | 3 | 3 | 1 | 0 | 4 | 3.46 | 0% |
| proposals-list | GET /api/proposals | 3 | 3 | 3 | 0 | 0 | 4 | 3.09 | 0% |
| proposals-create | POST /api/proposals | 3 | 3 | 3 | 1 | 0 | 4 | 2.9 | 0% |
| payments-create | POST /api/payments | 3 | 3 | 3 | 1 | 0 | 4 | 2.46 | 0% |
| reviews-list | GET /api/reviews | 3 | 3 | 3 | 0 | 0 | 4 | 2.44 | 0% |
| reviews-create | POST /api/reviews | 3 | 3 | 3 | 1 | 0 | 4 | 2.6 | 0% |
| messages-list | GET /api/messages | 3 | 3 | 3 | 1 | 0 | 4 | 2.47 | 0% |
| messages-create | POST /api/messages | 3 | 3 | 3 | 0 | 0 | 3 | 2.35 | 0% |
| notifications-list | GET /api/notifications | 3 | 3 | 3 | 0 | 0 | 3 | 2.11 | 0% |
| notifications-create | POST /api/notifications | 3 | 3 | 3 | 0 | 0 | 6 | 2.65 | 0% |
| uploads-create | POST /api/uploads | 3 | 3 | 3 | 0 | 0 | 4 | 3.57 | 0% |
| search-global | GET /api/search?q=performance | 3 | 3 | 3 | 0 | 0 | 3 | 3.86 | 0% |
| admin-metrics | GET /api/admin/metrics | 3 | 3 | 3 | 0 | 0 | 4 | 4.32 | 0% |

Threshold result: pass.
