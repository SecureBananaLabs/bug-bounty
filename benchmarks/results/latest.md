# API Benchmark Summary

Generated: 2026-05-20T04:28:18.515Z

Target: `http://127.0.0.1:65288`
Mode: `full`
Duration per endpoint: 3000ms
Concurrency: 8

## Environment

- Runtime: Node.js v22.21.1
- OS: Darwin 25.3.0 darwin
- CPU: Apple M2 Max (12 cores)
- RAM: 32768MB total, 92MB free at start

## Results

Endpoint | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB p50 ms | TTFB p95 ms | TTFB p99 ms | Error % | Status codes
--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---
`POST /api/auth/register` | 13627 | 4541.25 | 5418.98 | 1.48 | 3.02 | 4.02 | 1.47 | 3 | 4.01 | 0 | 201: 13627
`POST /api/auth/login` | 17702 | 5899.36 | 6452.26 | 1.24 | 2.21 | 2.61 | 1.23 | 2.2 | 2.59 | 0 | 200: 17702
`GET /api/auth/oauth/github/callback` | 26327 | 8772.29 | 8000 | 0.82 | 1.68 | 2.01 | 0.82 | 1.67 | 2.01 | 0 | 200: 26327
`POST /api/auth/refresh` | 21632 | 7209.41 | 7927.01 | 1.01 | 1.9 | 2.34 | 1 | 1.9 | 2.34 | 0 | 200: 21632
`GET /api/users` | 27072 | 9022.83 | 8000 | 0.81 | 1.63 | 1.97 | 0.8 | 1.62 | 1.96 | 0 | 200: 27072
`POST /api/users` | 20816 | 6937.86 | 7642.1 | 1.05 | 2.02 | 2.35 | 1.04 | 2.01 | 2.35 | 0 | 201: 20816
`GET /api/jobs` | 26504 | 8832.73 | 8000 | 0.81 | 1.76 | 2.15 | 0.8 | 1.76 | 2.14 | 0 | 200: 26504
`POST /api/jobs` | 20096 | 6697.62 | 7498.25 | 1.07 | 2.16 | 2.63 | 1.06 | 2.15 | 2.62 | 0 | 201: 20096
`GET /api/proposals` | 23808 | 7934.85 | 8000 | 0.83 | 1.9 | 3.42 | 0.82 | 1.89 | 3.4 | 0 | 200: 23808
`POST /api/proposals` | 20584 | 6860.73 | 7663.14 | 1.04 | 2.14 | 2.43 | 1.04 | 2.13 | 2.42 | 0 | 201: 20584
`POST /api/payments` | 20411 | 6802.78 | 7665.59 | 1.04 | 2.2 | 2.57 | 1.04 | 2.19 | 2.56 | 0 | 201: 20411
`GET /api/reviews` | 26736 | 8910.75 | 8000 | 0.81 | 1.74 | 1.99 | 0.81 | 1.74 | 1.99 | 0 | 200: 26736
`POST /api/reviews` | 20382 | 6792.25 | 7608.18 | 1.05 | 2.15 | 2.51 | 1.05 | 2.14 | 2.5 | 0 | 201: 20382
`GET /api/messages` | 26120 | 8705.48 | 8000 | 0.82 | 1.81 | 2.14 | 0.81 | 1.81 | 2.13 | 0 | 200: 26120
`POST /api/messages` | 20482 | 6826.47 | 7607.58 | 1.05 | 2.1 | 2.39 | 1.05 | 2.1 | 2.38 | 0 | 201: 20482
`GET /api/notifications` | 26792 | 8928.65 | 8000 | 0.81 | 1.76 | 2.06 | 0.8 | 1.76 | 2.05 | 0 | 200: 26792
`POST /api/notifications` | 20240 | 6745.57 | 7532.07 | 1.06 | 2.19 | 2.48 | 1.06 | 2.18 | 2.47 | 0 | 201: 20240
`POST /api/uploads` | 13296 | 4430.82 | 4981.58 | 1.61 | 2.98 | 3.38 | 1.6 | 2.97 | 3.37 | 0 | 201: 13296
`GET /api/search?q=marketplace%20dashboard%20node` | 25880 | 8624.84 | 8000 | 0.84 | 1.81 | 2.08 | 0.83 | 1.8 | 2.07 | 0 | 200: 25880
`GET /api/admin/metrics` | 20001 | 6664.89 | 7339.73 | 1.09 | 2.18 | 2.55 | 1.08 | 2.17 | 2.53 | 0 | 200: 20001

## Regression Gate

Endpoint | Result | Observed p99 ms | Max p99 ms | Observed error % | Max error %
--- | --- | ---: | ---: | ---: | ---:
`POST /api/auth/register` | pass | 4.02 | 500 | 0 | 0
`POST /api/auth/login` | pass | 2.61 | 500 | 0 | 0
`GET /api/auth/oauth/github/callback` | pass | 2.01 | 500 | 0 | 0
`POST /api/auth/refresh` | pass | 2.34 | 500 | 0 | 0
`GET /api/users` | pass | 1.97 | 500 | 0 | 0
`POST /api/users` | pass | 2.35 | 500 | 0 | 0
`GET /api/jobs` | pass | 2.15 | 500 | 0 | 0
`POST /api/jobs` | pass | 2.63 | 500 | 0 | 0
`GET /api/proposals` | pass | 3.42 | 500 | 0 | 0
`POST /api/proposals` | pass | 2.43 | 500 | 0 | 0
`POST /api/payments` | pass | 2.57 | 500 | 0 | 0
`GET /api/reviews` | pass | 1.99 | 500 | 0 | 0
`POST /api/reviews` | pass | 2.51 | 500 | 0 | 0
`GET /api/messages` | pass | 2.14 | 500 | 0 | 0
`POST /api/messages` | pass | 2.39 | 500 | 0 | 0
`GET /api/notifications` | pass | 2.06 | 500 | 0 | 0
`POST /api/notifications` | pass | 2.48 | 500 | 0 | 0
`POST /api/uploads` | pass | 3.38 | 1200 | 0 | 0
`GET /api/search?q=marketplace%20dashboard%20node` | pass | 2.08 | 500 | 0 | 0
`GET /api/admin/metrics` | pass | 2.55 | 500 | 0 | 0
