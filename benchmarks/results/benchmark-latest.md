# API Benchmark Summary

Mode: full
Target: local in-process API server
Generated: 2026-06-04T08:13:58.058Z

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
auth-register | POST /api/auth/register | 6 | 8 | 63 | 63 | 142.24 | 6 | 6 | 0
auth-login | POST /api/auth/login | 6 | 8 | 22 | 22 | 10.44 | 6 | 6 | 0
auth-oauth-callback | GET /api/auth/oauth/github/callback | 6 | 5 | 9 | 9 | 10.13 | 6 | 6 | 0
auth-refresh | POST /api/auth/refresh | 6 | 6 | 7 | 7 | 12.16 | 6 | 6 | 0
users-list | GET /api/users | 6 | 12 | 17 | 17 | 8.06 | 6 | 6 | 0
users-create | POST /api/users | 6 | 6 | 11 | 11 | 9.77 | 6 | 6 | 0
jobs-list | GET /api/jobs | 6 | 4 | 9 | 9 | 3.21 | 6 | 6 | 0
jobs-create | POST /api/jobs | 6 | 2 | 6 | 6 | 11.53 | 6 | 6 | 0
proposals-list | GET /api/proposals | 6 | 2 | 9 | 9 | 6 | 6 | 6 | 0
proposals-create | POST /api/proposals | 6 | 3 | 8 | 8 | 12.2 | 6 | 6 | 0
payments-create | POST /api/payments | 6 | 8 | 23 | 23 | 7.77 | 6 | 6 | 0
reviews-list | GET /api/reviews | 6 | 3 | 8 | 8 | 7.39 | 6 | 6 | 0
reviews-create | POST /api/reviews | 6 | 5 | 12 | 12 | 11.44 | 6 | 6 | 0
messages-list | GET /api/messages | 6 | 6 | 16 | 16 | 8.54 | 6 | 6 | 0
messages-create | POST /api/messages | 6 | 6 | 15 | 15 | 11.49 | 6 | 6 | 0
notifications-list | GET /api/notifications | 6 | 2 | 8 | 8 | 6.97 | 6 | 6 | 0
notifications-create | POST /api/notifications | 6 | 2 | 13 | 13 | 8.71 | 6 | 6 | 0
uploads-create | POST /api/uploads | 6 | 7 | 30 | 30 | 11.53 | 6 | 6 | 0
search | GET /api/search?q=api%20benchmark | 6 | 4 | 10 | 10 | 5.54 | 6 | 6 | 0
admin-metrics | GET /api/admin/metrics | 6 | 5 | 15 | 15 | 7.33 | 6 | 6 | 0

## Threshold Gate

Passed.
