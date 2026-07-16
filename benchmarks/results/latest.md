# API Benchmark Report

Generated: 2026-06-25T20:25:53.793Z
Mode: full
Target: http://127.0.0.1:32853

## Environment

- Node.js: v22.22.3
- Platform: Linux 4.18.0-553.5.1.el8_10.x86_64 x64
- CPU: Intel(R) Xeon(R) Gold 6248 CPU @ 2.50GHz (80 logical cores)
- Memory: 324886 MiB free / 385040 MiB total
- Network: loopback

## Results

| Endpoint | Route | Requests | RPS | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Error rate | Statuses |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| auth.register | POST /api/auth/register | 8 | 133.81 | 14.93 | 64.77 | 64.77 | 63.9 | 0% | 201:8 |
| auth.login | POST /api/auth/login | 8 | 493.04 | 5.45 | 11.05 | 11.05 | 10.91 | 0% | 200:8 |
| auth.refresh | POST /api/auth/refresh | 8 | 692.34 | 5.3 | 7.54 | 7.54 | 7.42 | 0% | 200:8 |
| auth.oauth.github | GET /api/auth/oauth/github/callback | 8 | 865.21 | 4.51 | 5.85 | 5.85 | 5.72 | 0% | 200:8 |
| users.list | GET /api/users | 8 | 781.78 | 4.6 | 6.48 | 6.48 | 6.38 | 0% | 200:8 |
| users.create | POST /api/users | 8 | 899.43 | 4.16 | 5.41 | 5.41 | 5.31 | 0% | 201:8 |
| jobs.list | GET /api/jobs | 8 | 1157.48 | 3.41 | 3.77 | 3.77 | 3.68 | 0% | 200:8 |
| jobs.create | POST /api/jobs | 8 | 800.57 | 4.81 | 5.96 | 5.96 | 5.86 | 0% | 201:8 |
| proposals.list | GET /api/proposals | 8 | 1090.33 | 3.52 | 4.09 | 4.09 | 3.99 | 0% | 200:8 |
| proposals.create | POST /api/proposals | 8 | 591.77 | 6.61 | 9.01 | 9.01 | 8.83 | 0% | 201:8 |
| payments.create | POST /api/payments | 8 | 705.95 | 5.1 | 8.65 | 8.65 | 8.58 | 0% | 201:8 |
| reviews.list | GET /api/reviews | 8 | 996.99 | 3.88 | 4.89 | 4.89 | 4.77 | 0% | 200:8 |
| reviews.create | POST /api/reviews | 8 | 787.19 | 4.72 | 6.85 | 6.85 | 6.71 | 0% | 201:8 |
| messages.list | GET /api/messages | 8 | 1082.2 | 3.55 | 4.19 | 4.19 | 4.08 | 0% | 200:8 |
| messages.create | POST /api/messages | 8 | 882.73 | 4.29 | 5.34 | 5.34 | 5.24 | 0% | 201:8 |
| notifications.list | GET /api/notifications | 8 | 712.07 | 3.86 | 8.18 | 8.18 | 8.08 | 0% | 200:8 |
| notifications.create | POST /api/notifications | 8 | 974.93 | 3.88 | 4.79 | 4.79 | 4.71 | 0% | 201:8 |
| uploads.create | POST /api/uploads | 8 | 480.9 | 5.96 | 12.34 | 12.34 | 12.27 | 0% | 201:8 |
| search.global | GET /api/search?q=benchmark | 8 | 739.54 | 5.25 | 6.72 | 6.72 | 6.61 | 0% | 200:8 |
| admin.metrics | GET /api/admin/metrics | 8 | 664.92 | 4.33 | 8.8 | 8.8 | 8.72 | 0% | 200:8 |

## Thresholds

- p99 latency threshold: 1000 ms
- error-rate threshold: 5%
- Failures: none
