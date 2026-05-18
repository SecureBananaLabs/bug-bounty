# API Benchmark Report (full)

Generated: 2026-05-18T15:15:06.547Z
Target: local ephemeral Express server
Node: v24.15.0
Platform: win32 10.0.26200
CPU: AMD Ryzen 7 4800H with Radeon Graphics          (16 logical cores)
Memory: 64893 MB total
Load: 4 connection(s), 60 request(s) per endpoint

| Endpoint | Method | Expected | Sampled statuses | p50 ms | p95 ms | p99 ms | TTFB p50 ms | TTFB p95 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error % |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health | GET | 200 | 200: 5 | 5.00 | 38.00 | 38.00 | 3.47 | 60.04 | 60.04 | 60.00 | 60.00 | 0.00 |
| auth.register | POST | 201 | 201: 5 | 6.00 | 45.00 | 46.00 | 4.56 | 7.50 | 7.50 | 60.00 | 60.00 | 0.00 |
| auth.login | POST | 200 | 200: 5 | 6.00 | 21.00 | 21.00 | 3.27 | 6.03 | 6.03 | 60.00 | 60.00 | 0.00 |
| auth.oauthCallback | GET | 200 | 200: 5 | 3.00 | 10.00 | 10.00 | 1.53 | 3.14 | 3.14 | 60.00 | 60.00 | 0.00 |
| auth.refresh | POST | 200 | 200: 5 | 4.00 | 11.00 | 11.00 | 1.73 | 3.52 | 3.52 | 60.00 | 60.00 | 0.00 |
| users.list | GET | 200 | 200: 5 | 2.00 | 7.00 | 7.00 | 1.54 | 2.28 | 2.28 | 60.00 | 60.00 | 0.00 |
| users.create | POST | 201 | 201: 5 | 3.00 | 7.00 | 7.00 | 2.08 | 3.35 | 3.35 | 60.00 | 60.00 | 0.00 |
| jobs.list | GET | 200 | 200: 5 | 3.00 | 8.00 | 8.00 | 2.19 | 4.09 | 4.09 | 60.00 | 60.00 | 0.00 |
| jobs.create | POST | 201 | 201: 5 | 5.00 | 13.00 | 13.00 | 2.94 | 3.32 | 3.32 | 60.00 | 60.00 | 0.00 |
| proposals.list | GET | 200 | 200: 5 | 3.00 | 7.00 | 7.00 | 1.84 | 4.81 | 4.81 | 60.00 | 60.00 | 0.00 |
| proposals.create | POST | 201 | 201: 5 | 4.00 | 12.00 | 12.00 | 5.07 | 9.14 | 9.14 | 60.00 | 60.00 | 0.00 |
| payments.create | POST | 201 | 201: 5 | 5.00 | 13.00 | 13.00 | 2.86 | 3.91 | 3.91 | 60.00 | 60.00 | 0.00 |
| reviews.list | GET | 200 | 200: 5 | 3.00 | 10.00 | 10.00 | 1.85 | 2.92 | 2.92 | 60.00 | 60.00 | 0.00 |
| reviews.create | POST | 201 | 201: 5 | 3.00 | 10.00 | 11.00 | 4.47 | 5.66 | 5.66 | 60.00 | 60.00 | 0.00 |
| messages.list | GET | 200 | 200: 5 | 4.00 | 11.00 | 12.00 | 1.48 | 2.65 | 2.65 | 60.00 | 60.00 | 0.00 |
| messages.create | POST | 201 | 201: 5 | 3.00 | 7.00 | 7.00 | 4.07 | 5.58 | 5.58 | 60.00 | 60.00 | 0.00 |
| notifications.list | GET | 200 | 200: 5 | 2.00 | 9.00 | 9.00 | 1.58 | 3.09 | 3.09 | 60.00 | 60.00 | 0.00 |
| notifications.create | POST | 201 | 201: 5 | 2.00 | 6.00 | 7.00 | 2.42 | 4.19 | 4.19 | 60.00 | 60.00 | 0.00 |
| uploads.create | POST | 201 | 201: 5 | 4.00 | 16.00 | 17.00 | 1.64 | 3.04 | 3.04 | 60.00 | 60.00 | 0.00 |
| search.query | GET | 200 | 200: 5 | 2.00 | 7.00 | 7.00 | 1.74 | 4.71 | 4.71 | 60.00 | 60.00 | 0.00 |
| admin.metrics | GET | 200 | 200: 5 | 4.00 | 9.00 | 9.00 | 2.13 | 3.24 | 3.24 | 60.00 | 60.00 | 0.00 |

## Regression Gate

Passed: all endpoints stayed within configured thresholds.
