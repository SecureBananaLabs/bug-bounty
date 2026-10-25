# API Benchmark Summary

Generated: 2026-06-11T04:39:27.241Z
Mode: full
Target: http://127.0.0.1:53595
Duration per endpoint: 2s
Connections: 4

| Endpoint | Route | Status | p50 latency | p95 latency | p99 latency | TTFB p95 | sustained RPS | peak RPS | error rate |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health | GET /health | passed | 0 ms | 0 ms | 0 ms | 9.4 ms | 21992 | 23256 | 0% |
| auth.register | POST /api/auth/register | passed | 0 ms | 0 ms | 0 ms | 3.7 ms | 14616 | 15244 | 0% |
| auth.login | POST /api/auth/login | passed | 0 ms | 0 ms | 0 ms | 2.7 ms | 15060 | 15235 | 0% |
| auth.oauthCallback | GET /api/auth/oauth/github/callback | passed | 0 ms | 0 ms | 0 ms | 2.3 ms | 21864 | 21948 | 0% |
| auth.refresh | POST /api/auth/refresh | passed | 0 ms | 0 ms | 0 ms | 0.7 ms | 16928 | 16971 | 0% |
| users.list | GET /api/users | passed | 0 ms | 0 ms | 0 ms | 2 ms | 21840 | 21898 | 0% |
| users.create | POST /api/users | passed | 0 ms | 0 ms | 0 ms | 2.7 ms | 18664 | 18707 | 0% |
| jobs.list | GET /api/jobs | passed | 0 ms | 0 ms | 0 ms | 0.7 ms | 21568 | 21572 | 0% |
| jobs.create | POST /api/jobs | passed | 0 ms | 0 ms | 0 ms | 1.5 ms | 18088 | 18233 | 0% |
| proposals.list | GET /api/proposals | passed | 0 ms | 0 ms | 0 ms | 0.7 ms | 21368 | 21388 | 0% |
| proposals.create | POST /api/proposals | passed | 0 ms | 0 ms | 0 ms | 0.7 ms | 18480 | 18500 | 0% |
| payments.create | POST /api/payments | passed | 0 ms | 0 ms | 0 ms | 0.6 ms | 18600 | 18660 | 0% |
| reviews.list | GET /api/reviews | passed | 0 ms | 0 ms | 0 ms | 0.5 ms | 21272 | 21285 | 0% |
| reviews.create | POST /api/reviews | passed | 0 ms | 0 ms | 0 ms | 0.7 ms | 18376 | 18436 | 0% |
| messages.list | GET /api/messages | passed | 0 ms | 0 ms | 0 ms | 0.5 ms | 21120 | 21275 | 0% |
| messages.create | POST /api/messages | passed | 0 ms | 0 ms | 0 ms | 0.7 ms | 18048 | 18095 | 0% |
| notifications.list | GET /api/notifications | passed | 0 ms | 0 ms | 0 ms | 0.5 ms | 21016 | 21135 | 0% |
| notifications.create | POST /api/notifications | passed | 0 ms | 0 ms | 0 ms | 0.6 ms | 18136 | 18281 | 0% |
| uploads.create | POST /api/uploads | passed | 0 ms | 0 ms | 1 ms | 0.7 ms | 14648 | 15009 | 0% |
| search.global | GET /api/search?q=frontend%20engineer | passed | 0 ms | 0 ms | 0 ms | 0.5 ms | 20384 | 20658 | 0% |
| admin.metrics | GET /api/admin/metrics | passed | 0 ms | 0 ms | 0 ms | 0.6 ms | 15120 | 15376 | 0% |

## Regression Gate

Passed: yes

- None
