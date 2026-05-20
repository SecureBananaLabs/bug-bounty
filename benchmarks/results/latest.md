# API Benchmark Report

- Run ID: 2026-05-20T04-17-31-929Z
- Mode: full
- Target: http://127.0.0.1:54642
- Requests per endpoint: 10
- Concurrency: 2
- Runtime: v25.9.0
- OS: Darwin 25.3.0 arm64
- CPU: Apple M4 Max (16 logical cores)
- Memory: 65536MB total, 1434MB free at start

| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| auth.register | POST | `/api/auth/register` | 10 | 0.8 | 11.61 | 11.61 | 11.51 | 614.55 | 10 | 0 | 201: 10 |
| auth.login | POST | `/api/auth/login` | 10 | 0.4 | 0.63 | 0.63 | 0.62 | 4308.56 | 10 | 0 | 200: 10 |
| auth.oauthCallback | GET | `/api/auth/oauth/github/callback?code=benchmark-code` | 10 | 0.33 | 1 | 1 | 0.99 | 4279.14 | 10 | 0 | 200: 10 |
| auth.refresh | POST | `/api/auth/refresh` | 10 | 0.32 | 0.43 | 0.43 | 0.43 | 5625.09 | 10 | 0 | 200: 10 |
| users.list | GET | `/api/users` | 10 | 0.22 | 0.3 | 0.3 | 0.3 | 8181.35 | 10 | 0 | 200: 10 |
| users.create | POST | `/api/users` | 10 | 0.24 | 0.29 | 0.29 | 0.29 | 7459.21 | 10 | 0 | 201: 10 |
| jobs.list | GET | `/api/jobs` | 10 | 0.21 | 0.25 | 0.25 | 0.25 | 8601.84 | 10 | 0 | 200: 10 |
| jobs.create | POST | `/api/jobs` | 10 | 0.31 | 0.58 | 0.58 | 0.58 | 4893.86 | 10 | 0 | 201: 10 |
| proposals.list | GET | `/api/proposals` | 10 | 0.2 | 0.28 | 0.28 | 0.28 | 8381.64 | 10 | 0 | 200: 10 |
| proposals.create | POST | `/api/proposals` | 10 | 0.23 | 0.28 | 0.28 | 0.28 | 8178.29 | 10 | 0 | 201: 10 |
| payments.create | POST | `/api/payments` | 10 | 0.23 | 0.47 | 0.47 | 0.46 | 6760.57 | 10 | 0 | 201: 10 |
| reviews.list | GET | `/api/reviews` | 10 | 0.19 | 0.31 | 0.31 | 0.31 | 8677.41 | 10 | 0 | 200: 10 |
| reviews.create | POST | `/api/reviews` | 10 | 0.23 | 0.29 | 0.29 | 0.28 | 7983.5 | 10 | 0 | 201: 10 |
| messages.list | GET | `/api/messages` | 10 | 0.17 | 0.27 | 0.27 | 0.27 | 10072.6 | 10 | 0 | 200: 10 |
| messages.create | POST | `/api/messages` | 10 | 0.2 | 0.23 | 0.23 | 0.22 | 9234.33 | 10 | 0 | 201: 10 |
| notifications.list | GET | `/api/notifications` | 10 | 0.17 | 0.4 | 0.4 | 0.39 | 8631.23 | 10 | 0 | 200: 10 |
| notifications.create | POST | `/api/notifications` | 10 | 0.2 | 0.23 | 0.23 | 0.23 | 9045.68 | 10 | 0 | 201: 10 |
| uploads.create | POST | `/api/uploads` | 10 | 0.45 | 2.65 | 2.65 | 2.65 | 2229.12 | 10 | 0 | 201: 10 |
| search.global | GET | `/api/search?q=react%20payments%20dashboard` | 10 | 0.25 | 0.48 | 0.48 | 0.47 | 6504.95 | 10 | 0 | 200: 10 |
| admin.metrics | GET | `/api/admin/metrics` | 10 | 0.27 | 0.84 | 0.84 | 0.84 | 5042.23 | 10 | 0 | 200: 10 |

## Threshold Gate

No threshold failures.
