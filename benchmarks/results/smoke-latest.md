# API Benchmark Summary

Mode: smoke
Target: local in-process API server
Generated: 2026-05-31T16:41:25.470Z

## Environment

- CPU: Intel(R) Core(TM) i5-8350U CPU @ 1.70GHz
- CPU cores: 8
- RAM total: 15.86 GB
- OS: win32 10.0.26100
- Node.js: v24.16.0
- Network: loopback for local server; configured target otherwise

## Results

Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | p99 TTFB ms | Sustained RPS | Peak RPS | Error %
--- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---:
auth-register | POST /api/auth/register | 1 | 333.29 | 333.29 | 333.29 | 330.94 | 2.98 | 1 | 0
auth-login | POST /api/auth/login | 1 | 22.22 | 22.22 | 22.22 | 21.57 | 44.77 | 1 | 0
auth-oauth-callback | GET /api/auth/oauth/github/callback | 1 | 9.04 | 9.04 | 9.04 | 8.56 | 109.72 | 1 | 0
auth-refresh | POST /api/auth/refresh | 1 | 10.84 | 10.84 | 10.84 | 10.17 | 91.75 | 1 | 0
users-list | GET /api/users | 1 | 5.38 | 5.38 | 5.38 | 4.95 | 183.89 | 1 | 0
users-create | POST /api/users | 1 | 15.95 | 15.95 | 15.95 | 14.98 | 62.04 | 1 | 0
jobs-list | GET /api/jobs | 1 | 10.33 | 10.33 | 10.33 | 9.21 | 96.23 | 1 | 0
jobs-create | POST /api/jobs | 1 | 6.67 | 6.67 | 6.67 | 6.32 | 145.15 | 1 | 0
proposals-list | GET /api/proposals | 1 | 7.45 | 7.45 | 7.45 | 3.5 | 133.15 | 1 | 0
proposals-create | POST /api/proposals | 1 | 10.47 | 10.47 | 10.47 | 10.12 | 93.22 | 1 | 0
payments-create | POST /api/payments | 1 | 6.81 | 6.81 | 6.81 | 6.16 | 139.91 | 1 | 0
reviews-list | GET /api/reviews | 1 | 5.28 | 5.28 | 5.28 | 4.99 | 186.78 | 1 | 0
reviews-create | POST /api/reviews | 1 | 11.96 | 11.96 | 11.96 | 11.4 | 82.63 | 1 | 0
messages-list | GET /api/messages | 1 | 3.41 | 3.41 | 3.41 | 3.1 | 291.11 | 1 | 0
messages-create | POST /api/messages | 1 | 14.99 | 14.99 | 14.99 | 14.49 | 66.15 | 1 | 0
notifications-list | GET /api/notifications | 1 | 3.29 | 3.29 | 3.29 | 2.98 | 301.97 | 1 | 0
notifications-create | POST /api/notifications | 1 | 11.28 | 11.28 | 11.28 | 10.35 | 87.6 | 1 | 0
uploads-create | POST /api/uploads | 1 | 32.75 | 32.75 | 32.75 | 32.34 | 28.85 | 1 | 0
search | GET /api/search?q=api%20benchmark | 1 | 6.56 | 6.56 | 6.56 | 6.32 | 151.58 | 1 | 0
admin-metrics | GET /api/admin/metrics | 1 | 8.63 | 8.63 | 8.63 | 7.98 | 114.73 | 1 | 0

## Threshold Gate

Passed.
