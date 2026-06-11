# API Benchmark Summary

- Generated at: 2026-05-19T07:36:46.314Z
- Target: http://127.0.0.1:58656
- Mode: smoke
- Requests per endpoint: 3
- Concurrency: 2
- Warmup requests per endpoint: 0
- Node.js: v23.9.0
- Platform: darwin 25.4.0 arm64

| Route | Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| auth.register | POST /api/auth/register | 3 | 6.09 | 9.94 | 9.94 | 9.81 | 278.12 | 278.12 | 0% |
| auth.login | POST /api/auth/login | 3 | 3.83 | 3.96 | 3.96 | 3.86 | 522.69 | 522.69 | 0% |
| auth.oauthCallback | GET /api/auth/oauth/github/callback | 3 | 2.99 | 4.24 | 4.24 | 3.89 | 516.37 | 516.37 | 0% |
| auth.refresh | POST /api/auth/refresh | 3 | 2.54 | 2.77 | 2.77 | 2.72 | 755.54 | 755.54 | 0% |
| users.list | GET /api/users | 3 | 0.95 | 1.09 | 1.09 | 1.05 | 1906.98 | 1906.98 | 0% |
| users.create | POST /api/users | 3 | 2.18 | 3.39 | 3.39 | 3.33 | 558.01 | 558.01 | 0% |
| jobs.list | GET /api/jobs | 3 | 1.14 | 1.34 | 1.34 | 1.31 | 1591.79 | 1591.79 | 0% |
| jobs.create | POST /api/jobs | 3 | 2.49 | 2.82 | 2.82 | 2.78 | 826.36 | 826.36 | 0% |
| proposals.list | GET /api/proposals | 3 | 1.47 | 1.59 | 1.59 | 1.55 | 1435.58 | 1435.58 | 0% |
| proposals.create | POST /api/proposals | 3 | 1.01 | 1.19 | 1.19 | 1.15 | 1737.75 | 1737.75 | 0% |
| payments.create | POST /api/payments | 3 | 1.05 | 1.27 | 1.27 | 1.24 | 1745.03 | 1745.03 | 0% |
| reviews.list | GET /api/reviews | 3 | 1.57 | 1.69 | 1.69 | 1.66 | 1459.29 | 1459.29 | 0% |
| reviews.create | POST /api/reviews | 3 | 1.1 | 1.25 | 1.25 | 1.22 | 1793.9 | 1793.9 | 0% |
| messages.list | GET /api/messages | 3 | 0.69 | 0.81 | 0.81 | 0.78 | 2632.54 | 2632.54 | 0% |
| messages.create | POST /api/messages | 3 | 0.82 | 0.98 | 0.98 | 0.95 | 2190.51 | 2190.51 | 0% |
| notifications.list | GET /api/notifications | 3 | 1.2 | 1.45 | 1.45 | 1.42 | 1577.6 | 1577.6 | 0% |
| notifications.create | POST /api/notifications | 3 | 1.62 | 1.7 | 1.7 | 1.67 | 1245.63 | 1245.63 | 0% |
| uploads.create | POST /api/uploads | 3 | 4.66 | 4.91 | 4.91 | 4.84 | 468.07 | 468.07 | 0% |
| search.global | GET /api/search?q=node%20benchmark%20%7Bseed%7D | 3 | 1.65 | 1.8 | 1.8 | 1.75 | 1272.94 | 1272.94 | 0% |
| admin.metrics | GET /api/admin/metrics | 3 | 2.04 | 2.22 | 2.22 | 2.19 | 1021.02 | 1021.02 | 0% |

## Threshold Status

All configured thresholds passed.
