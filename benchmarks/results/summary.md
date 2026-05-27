# API Benchmark Summary

Generated: 2026-05-27T15:29:51.825Z
Mode: full
Target: http://127.0.0.1:55883
Concurrency: 4
Duration per endpoint: 1200ms
Max requests per endpoint: 6

| Endpoint | Method | Requests | Sustained RPS | Peak RPS | Error % | p50 | p95 | p99 | TTFB p95 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health.get | GET /health | 6 | 1401.56 | 6 | 0 | 1.91ms | 3.8ms | 3.8ms | 3.75ms |
| auth.register | POST /api/auth/register | 6 | 1784.9 | 6 | 0 | 1.52ms | 2.11ms | 2.11ms | 2.07ms |
| auth.login | POST /api/auth/login | 6 | 2135.3 | 6 | 0 | 1.47ms | 1.99ms | 1.99ms | 1.97ms |
| auth.oauth.github | GET /api/auth/oauth/github/callback | 6 | 3013.43 | 6 | 0 | 1.11ms | 1.34ms | 1.34ms | 1.32ms |
| auth.refresh | POST /api/auth/refresh | 6 | 3211.7 | 6 | 0 | 0.98ms | 1.22ms | 1.22ms | 1.18ms |
| jobs.list | GET /api/jobs | 6 | 3798.27 | 6 | 0 | 0.76ms | 0.88ms | 0.88ms | 0.86ms |
| jobs.create | POST /api/jobs | 6 | 2859.13 | 6 | 0 | 1.12ms | 1.49ms | 1.49ms | 1.47ms |
| users.list | GET /api/users | 6 | 4625.76 | 6 | 0 | 0.63ms | 0.81ms | 0.81ms | 0.79ms |
| users.create | POST /api/users | 6 | 3140.47 | 6 | 0 | 0.99ms | 1.34ms | 1.34ms | 1.32ms |
| proposals.list | GET /api/proposals | 6 | 2901.35 | 6 | 0 | 0.61ms | 1.39ms | 1.39ms | 1.31ms |
| proposals.create | POST /api/proposals | 6 | 3665.06 | 6 | 0 | 0.84ms | 1.11ms | 1.11ms | 1.09ms |
| payments.create | POST /api/payments | 6 | 3687.01 | 6 | 0 | 0.86ms | 1.1ms | 1.1ms | 1.08ms |
| reviews.list | GET /api/reviews | 6 | 4648.16 | 6 | 0 | 0.63ms | 0.8ms | 0.8ms | 0.78ms |
| reviews.create | POST /api/reviews | 6 | 3833.15 | 6 | 0 | 0.79ms | 1.08ms | 1.08ms | 1.06ms |
| messages.list | GET /api/messages | 6 | 4238.91 | 6 | 0 | 0.76ms | 0.89ms | 0.89ms | 0.87ms |
| messages.create | POST /api/messages | 6 | 3280.26 | 6 | 0 | 0.94ms | 1.23ms | 1.23ms | 1.22ms |
| notifications.list | GET /api/notifications | 6 | 5512.81 | 6 | 0 | 0.52ms | 0.69ms | 0.69ms | 0.67ms |
| notifications.create | POST /api/notifications | 6 | 3716.51 | 6 | 0 | 0.9ms | 1.11ms | 1.11ms | 1.09ms |
| uploads.create | POST /api/uploads | 6 | 1814.72 | 6 | 0 | 1.76ms | 2.21ms | 2.21ms | 2.19ms |
| search.get | GET /api/search?q=security%20dashboard | 6 | 3948.23 | 6 | 0 | 0.83ms | 0.94ms | 0.94ms | 0.92ms |
| admin.metrics | GET /api/admin/metrics | 6 | 2962.48 | 6 | 0 | 0.93ms | 1.17ms | 1.17ms | 1.15ms |

Threshold gate: passed.

Environment:
- Platform: Darwin 25.5.0 arm64
- CPU: Apple M3 Max
- Logical cores: 14
- Node: v25.2.1
