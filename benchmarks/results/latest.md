# API Benchmark Summary

- Started: 2026-05-17T20:21:05.075Z
- Finished: 2026-05-17T20:21:25.162Z
- Mode: smoke
- Target: local Express app
- Duration per endpoint: 1s
- Connections: 1
- Thresholds: p99 <= 1500ms, error rate <= 10%, sustained RPS >= 1

## Environment

- CPU: Apple M3 Max (16 logical cores)
- RAM: 131072 MB total, 15593 MB free at start
- Storage: local workspace storage
- Network: loopback
- Machine type: local workstation
- OS: Darwin 25.4.0 arm64
- Node.js: v20.13.1
- Other significant processes: normal local/CI background processes

## Endpoint Metrics

| Endpoint | Route | p50 ms | p95 ms | p99 ms | Sustained RPS | Peak RPS | Error rate % | TTFB ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| auth.register | POST /api/auth/register | 0 | 0 | 1 | 1883 | 1883 | 0 | 14.01 |
| auth.login | POST /api/auth/login | 0 | 0 | 0 | 2131 | 2130 | 0 | 1.43 |
| auth.oauthCallback | GET /api/auth/oauth/google/callback | 0 | 0 | 0 | 10164 | 10166 | 0 | 1.36 |
| auth.refresh | POST /api/auth/refresh | 0 | 0 | 0 | 2335 | 2335 | 0 | 0.85 |
| users.list | GET /api/users | 0 | 0 | 0 | 10572 | 10568 | 0 | 0.48 |
| users.create | POST /api/users | 0 | 0 | 0 | 8796 | 8794 | 0 | 0.59 |
| jobs.list | GET /api/jobs | 0 | 0 | 0 | 10044 | 10047 | 0 | 0.62 |
| jobs.create | POST /api/jobs | 0 | 0 | 0 | 8692 | 8689 | 0 | 1.05 |
| proposals.list | GET /api/proposals | 0 | 0 | 0 | 10572 | 10572 | 0 | 0.52 |
| proposals.create | POST /api/proposals | 0 | 0 | 0 | 9044 | 9047 | 0 | 0.56 |
| payments.create | POST /api/payments | 0 | 0 | 0 | 8868 | 8870 | 0 | 0.46 |
| reviews.list | GET /api/reviews | 0 | 0 | 0 | 10452 | 10453 | 0 | 0.47 |
| reviews.create | POST /api/reviews | 0 | 0 | 0 | 8876 | 8874 | 0 | 0.57 |
| messages.list | GET /api/messages | 0 | 0 | 0 | 10436 | 10435 | 0 | 0.64 |
| messages.create | POST /api/messages | 0 | 0 | 0 | 8868 | 8869 | 0 | 1.16 |
| notifications.list | GET /api/notifications | 0 | 0 | 0 | 10284 | 10283 | 0 | 0.5 |
| notifications.create | POST /api/notifications | 0 | 0 | 0 | 9012 | 9010 | 0 | 0.8 |
| uploads.create | POST /api/uploads | 0 | 0 | 0 | 7038 | 7037 | 0 | 5.68 |
| search.query | GET /api/search?q=marketplace%20dashboard | 0 | 0 | 0 | 9948 | 9947 | 0 | 0.92 |
| admin.metrics | GET /api/admin/metrics | 0 | 0 | 0 | 2359 | 2359 | 0 | 1.93 |

## Regression Gate

No threshold failures.
