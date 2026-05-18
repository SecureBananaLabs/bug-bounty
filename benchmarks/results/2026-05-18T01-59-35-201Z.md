# API Benchmark Report

- Mode: full
- Target: http://127.0.0.1:60304
- Started: 2026-05-18T01:59:35.201Z
- Finished: 2026-05-18T01:59:55.268Z
- Duration per route: 1s
- Connections: 8
- Pipelining: 1
- Routes covered: 20
- Threshold status: PASS

Endpoint | p50 ms | p95 ms | p99 ms | sustained req/s | peak req/s | error % | TTFB ms
--- | ---: | ---: | ---: | ---: | ---: | ---: | ---:
POST /api/auth/register | 0 | 1 | 1 | 12092 | 12094 | 0 | 9.61
POST /api/auth/login | 0 | 0 | 1 | 13644 | 13645 | 0 | 2.15
GET /api/auth/oauth/:provider/callback | 0 | 0 | 0 | 20472 | 20474 | 0 | 0.91
POST /api/auth/refresh | 0 | 0 | 1 | 14412 | 14410 | 0 | 0.71
GET /api/users | 0 | 0 | 0 | 21160 | 21160 | 0 | 0.67
POST /api/users | 0 | 0 | 0 | 18344 | 18348 | 0 | 0.53
GET /api/jobs | 0 | 0 | 0 | 20984 | 20976 | 0 | 0.49
POST /api/jobs | 0 | 0 | 1 | 17192 | 17198 | 0 | 0.82
GET /api/proposals | 0 | 0 | 0 | 21000 | 21001 | 0 | 0.91
POST /api/proposals | 0 | 0 | 0 | 18392 | 18384 | 0 | 0.49
POST /api/payments | 0 | 0 | 1 | 17624 | 17629 | 0 | 0.32
GET /api/reviews | 0 | 0 | 1 | 19752 | 19755 | 0 | 0.76
POST /api/reviews | 0 | 0 | 0 | 17864 | 17857 | 0 | 0.5
GET /api/messages | 0 | 0 | 0 | 20744 | 20743 | 0 | 0.53
POST /api/messages | 0 | 0 | 1 | 17448 | 17446 | 0 | 0.5
GET /api/notifications | 0 | 0 | 0 | 20088 | 20088 | 0 | 1.33
POST /api/notifications | 0 | 0 | 0 | 18136 | 18136 | 0 | 0.45
POST /api/uploads | 0 | 1 | 1 | 14356 | 14353 | 0 | 2.14
GET /api/search | 0 | 0 | 0 | 19624 | 19619 | 0 | 0.85
GET /api/admin/metrics | 0 | 1 | 1 | 13988 | 13991 | 0 | 1.34
