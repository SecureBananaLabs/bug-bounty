# API Benchmark Report

- Mode: full
- Target: http://127.0.0.1:56973
- Started: 2026-05-17T15:06:38.718Z
- Duration per endpoint: 3s
- Connections: 2
- Endpoints covered: 20
- Max p99: 1 ms
- Average sustained RPS: 4424.57
- Average error rate: 0.00%

## Environment

- CPU model and cores: AMD Ryzen 5 6600H with Radeon Graphics         , 12 logical cores
- RAM: 15557 MB total, 2587 MB free during benchmark
- OS: Windows_NT 10.0.22631 x64
- Runtime: Node.js v24.13.0
- Network: loopback/local target by default

## Results

| Endpoint | p50 ms | p95 ms | p99 ms | Sustained RPS | Peak RPS | Error rate | TTFB ms | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| POST /api/auth/register | 0 | 0 | 1 | 2757.67 | 2886 | 0.00% | 37.3 | pass |
| POST /api/auth/login | 0 | 0 | 1 | 2770.34 | 2984 | 0.00% | 4.78 | pass |
| GET /api/auth/oauth/github/callback | 0 | 0 | 0 | 5246 | 5452 | 0.00% | 1.86 | pass |
| POST /api/auth/refresh | 0 | 0 | 1 | 2693.67 | 2944 | 0.00% | 2.44 | pass |
| GET /api/users | 0 | 0 | 0 | 5066 | 5352 | 0.00% | 1.23 | pass |
| POST /api/users | 0 | 0 | 1 | 4278.34 | 4742 | 0.00% | 1.16 | pass |
| GET /api/jobs | 0 | 0 | 0 | 5550 | 5596 | 0.00% | 0.95 | pass |
| POST /api/jobs | 0 | 0 | 0 | 4366 | 4690 | 0.00% | 2.39 | pass |
| GET /api/proposals | 0 | 0 | 0 | 5383.34 | 5450 | 0.00% | 0.99 | pass |
| POST /api/proposals | 0 | 0 | 1 | 4306 | 4408 | 0.00% | 1.35 | pass |
| POST /api/payments | 0 | 0 | 0 | 4828.67 | 4930 | 0.00% | 1.22 | pass |
| GET /api/reviews | 0 | 0 | 0 | 5270 | 5422 | 0.00% | 1.2 | pass |
| POST /api/reviews | 0 | 0 | 0 | 4572.67 | 4654 | 0.00% | 1.49 | pass |
| GET /api/messages | 0 | 0 | 0 | 5247.34 | 5622 | 0.00% | 0.79 | pass |
| POST /api/messages | 0 | 0 | 0 | 4658 | 4720 | 0.00% | 0.9 | pass |
| GET /api/notifications | 0 | 0 | 0 | 5260.67 | 5644 | 0.00% | 0.9 | pass |
| POST /api/notifications | 0 | 0 | 0 | 4690 | 4878 | 0.00% | 1.47 | pass |
| GET /api/search?q=node%20stripe%20freelancer | 0 | 0 | 0 | 4998 | 5284 | 0.00% | 2.53 | pass |
| POST /api/uploads | 0 | 0 | 1 | 3671 | 3838 | 0.00% | 9.07 | pass |
| GET /api/admin/metrics | 0 | 0 | 1 | 2877.67 | 2964 | 0.00% | 2.28 | pass |
