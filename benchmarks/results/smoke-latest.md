# API Benchmark Summary

Mode: smoke
Target: local in-process API server
Generated: 2026-06-05T07:32:35.735Z

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
auth-register | POST /api/auth/register | 1 | 74 | 74 | 74 | 74.92 | 1 | 1 | 0
auth-login | POST /api/auth/login | 1 | 4 | 4 | 4 | 4.3 | 1 | 1 | 0
auth-oauth-callback | GET /api/auth/oauth/github/callback | 1 | 4 | 4 | 4 | 9.76 | 1 | 1 | 0
auth-refresh | POST /api/auth/refresh | 1 | 6 | 6 | 6 | 2.27 | 1 | 1 | 0
users-list | GET /api/users | 1 | 2 | 2 | 2 | 2.94 | 1 | 1 | 0
users-create | POST /api/users | 1 | 5 | 5 | 5 | 4.28 | 1 | 1 | 0
jobs-list | GET /api/jobs | 1 | 2 | 2 | 2 | 3.55 | 1 | 1 | 0
jobs-create | POST /api/jobs | 1 | 5 | 5 | 5 | 7.82 | 1 | 1 | 0
proposals-list | GET /api/proposals | 1 | 3 | 3 | 3 | 5.38 | 1 | 1 | 0
proposals-create | POST /api/proposals | 1 | 3 | 3 | 3 | 5.44 | 1 | 1 | 0
payments-create | POST /api/payments | 1 | 3 | 3 | 3 | 4.85 | 1 | 1 | 0
reviews-list | GET /api/reviews | 1 | 3 | 3 | 3 | 3.98 | 1 | 1 | 0
reviews-create | POST /api/reviews | 1 | 3 | 3 | 3 | 8.2 | 1 | 1 | 0
messages-list | GET /api/messages | 1 | 5 | 5 | 5 | 3.15 | 1 | 1 | 0
messages-create | POST /api/messages | 1 | 2 | 2 | 2 | 6.15 | 1 | 1 | 0
notifications-list | GET /api/notifications | 1 | 6 | 6 | 6 | 1.62 | 1 | 1 | 0
notifications-create | POST /api/notifications | 1 | 1 | 1 | 1 | 2.02 | 1 | 1 | 0
uploads-create | POST /api/uploads | 1 | 11 | 11 | 11 | 6.46 | 1 | 1 | 0
search | GET /api/search?q=api%20benchmark | 1 | 6 | 6 | 6 | 3.47 | 1 | 1 | 0
admin-metrics | GET /api/admin/metrics | 1 | 5 | 5 | 5 | 10.63 | 1 | 1 | 0

## Threshold Gate

Passed.
