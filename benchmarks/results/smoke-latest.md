# API Benchmark Summary

Mode: smoke
Target: local in-process API server
Generated: 2026-05-31T22:40:26.666Z

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
auth-register | POST /api/auth/register | 1 | 237.73 | 237.73 | 237.73 | 233.61 | 4.17 | 1 | 0
auth-login | POST /api/auth/login | 1 | 13.88 | 13.88 | 13.88 | 13.3 | 71.43 | 1 | 0
auth-oauth-callback | GET /api/auth/oauth/github/callback | 1 | 7.37 | 7.37 | 7.37 | 6.64 | 133.79 | 1 | 0
auth-refresh | POST /api/auth/refresh | 1 | 7.3 | 7.3 | 7.3 | 6.53 | 135.22 | 1 | 0
users-list | GET /api/users | 1 | 7.2 | 7.2 | 7.2 | 6.53 | 137.58 | 1 | 0
users-create | POST /api/users | 1 | 6.7 | 6.7 | 6.7 | 5.92 | 145.31 | 1 | 0
jobs-list | GET /api/jobs | 1 | 4.76 | 4.76 | 4.76 | 4.2 | 207.8 | 1 | 0
jobs-create | POST /api/jobs | 1 | 6.35 | 6.35 | 6.35 | 5.91 | 152.38 | 1 | 0
proposals-list | GET /api/proposals | 1 | 5.91 | 5.91 | 5.91 | 5.4 | 167.63 | 1 | 0
proposals-create | POST /api/proposals | 1 | 8.04 | 8.04 | 8.04 | 7.54 | 119.18 | 1 | 0
payments-create | POST /api/payments | 1 | 5.89 | 5.89 | 5.89 | 5.54 | 164.21 | 1 | 0
reviews-list | GET /api/reviews | 1 | 4.3 | 4.3 | 4.3 | 3.92 | 229.28 | 1 | 0
reviews-create | POST /api/reviews | 1 | 5.29 | 5.29 | 5.29 | 4.94 | 183.29 | 1 | 0
messages-list | GET /api/messages | 1 | 5.85 | 5.85 | 5.85 | 5.5 | 170.36 | 1 | 0
messages-create | POST /api/messages | 1 | 4.52 | 4.52 | 4.52 | 4.05 | 214.13 | 1 | 0
notifications-list | GET /api/notifications | 1 | 3.5 | 3.5 | 3.5 | 3.15 | 283.85 | 1 | 0
notifications-create | POST /api/notifications | 1 | 5.23 | 5.23 | 5.23 | 4.91 | 186.31 | 1 | 0
uploads-create | POST /api/uploads | 1 | 27.9 | 27.9 | 27.9 | 27.53 | 33.66 | 1 | 0
search | GET /api/search?q=api%20benchmark | 1 | 5.49 | 5.49 | 5.49 | 5.25 | 181.04 | 1 | 0
admin-metrics | GET /api/admin/metrics | 1 | 7.27 | 7.27 | 7.27 | 6.89 | 135.97 | 1 | 0

## Threshold Gate

Passed.
