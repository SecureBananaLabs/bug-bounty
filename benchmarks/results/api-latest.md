# API Benchmark Report

Generated: 2026-05-19T11:30:23.177Z

Base URL: `http://127.0.0.1:60906`

Requests per endpoint: 6
Concurrency per endpoint: 2

## Summary

- Endpoints: 20
- Total requests: 120
- Total failures: 0
- Error rate: 0%
- Slowest p95 endpoint: auth.register (9.93 ms)

## Endpoint Results

| Endpoint | Method | Path | Requests | Error rate | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | p95 TTFB ms |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| auth.register | POST | `/api/auth/register` | 6 | 0% | 284.33 | 284.33 | 6.55 | 9.93 | 9.93 | 9.7 |
| auth.login | POST | `/api/auth/login` | 6 | 0% | 671.75 | 671.75 | 2.86 | 3.51 | 3.51 | 3.42 |
| auth.oauthCallback | GET | `/api/auth/oauth/github/callback` | 6 | 0% | 937.51 | 937.51 | 2 | 2.57 | 2.57 | 2.41 |
| auth.refresh | POST | `/api/auth/refresh` | 6 | 0% | 944.45 | 944.45 | 1.7 | 2.92 | 2.92 | 2.82 |
| users.list | GET | `/api/users` | 6 | 0% | 1499.25 | 1499.25 | 1.21 | 1.48 | 1.48 | 1.43 |
| users.create | POST | `/api/users` | 6 | 0% | 1069.12 | 1069.12 | 1.63 | 2.11 | 2.11 | 2.06 |
| jobs.list | GET | `/api/jobs` | 6 | 0% | 1678.93 | 1678.93 | 1.1 | 1.29 | 1.29 | 1.25 |
| jobs.create | POST | `/api/jobs` | 6 | 0% | 998.95 | 998.95 | 1.76 | 2.27 | 2.27 | 2.22 |
| proposals.list | GET | `/api/proposals` | 6 | 0% | 1359.9 | 1359.9 | 1.22 | 1.65 | 1.65 | 1.56 |
| proposals.create | POST | `/api/proposals` | 6 | 0% | 842.15 | 842.15 | 2.22 | 2.54 | 2.54 | 2.45 |
| payments.create | POST | `/api/payments` | 6 | 0% | 808.67 | 808.67 | 2.28 | 2.83 | 2.83 | 2.77 |
| reviews.list | GET | `/api/reviews` | 6 | 0% | 1623.07 | 1623.07 | 1.1 | 1.41 | 1.41 | 1.36 |
| reviews.create | POST | `/api/reviews` | 6 | 0% | 1351.23 | 1351.23 | 1.39 | 1.68 | 1.68 | 1.64 |
| messages.list | GET | `/api/messages` | 6 | 0% | 1691.95 | 1691.95 | 1.09 | 1.27 | 1.27 | 1.23 |
| messages.create | POST | `/api/messages` | 6 | 0% | 1159.26 | 1159.26 | 1.45 | 1.95 | 1.95 | 1.89 |
| notifications.list | GET | `/api/notifications` | 6 | 0% | 1542.93 | 1542.93 | 1.22 | 1.4 | 1.4 | 1.35 |
| notifications.create | POST | `/api/notifications` | 6 | 0% | 1291.13 | 1291.13 | 1.47 | 1.63 | 1.63 | 1.58 |
| uploads.create | POST | `/api/uploads` | 6 | 0% | 428.76 | 428.76 | 2.97 | 6.92 | 6.92 | 6.87 |
| search.global | GET | `/api/search?q=benchmark` | 6 | 0% | 1338.87 | 1338.87 | 1.17 | 2.06 | 2.06 | 1.98 |
| admin.metrics | GET | `/api/admin/metrics` | 6 | 0% | 1050.51 | 1050.51 | 1.49 | 2.71 | 2.71 | 2.65 |
