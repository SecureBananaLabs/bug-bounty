# API Benchmark Report (full)

Generated: 2026-05-17T18:15:17.891Z
Target: local ephemeral Express server
Node: v24.15.0
Platform: win32 10.0.26200
CPU: AMD Ryzen 7 4800H with Radeon Graphics          (16 logical cores)
Memory: 64893 MB total
Load: 4 connection(s), 60 request(s) per endpoint

| Endpoint | Method | Expected | p50 ms | p95 ms | p99 ms | TTFB p50 ms | TTFB p95 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error % |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health | GET | 200 | 3.00 | 27.00 | 27.00 | 2.86 | 35.05 | 35.05 | 60.00 | 60.00 | 0.00 |
| auth.register | POST | 201 | 4.00 | 31.00 | 31.00 | 3.50 | 7.20 | 7.20 | 60.00 | 60.00 | 0.00 |
| auth.login | POST | 200 | 4.00 | 15.00 | 15.00 | 2.94 | 5.51 | 5.51 | 60.00 | 60.00 | 0.00 |
| auth.oauthCallback | GET | 200 | 3.00 | 9.00 | 10.00 | 1.63 | 2.77 | 2.77 | 60.00 | 60.00 | 0.00 |
| auth.refresh | POST | 200 | 3.00 | 8.00 | 8.00 | 2.55 | 3.04 | 3.04 | 60.00 | 60.00 | 0.00 |
| users.list | GET | 200 | 2.00 | 8.00 | 9.00 | 2.00 | 3.30 | 3.30 | 60.00 | 60.00 | 0.00 |
| users.create | POST | 201 | 3.00 | 7.00 | 7.00 | 2.05 | 3.47 | 3.47 | 60.00 | 60.00 | 0.00 |
| jobs.list | GET | 200 | 2.00 | 7.00 | 7.00 | 1.87 | 3.15 | 3.15 | 60.00 | 60.00 | 0.00 |
| jobs.create | POST | 201 | 4.00 | 8.00 | 8.00 | 1.90 | 3.34 | 3.34 | 60.00 | 60.00 | 0.00 |
| proposals.list | GET | 200 | 2.00 | 6.00 | 6.00 | 1.73 | 4.92 | 4.92 | 60.00 | 60.00 | 0.00 |
| proposals.create | POST | 201 | 3.00 | 9.00 | 9.00 | 2.52 | 5.12 | 5.12 | 60.00 | 60.00 | 0.00 |
| payments.create | POST | 201 | 2.00 | 8.00 | 9.00 | 2.03 | 3.07 | 3.07 | 60.00 | 60.00 | 0.00 |
| reviews.list | GET | 200 | 2.00 | 8.00 | 8.00 | 1.84 | 2.85 | 2.85 | 60.00 | 60.00 | 0.00 |
| reviews.create | POST | 201 | 3.00 | 8.00 | 8.00 | 2.10 | 3.41 | 3.41 | 60.00 | 60.00 | 0.00 |
| messages.list | GET | 200 | 2.00 | 8.00 | 8.00 | 1.54 | 2.97 | 2.97 | 60.00 | 60.00 | 0.00 |
| messages.create | POST | 201 | 3.00 | 9.00 | 9.00 | 2.22 | 3.32 | 3.32 | 60.00 | 60.00 | 0.00 |
| notifications.list | GET | 200 | 2.00 | 6.00 | 6.00 | 1.81 | 2.49 | 2.49 | 60.00 | 60.00 | 0.00 |
| notifications.create | POST | 201 | 3.00 | 8.00 | 8.00 | 2.43 | 2.83 | 2.83 | 60.00 | 60.00 | 0.00 |
| uploads.create | POST | 201 | 3.00 | 13.00 | 13.00 | 1.85 | 2.96 | 2.96 | 60.00 | 60.00 | 0.00 |
| search.query | GET | 200 | 2.00 | 9.00 | 9.00 | 2.91 | 4.84 | 4.84 | 60.00 | 60.00 | 0.00 |
| admin.metrics | GET | 200 | 3.00 | 8.00 | 9.00 | 1.55 | 2.93 | 2.93 | 60.00 | 60.00 | 0.00 |

## Regression Gate

Passed: all endpoints stayed within configured thresholds.
