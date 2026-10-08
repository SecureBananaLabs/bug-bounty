# API Benchmark Results

- Generated: 2026-05-31T07:15:42.574Z
- Mode: full
- Target: http://127.0.0.1:65152
- Started: 2026-05-31T07:15:42.155Z
- Endpoints covered: 21
- Total requests: 168
- Overall error rate: 0%
- Slowest p99: health (15.69 ms)

## Environment

- Platform: Windows_NT 10.0.26200 x64
- CPU: AMD Ryzen 9 3900X 12-Core Processor             (24 logical cores)
- RAM: 63.88 GB total / 40.78 GB free at capture
- Node.js: v22.12.0

## Endpoint Metrics

| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| health | GET | `/health` | 8 | 8.86 | 15.69 | 15.69 | 15.58 | 253.85 | 80 | 0 | 200:8 |
| auth.register | POST | `/api/auth/register` | 8 | 7.98 | 10.53 | 10.53 | 10.46 | 307.41 | 80 | 0 | 201:8 |
| auth.login | POST | `/api/auth/login` | 8 | 6.43 | 7.97 | 7.97 | 7.89 | 428.16 | 80 | 0 | 200:8 |
| auth.oauth.github.callback | GET | `/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state` | 8 | 3.34 | 4.02 | 4.02 | 3.91 | 851.73 | 80 | 0 | 200:8 |
| auth.refresh | POST | `/api/auth/refresh` | 8 | 6.45 | 7.43 | 7.43 | 7.3 | 463.64 | 60 | 0 | 200:8 |
| users.list | GET | `/api/users` | 8 | 3.73 | 4.38 | 4.38 | 4.23 | 742.62 | 80 | 0 | 200:8 |
| users.create | POST | `/api/users` | 8 | 3.55 | 4.86 | 4.86 | 4.78 | 719.29 | 80 | 0 | 201:8 |
| jobs.list | GET | `/api/jobs` | 8 | 3.15 | 4.59 | 4.59 | 4.44 | 776.42 | 80 | 0 | 200:8 |
| jobs.create | POST | `/api/jobs` | 8 | 4.09 | 4.98 | 4.98 | 4.91 | 635.16 | 80 | 0 | 201:8 |
| proposals.list | GET | `/api/proposals` | 8 | 2.85 | 5.58 | 5.58 | 5.49 | 746.9 | 80 | 0 | 200:8 |
| proposals.create | POST | `/api/proposals` | 8 | 3.34 | 3.77 | 3.77 | 3.7 | 805.29 | 80 | 0 | 201:8 |
| payments.create | POST | `/api/payments` | 8 | 3.71 | 4.39 | 4.39 | 4.3 | 747.17 | 80 | 0 | 201:8 |
| reviews.list | GET | `/api/reviews` | 8 | 2.91 | 4.09 | 4.09 | 3.99 | 868.18 | 60 | 0 | 200:8 |
| reviews.create | POST | `/api/reviews` | 8 | 4.29 | 5.02 | 5.02 | 4.94 | 623.47 | 80 | 0 | 201:8 |
| messages.list | GET | `/api/messages` | 8 | 2.18 | 2.54 | 2.54 | 2.47 | 1160.19 | 80 | 0 | 200:8 |
| messages.create | POST | `/api/messages` | 8 | 3.98 | 5.39 | 5.39 | 5.32 | 651.66 | 80 | 0 | 201:8 |
| notifications.list | GET | `/api/notifications` | 8 | 3.03 | 4.18 | 4.18 | 4.12 | 835.61 | 80 | 0 | 200:8 |
| notifications.create | POST | `/api/notifications` | 8 | 3.49 | 4.87 | 4.87 | 4.75 | 731.58 | 80 | 0 | 201:8 |
| uploads.create | POST | `/api/uploads` | 8 | 8.35 | 12.74 | 12.74 | 12.62 | 319.08 | 80 | 0 | 201:8 |
| search.global | GET | `/api/search?q=api%20benchmark%20node%20express` | 8 | 2.84 | 3.89 | 3.89 | 3.81 | 900.4 | 80 | 0 | 200:8 |
| admin.metrics | GET | `/api/admin/metrics` | 8 | 5.86 | 8.56 | 8.56 | 8.5 | 399.18 | 80 | 0 | 200:8 |

## Threshold Gate

- Passed: all configured p99 and error-rate thresholds were met.
