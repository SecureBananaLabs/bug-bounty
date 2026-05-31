# API Benchmark Summary

Generated: 2026-05-17T09:44:25.499Z

Target: http://127.0.0.1:4000
Mode: smoke
Duration per endpoint: 2s
Connections: 1
Endpoints covered: 20

| Endpoint | Route | p50 ms | p95 ms | p99 ms | sustained RPS | peak RPS | error rate | TTFB ms | gate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| auth.register | POST /api/auth/register | 18 | 26.2 | 49 | 5 | 5 | 0% | 174.887 | pass |
| auth.login | POST /api/auth/login | 7 | 10.4 | 25 | 5 | 5 | 0% | 13.036 | pass |
| auth.oauthCallback | GET /api/auth/oauth/github/callback | 6 | 7.6 | 13 | 5 | 5 | 0% | 120.252 | pass |
| auth.refresh | POST /api/auth/refresh | 9 | 9.2 | 14 | 5 | 5 | 0% | 44.492 | pass |
| users.list | GET /api/users | 6 | 6 | 7 | 5 | 5 | 0% | 5.258 | pass |
| users.create | POST /api/users | 6 | 9.2 | 25 | 5 | 5 | 0% | 7.04 | pass |
| jobs.list | GET /api/jobs | 25 | 20 | 33 | 5 | 5 | 0% | 18.483 | pass |
| jobs.create | POST /api/jobs | 16 | 20 | 47 | 5 | 5 | 0% | 12.97 | pass |
| proposals.list | GET /api/proposals | 3 | 3.2 | 6 | 5 | 5 | 0% | 5.129 | pass |
| proposals.create | POST /api/proposals | 8 | 49.8 | 185 | 5 | 5 | 0% | 5.794 | pass |
| payments.create | POST /api/payments | 7 | 11.4 | 30 | 5 | 5 | 0% | 19.058 | pass |
| reviews.list | GET /api/reviews | 3 | 4 | 9 | 5 | 5 | 0% | 4.811 | pass |
| reviews.create | POST /api/reviews | 6 | 7 | 13 | 5 | 5 | 0% | 5.892 | pass |
| messages.list | GET /api/messages | 6 | 9 | 17 | 5 | 5 | 0% | 8.518 | pass |
| messages.create | POST /api/messages | 5 | 8.4 | 23 | 5 | 5 | 0% | 15.19 | pass |
| notifications.list | GET /api/notifications | 3 | 5.8 | 15 | 5 | 5 | 0% | 5.234 | pass |
| notifications.create | POST /api/notifications | 11 | 9.6 | 12 | 5 | 5 | 0% | 15.244 | pass |
| uploads.create | POST /api/uploads | 6 | 68 | 315 | 5 | 5 | 0% | 319.367 | pass |
| search.global | GET /api/search?q=benchmark%20developer | 3 | 2.8 | 4 | 5 | 5 | 0% | 5.738 | pass |
| admin.metrics | GET /api/admin/metrics | 7 | 9.81 | 20 | 5 | 5 | 0% | 18.815 | pass |

## Threshold Failures

None.


## Benchmark Environment

- CPU model and core count: Intel(R) Core(TM) i3-N305; 8 logical cores
- RAM: 8 GB total
- OS: Windows_NT 10.0.26200 x64
- Node.js: v24.15.0
- Network: loopback or configured target host
