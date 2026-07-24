# API Benchmark Report

- Mode: smoke
- Target: http://127.0.0.1:64194
- Started: 2026-05-17T15:05:56.668Z
- Duration per endpoint: 1s
- Connections: 1
- Endpoints covered: 20
- Max p99: 3 ms
- Average sustained RPS: 1
- Average error rate: 0.00%

## Environment

- CPU model and cores: AMD Ryzen 5 6600H with Radeon Graphics         , 12 logical cores
- RAM: 15557 MB total, 2788 MB free during benchmark
- OS: Windows_NT 10.0.22631 x64
- Runtime: Node.js v24.13.0
- Network: loopback/local target by default

## Results

| Endpoint | p50 ms | p95 ms | p99 ms | Sustained RPS | Peak RPS | Error rate | TTFB ms | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| POST /api/auth/register | 3 | 0 | 3 | 1 | 1 | 0.00% | 32.08 | pass |
| POST /api/auth/login | 1 | 0 | 1 | 1 | 1 | 0.00% | 2.26 | pass |
| GET /api/auth/oauth/github/callback | 3 | 0 | 3 | 1 | 1 | 0.00% | 2.06 | pass |
| POST /api/auth/refresh | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.67 | pass |
| GET /api/users | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.4 | pass |
| POST /api/users | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.66 | pass |
| GET /api/jobs | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.04 | pass |
| POST /api/jobs | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.79 | pass |
| GET /api/proposals | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.78 | pass |
| POST /api/proposals | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.35 | pass |
| POST /api/payments | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.49 | pass |
| GET /api/reviews | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.6 | pass |
| POST /api/reviews | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.71 | pass |
| GET /api/messages | 1 | 0 | 1 | 1 | 1 | 0.00% | 0.94 | pass |
| POST /api/messages | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.37 | pass |
| GET /api/notifications | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.39 | pass |
| POST /api/notifications | 1 | 0 | 1 | 1 | 1 | 0.00% | 1.17 | pass |
| GET /api/search?q=node%20stripe%20freelancer | 1 | 0 | 1 | 1 | 1 | 0.00% | 2.22 | pass |
| POST /api/uploads | 1 | 0 | 1 | 1 | 1 | 0.00% | 6.82 | pass |
| GET /api/admin/metrics | 3 | 0 | 3 | 1 | 1 | 0.00% | 2.97 | pass |
