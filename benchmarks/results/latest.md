# API Benchmark Report

Generated: 2026-05-17T06:07:51.819Z
Mode: full
Target: http://127.0.0.1:4000

## Environment

- CPU model & cores: Apple M5 Pro (18)
- RAM total / free: 48 GB / 7.15 GB
- OS: darwin 25.4.0
- Node.js: v25.9.0
- Network: loopback/local or configured target host

## Results

| Endpoint | p50 ms | p95 ms | p99 ms | TTFB ms | Sustained RPS | Peak RPS | Error % | Status | Gate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `POST /api/auth/register` | 0 | 1 | 1 | 6.17 | 8 | 8 | 0 | 201 | PASS |
| `POST /api/auth/login` | 0 | 0 | 0 | 1.39 | 8 | 8 | 0 | 200 | PASS |
| `GET /api/auth/oauth/github/callback` | 0 | 1 | 1 | 2.41 | 8 | 8 | 0 | 200 | PASS |
| `POST /api/auth/refresh` | 0 | 2 | 2 | 2.67 | 8 | 8 | 0 | 200 | PASS |
| `GET /api/users` | 0 | 1 | 1 | 2.67 | 8 | 8 | 0 | 200 | PASS |
| `POST /api/users` | 0 | 2 | 2 | 3.84 | 8 | 8 | 0 | 201 | PASS |
| `GET /api/jobs` | 0 | 1 | 1 | 2.71 | 8 | 8 | 0 | 200 | PASS |
| `POST /api/jobs` | 0 | 2 | 2 | 3.59 | 8 | 8 | 0 | 201 | PASS |
| `GET /api/proposals` | 0 | 1 | 1 | 2.91 | 8 | 8 | 0 | 200 | PASS |
| `POST /api/proposals` | 0 | 1 | 1 | 3.39 | 8 | 8 | 0 | 201 | PASS |
| `POST /api/payments` | 0 | 1 | 1 | 3.73 | 8 | 8 | 0 | 201 | PASS |
| `GET /api/reviews` | 0 | 1 | 1 | 2.76 | 8 | 8 | 0 | 200 | PASS |
| `POST /api/reviews` | 0 | 1 | 1 | 2.16 | 8 | 8 | 0 | 201 | PASS |
| `GET /api/messages` | 0 | 1 | 1 | 2.33 | 8 | 8 | 0 | 200 | PASS |
| `POST /api/messages` | 0 | 1 | 1 | 2.6 | 8 | 8 | 0 | 201 | PASS |
| `GET /api/notifications` | 0 | 1 | 1 | 2.48 | 8 | 8 | 0 | 200 | PASS |
| `POST /api/notifications` | 0 | 0 | 0 | 0.99 | 8 | 8 | 0 | 201 | PASS |
| `POST /api/uploads` | 0 | 1 | 1 | 8.16 | 8 | 8 | 0 | 201 | PASS |
| `GET /api/search?q=typescript%20benchmark` | 0 | 1 | 1 | 3.82 | 8 | 8 | 0 | 200 | PASS |
| `GET /api/admin/metrics` | 0 | 2 | 2 | 4.04 | 8 | 8 | 0 | 200 | PASS |

## Thresholds

Thresholds are loaded from `benchmarks/thresholds.json`. The CI smoke run fails on threshold regressions so reviewers can tune the values in code review.
