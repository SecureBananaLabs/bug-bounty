# API Benchmark Summary

Mode: full
Target: local in-process API server
Generated: 2026-05-31T03:47:05.833Z

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
auth-register | POST /api/auth/register | 6 | 22.87 | 122.23 | 122.23 | 120.32 | 40.66 | 6 | 0
auth-login | POST /api/auth/login | 6 | 11.8 | 14.4 | 14.4 | 14.18 | 217.52 | 6 | 0
auth-oauth-callback | GET /api/auth/oauth/github/callback | 6 | 4.82 | 5.71 | 5.71 | 5.57 | 558.85 | 6 | 0
auth-refresh | POST /api/auth/refresh | 6 | 8.3 | 9.51 | 9.51 | 9.29 | 327.9 | 6 | 0
users-list | GET /api/users | 6 | 5.18 | 8.01 | 8.01 | 7.74 | 460.33 | 6 | 0
users-create | POST /api/users | 6 | 8.48 | 10.44 | 10.44 | 10.16 | 322.28 | 6 | 0
jobs-list | GET /api/jobs | 6 | 5.46 | 7.01 | 7.01 | 6.8 | 477.82 | 6 | 0
jobs-create | POST /api/jobs | 6 | 6.37 | 8.84 | 8.84 | 8.67 | 375.19 | 6 | 0
proposals-list | GET /api/proposals | 6 | 3.58 | 3.73 | 3.73 | 3.62 | 755.52 | 6 | 0
proposals-create | POST /api/proposals | 6 | 5.67 | 8.15 | 8.15 | 7.93 | 440.2 | 6 | 0
payments-create | POST /api/payments | 6 | 4.72 | 5.75 | 5.75 | 5.6 | 581.71 | 6 | 0
reviews-list | GET /api/reviews | 6 | 3.59 | 4.25 | 4.25 | 4.14 | 739.66 | 6 | 0
reviews-create | POST /api/reviews | 6 | 4.6 | 6.12 | 6.12 | 6.01 | 578.77 | 6 | 0
messages-list | GET /api/messages | 6 | 3.29 | 3.95 | 3.95 | 3.77 | 797.62 | 6 | 0
messages-create | POST /api/messages | 6 | 4.91 | 5.94 | 5.94 | 5.82 | 545.24 | 6 | 0
notifications-list | GET /api/notifications | 6 | 4.2 | 9.51 | 9.51 | 9.4 | 442.83 | 6 | 0
notifications-create | POST /api/notifications | 6 | 4.92 | 6.66 | 6.66 | 6.53 | 542.34 | 6 | 0
uploads-create | POST /api/uploads | 6 | 8.69 | 16.97 | 16.97 | 16.86 | 219.61 | 6 | 0
search | GET /api/search?q=api%20benchmark | 6 | 3.51 | 5.18 | 5.18 | 5.08 | 673.28 | 6 | 0
admin-metrics | GET /api/admin/metrics | 6 | 5.02 | 6.34 | 6.34 | 6.23 | 527.42 | 6 | 0

## Threshold Gate

Passed.
