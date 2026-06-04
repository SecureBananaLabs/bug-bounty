# API Benchmark Summary

Mode: smoke
Target: local in-process API server
Generated: 2026-06-04T08:13:25.940Z

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
auth-register | POST /api/auth/register | 1 | 101 | 101 | 101 | 126.07 | 1 | 1 | 0
auth-login | POST /api/auth/login | 1 | 11 | 11 | 11 | 9.96 | 1 | 1 | 0
auth-oauth-callback | GET /api/auth/oauth/github/callback | 1 | 5 | 5 | 5 | 7.81 | 1 | 1 | 0
auth-refresh | POST /api/auth/refresh | 1 | 6 | 6 | 6 | 4.38 | 1 | 1 | 0
users-list | GET /api/users | 1 | 5 | 5 | 5 | 4.32 | 1 | 1 | 0
users-create | POST /api/users | 1 | 4 | 4 | 4 | 6.52 | 1 | 1 | 0
jobs-list | GET /api/jobs | 1 | 4 | 4 | 4 | 4.53 | 1 | 1 | 0
jobs-create | POST /api/jobs | 1 | 7 | 7 | 7 | 13.47 | 1 | 1 | 0
proposals-list | GET /api/proposals | 1 | 6 | 6 | 6 | 3.33 | 1 | 1 | 0
proposals-create | POST /api/proposals | 1 | 3 | 3 | 3 | 7.18 | 1 | 1 | 0
payments-create | POST /api/payments | 1 | 5 | 5 | 5 | 3.37 | 1 | 1 | 0
reviews-list | GET /api/reviews | 1 | 2 | 2 | 2 | 5.13 | 1 | 1 | 0
reviews-create | POST /api/reviews | 1 | 3 | 3 | 3 | 5.34 | 1 | 1 | 0
messages-list | GET /api/messages | 1 | 3 | 3 | 3 | 2.29 | 1 | 1 | 0
messages-create | POST /api/messages | 1 | 3 | 3 | 3 | 3.5 | 1 | 1 | 0
notifications-list | GET /api/notifications | 1 | 3 | 3 | 3 | 9.71 | 1 | 1 | 0
notifications-create | POST /api/notifications | 1 | 10 | 10 | 10 | 11.43 | 1 | 1 | 0
uploads-create | POST /api/uploads | 1 | 24 | 24 | 24 | 7.04 | 1 | 1 | 0
search | GET /api/search?q=api%20benchmark | 1 | 5 | 5 | 5 | 6.19 | 1 | 1 | 0
admin-metrics | GET /api/admin/metrics | 1 | 9 | 9 | 9 | 22.83 | 1 | 1 | 0

## Threshold Gate

Passed.
