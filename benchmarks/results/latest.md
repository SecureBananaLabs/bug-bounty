# API Benchmark Summary

- Generated at: 2026-05-19T07:36:46.806Z
- Target: http://127.0.0.1:58663
- Mode: full
- Requests per endpoint: 8
- Concurrency: 4
- Warmup requests per endpoint: 1
- Node.js: v23.9.0
- Platform: darwin 25.4.0 arm64

| Route | Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| auth.register | POST /api/auth/register | 8 | 7.33 | 15.37 | 15.37 | 15.29 | 429.25 | 429.25 | 0% |
| auth.login | POST /api/auth/login | 8 | 3.71 | 5.32 | 5.32 | 5.2 | 842.74 | 842.74 | 0% |
| auth.oauthCallback | GET /api/auth/oauth/github/callback | 8 | 1.65 | 2.03 | 2.03 | 2 | 2159.95 | 2159.95 | 0% |
| auth.refresh | POST /api/auth/refresh | 8 | 2.94 | 3.38 | 3.38 | 3.32 | 1276.53 | 1276.53 | 0% |
| users.list | GET /api/users | 8 | 1.19 | 1.33 | 1.33 | 1.29 | 2939.02 | 2939.02 | 0% |
| users.create | POST /api/users | 8 | 1.72 | 2.31 | 2.31 | 2.28 | 2105.26 | 2105.26 | 0% |
| jobs.list | GET /api/jobs | 8 | 1.11 | 1.36 | 1.36 | 1.33 | 3211.24 | 3211.24 | 0% |
| jobs.create | POST /api/jobs | 8 | 1.55 | 1.92 | 1.92 | 1.9 | 2302.38 | 2302.38 | 0% |
| proposals.list | GET /api/proposals | 8 | 1.31 | 2.71 | 2.71 | 2.64 | 1982.37 | 1982.37 | 0% |
| proposals.create | POST /api/proposals | 8 | 1.38 | 1.83 | 1.83 | 1.8 | 2534.49 | 2534.49 | 0% |
| payments.create | POST /api/payments | 8 | 1.53 | 1.86 | 1.86 | 1.82 | 2412.33 | 2412.33 | 0% |
| reviews.list | GET /api/reviews | 8 | 1.09 | 1.22 | 1.22 | 1.19 | 3293.99 | 3293.99 | 0% |
| reviews.create | POST /api/reviews | 8 | 1.46 | 2.45 | 2.45 | 2.34 | 1894.26 | 1894.26 | 0% |
| messages.list | GET /api/messages | 8 | 1.1 | 1.34 | 1.34 | 1.32 | 3280.03 | 3280.03 | 0% |
| messages.create | POST /api/messages | 8 | 1.3 | 1.64 | 1.64 | 1.62 | 2762.03 | 2762.03 | 0% |
| notifications.list | GET /api/notifications | 8 | 0.86 | 1.01 | 1.01 | 0.99 | 4073.06 | 4073.06 | 0% |
| notifications.create | POST /api/notifications | 8 | 1.38 | 1.72 | 1.72 | 1.68 | 2637 | 2637 | 0% |
| uploads.create | POST /api/uploads | 8 | 3.14 | 3.46 | 3.46 | 3.44 | 1190.71 | 1190.71 | 0% |
| search.global | GET /api/search?q=node%20benchmark%20%7Bseed%7D | 8 | 1.39 | 1.54 | 1.54 | 1.5 | 2610.22 | 2610.22 | 0% |
| admin.metrics | GET /api/admin/metrics | 8 | 3.12 | 4.42 | 4.42 | 4.4 | 1091.78 | 1091.78 | 0% |

## Threshold Status

All configured thresholds passed.
