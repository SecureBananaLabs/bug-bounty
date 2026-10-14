# API Benchmark Summary

Mode: full
Target: local in-process API server
Generated: 2026-06-05T07:33:33.831Z

## Environment

- CPU: Intel(R) Core(TM) i5-8350U CPU @ 1.70GHz
- CPU cores: 8
- RAM total: 15.86 GB
- OS: win32 10.0.26100
- Node.js: v24.16.0
- Network: loopback for local server; configured target otherwise
- Benchmark tool: autocannon

## Results

Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | p99 TTFB ms | Sustained RPS | Peak RPS | Error %
--- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---:
auth-register | POST /api/auth/register | 6 | 5 | 56 | 56 | 87.34 | 6 | 6 | 0
auth-login | POST /api/auth/login | 6 | 6 | 11 | 11 | 5.85 | 6 | 6 | 0
auth-oauth-callback | GET /api/auth/oauth/github/callback | 6 | 2 | 6 | 6 | 14.78 | 6 | 6 | 0
auth-refresh | POST /api/auth/refresh | 6 | 4 | 13 | 13 | 8.32 | 6 | 6 | 0
users-list | GET /api/users | 6 | 7 | 12 | 12 | 5.46 | 6 | 6 | 0
users-create | POST /api/users | 6 | 2 | 6 | 6 | 17.3 | 6 | 6 | 0
jobs-list | GET /api/jobs | 6 | 2 | 7 | 7 | 2.29 | 6 | 6 | 0
jobs-create | POST /api/jobs | 6 | 2 | 6 | 6 | 6.78 | 6 | 6 | 0
proposals-list | GET /api/proposals | 6 | 1 | 4 | 4 | 5.41 | 6 | 6 | 0
proposals-create | POST /api/proposals | 6 | 3 | 7 | 7 | 5.98 | 6 | 6 | 0
payments-create | POST /api/payments | 6 | 4 | 8 | 8 | 6.58 | 6 | 6 | 0
reviews-list | GET /api/reviews | 6 | 2 | 4 | 4 | 4.58 | 6 | 6 | 0
reviews-create | POST /api/reviews | 6 | 4 | 7 | 7 | 5.54 | 6 | 6 | 0
messages-list | GET /api/messages | 6 | 2 | 5 | 5 | 4.92 | 6 | 6 | 0
messages-create | POST /api/messages | 6 | 3 | 7 | 7 | 9.46 | 6 | 6 | 0
notifications-list | GET /api/notifications | 6 | 1 | 5 | 5 | 7.38 | 6 | 6 | 0
notifications-create | POST /api/notifications | 6 | 1 | 11 | 11 | 4.51 | 6 | 6 | 0
uploads-create | POST /api/uploads | 6 | 4 | 12 | 12 | 8.28 | 6 | 6 | 0
search | GET /api/search?q=api%20benchmark | 6 | 2 | 6 | 6 | 8.43 | 6 | 6 | 0
admin-metrics | GET /api/admin/metrics | 6 | 6 | 22 | 22 | 4.2 | 6 | 6 | 0

## Threshold Gate

Passed.
