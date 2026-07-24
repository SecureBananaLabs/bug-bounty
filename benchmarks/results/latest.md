# API benchmark report

- Mode: full
- Target: http://127.0.0.1:57747
- Started: 2026-05-17T15:06:17.472Z
- Finished: 2026-05-17T15:07:17.676Z
- Connections: 4
- Duration per endpoint: 3s

| Route | p50 ms | p95 ms | p99 ms | Avg RPS | Peak RPS | Error rate | Non-2xx rate | TTFB ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| POST /api/auth/register | 5 | 11 | 14 | 646.67 | 804 | 0 | 0 | 56.1408 |
| POST /api/auth/login | 5 | 29 | 32 | 597.34 | 764 | 0 | 0 | 13.7623 |
| GET /api/auth/oauth/:provider/callback | 1 | 3 | 10 | 2494 | 3712 | 0 | 0 | 17.2811 |
| POST /api/auth/refresh | 5 | 25 | 30 | 600 | 768 | 0 | 0 | 10.8571 |
| GET /api/users | 0 | 3 | 7 | 3993.34 | 4844 | 0 | 0 | 5.3746 |
| POST /api/users | 0 | 2 | 8 | 3681.67 | 4568 | 0 | 0 | 4.7824 |
| GET /api/jobs | 0 | 2 | 2 | 4272.34 | 4816 | 0 | 0 | 21.0897 |
| POST /api/jobs | 0 | 3 | 9 | 3198.34 | 4096 | 0 | 0 | 9.0399 |
| GET /api/proposals | 0 | 4 | 7 | 3478.34 | 4924 | 0 | 0 | 11.3244 |
| POST /api/proposals | 0 | 4 | 8 | 3298.67 | 4236 | 0 | 0 | 3.8485 |
| POST /api/payments | 0 | 3 | 5 | 3223.67 | 3504 | 0 | 0 | 5.9419 |
| GET /api/reviews | 0 | 2 | 3 | 4569.67 | 5756 | 0 | 0 | 20.4217 |
| POST /api/reviews | 1 | 4 | 7 | 2588.34 | 3684 | 0 | 0 | 7.1007 |
| GET /api/messages | 0 | 2 | 4 | 4061.67 | 4480 | 0 | 0 | 6.048 |
| POST /api/messages | 0 | 3 | 6 | 3356 | 4148 | 0 | 0 | 4.7075 |
| GET /api/notifications | 0 | 2 | 4 | 4512.34 | 5300 | 0 | 0 | 6.5199 |
| POST /api/notifications | 0 | 3 | 5 | 3190.67 | 4312 | 0 | 0 | 23.8557 |
| POST /api/uploads | 0 | 4 | 8 | 3245 | 3732 | 0 | 0 | 6.0527 |
| GET /api/search | 0 | 3 | 6 | 3594.34 | 3936 | 0 | 0 | 11.1983 |
| GET /api/admin/metrics | 4 | 15 | 18 | 754.67 | 848 | 0 | 0 | 10.4318 |

## Thresholds

No threshold failures.

## Environment

- OS: Windows_NT 10.0.26300 x64
- CPU: Intel(R) Core(TM) i5-1035G1 CPU @ 1.00GHz
- Logical cores: 8
- Total memory MB: 7986
- Free memory MB: 1718
- Node.js: v24.4.0
