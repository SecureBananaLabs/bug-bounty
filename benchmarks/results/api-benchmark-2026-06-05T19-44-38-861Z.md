# API Benchmark Summary

Generated: 2026-06-05T19:44:38.861Z
Mode: full
Target: http://127.0.0.1:4000
Connections: 2
Pipelining: 1
Requests per endpoint: 8

| Endpoint | Method | p50 ms | p95 ms | p99 ms | RPS avg | RPS peak | TTFB ms | Error % | Gate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| health | GET | 0 | 1 | 1 | 8 | 8 | 0.25 | 0 | pass |
| auth-register | POST | 1 | 4 | 4 | 8 | 8 | 1.5 | 0 | pass |
| auth-login | POST | 0 | 2 | 2 | 8 | 8 | 0.5 | 0 | pass |
| auth-refresh | POST | 0 | 2 | 2 | 8 | 8 | 0.63 | 0 | pass |
| auth-oauth-callback | GET | 0 | 1 | 1 | 8 | 8 | 0.25 | 0 | pass |
| users-list | GET | 0 | 2 | 2 | 8 | 8 | 0.63 | 0 | pass |
| users-create | POST | 0 | 1 | 1 | 8 | 8 | 0.25 | 0 | pass |
| jobs-list | GET | 0 | 2 | 2 | 8 | 8 | 0.5 | 0 | pass |
| jobs-create | POST | 0 | 2 | 2 | 8 | 8 | 0.5 | 0 | pass |
| proposals-list | GET | 0 | 2 | 2 | 8 | 8 | 0.5 | 0 | pass |
| proposals-create | POST | 0 | 1 | 1 | 8 | 8 | 0.25 | 0 | pass |
| payments-create | POST | 0 | 2 | 2 | 8 | 8 | 0.5 | 0 | pass |
| reviews-list | GET | 0 | 1 | 1 | 8 | 8 | 0.25 | 0 | pass |
| reviews-create | POST | 0 | 2 | 2 | 8 | 8 | 0.5 | 0 | pass |
| messages-list | GET | 0 | 2 | 2 | 8 | 8 | 0.5 | 0 | pass |
| messages-create | POST | 0 | 2 | 2 | 8 | 8 | 0.5 | 0 | pass |
| notifications-list | GET | 0 | 2 | 2 | 8 | 8 | 0.38 | 0 | pass |
| notifications-create | POST | 0 | 2 | 2 | 8 | 8 | 0.5 | 0 | pass |
| uploads-create | POST | 0 | 2 | 2 | 8 | 8 | 0.5 | 0 | pass |
| search | GET | 1 | 4 | 4 | 8 | 8 | 1.63 | 0 | pass |
| admin-metrics | GET | 0 | 5 | 5 | 8 | 8 | 1.38 | 0 | pass |

