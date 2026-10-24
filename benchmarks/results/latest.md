# API Benchmark Summary

- Generated: 2026-05-19T21:29:42.990Z
- Target: http://127.0.0.1:55031
- Mode: full
- Connections: 4
- Duration per endpoint: 10s
- Request cap per endpoint: 8
- Endpoints covered: 21
- Total requests: 168
- Total errors: 0
- Total non-2xx: 0
- Highest p99: 9ms

## Thresholds

No threshold failures.

## Endpoint Results

Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | Avg RPS | Peak RPS | Error rate | Non-2xx | TTFB ms
--- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---:
health | GET /health | 8 | 1 | 3 | 3 | 8 | 8 | 0 | 0 | 6.45
auth-register | POST /api/auth/register | 8 | 2 | 6 | 6 | 8 | 8 | 0 | 0 | 8.88
auth-login | POST /api/auth/login | 8 | 1 | 4 | 4 | 8 | 8 | 0 | 0 | 1.62
auth-refresh | POST /api/auth/refresh | 8 | 1 | 3 | 3 | 8 | 8 | 0 | 0 | 1.64
auth-oauth-callback | GET /api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state | 8 | 1 | 3 | 3 | 8 | 8 | 0 | 0 | 1.73
users-list | GET /api/users | 8 | 1 | 3 | 3 | 8 | 8 | 0 | 0 | 1.24
users-create | POST /api/users | 8 | 0 | 2 | 2 | 8 | 8 | 0 | 0 | 1.41
jobs-list | GET /api/jobs | 8 | 2 | 9 | 9 | 8 | 8 | 0 | 0 | 3.08
jobs-create | POST /api/jobs | 8 | 1 | 3 | 3 | 8 | 8 | 0 | 0 | 2.21
proposals-list | GET /api/proposals | 8 | 0 | 2 | 2 | 8 | 8 | 0 | 0 | 2.21
proposals-create | POST /api/proposals | 8 | 1 | 2 | 2 | 8 | 8 | 0 | 0 | 0.89
payments-create | POST /api/payments | 8 | 1 | 3 | 3 | 8 | 8 | 0 | 0 | 1.17
reviews-list | GET /api/reviews | 8 | 1 | 4 | 4 | 8 | 8 | 0 | 0 | 1.08
reviews-create | POST /api/reviews | 8 | 2 | 6 | 6 | 8 | 8 | 0 | 0 | 1.1
messages-list | GET /api/messages | 8 | 0 | 2 | 2 | 8 | 8 | 0 | 0 | 0.93
messages-create | POST /api/messages | 8 | 1 | 3 | 3 | 8 | 8 | 0 | 0 | 1.15
notifications-list | GET /api/notifications | 8 | 1 | 3 | 3 | 8 | 8 | 0 | 0 | 1.09
notifications-create | POST /api/notifications | 8 | 1 | 3 | 3 | 8 | 8 | 0 | 0 | 1.93
uploads-create | POST /api/uploads | 8 | 2 | 5 | 5 | 8 | 8 | 0 | 0 | 4.44
search | GET /api/search?q=benchmark%20node | 8 | 1 | 3 | 3 | 8 | 8 | 0 | 0 | 1.15
admin-metrics | GET /api/admin/metrics | 8 | 1 | 4 | 4 | 8 | 8 | 0 | 0 | 2.09
