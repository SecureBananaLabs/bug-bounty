# API benchmark report

Generated: 2026-10-20T23:35:54.368Z

Real API routes, isolated loopback fixture per endpoint, synthetic in-memory data. These results do not measure a database, Stripe, or production capacity.

Node v24.19.0; darwin/arm64; Apple M5; 10 logical CPUs.
1000 measured requests + 20 warmup per endpoint; concurrency 4; timeout 5000 ms.
Fixture limiter: 100000 requests/15min; normal server default remains 200/15min. Warmup is excluded from metrics.

| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p50/p95/p99 ms | RPS | Peak RPS (100ms) | Errors |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| POST /api/auth/register | 0.22 | 0.51 | 0.86 | 0.22/0.50/0.82 | 14759.58 | 14759.58 | 0/1000 (0.00%) |
| POST /api/auth/login | 0.21 | 0.48 | 0.64 | 0.21/0.47/0.64 | 15273.21 | 15273.21 | 0/1000 (0.00%) |
| GET /api/auth/oauth/:provider/callback | 0.13 | 0.27 | 0.42 | 0.13/0.27/0.42 | 25089.51 | 25089.51 | 0/1000 (0.00%) |
| POST /api/auth/refresh | 0.21 | 0.45 | 0.68 | 0.21/0.45/0.68 | 15601.34 | 15601.34 | 0/1000 (0.00%) |
| GET /api/users | 0.24 | 0.51 | 0.75 | 0.23/0.51/0.75 | 13068.20 | 13068.20 | 0/1000 (0.00%) |
| POST /api/users | 0.15 | 0.36 | 0.56 | 0.15/0.36/0.56 | 21812.01 | 21812.01 | 0/1000 (0.00%) |
| GET /api/jobs | 0.24 | 0.50 | 0.62 | 0.24/0.50/0.62 | 13219.08 | 13219.08 | 0/1000 (0.00%) |
| POST /api/jobs | 0.16 | 0.40 | 0.66 | 0.16/0.40/0.66 | 20337.90 | 20337.90 | 0/1000 (0.00%) |
| GET /api/proposals | 0.23 | 0.56 | 1.01 | 0.23/0.56/1.01 | 13166.39 | 13166.39 | 0/1000 (0.00%) |
| POST /api/proposals | 0.15 | 0.36 | 0.56 | 0.15/0.35/0.55 | 21566.23 | 21566.23 | 0/1000 (0.00%) |
| POST /api/payments | 0.15 | 0.40 | 0.72 | 0.15/0.40/0.71 | 20739.86 | 20739.86 | 0/1000 (0.00%) |
| GET /api/reviews | 0.22 | 0.49 | 0.69 | 0.22/0.49/0.69 | 14008.47 | 14008.47 | 0/1000 (0.00%) |
| POST /api/reviews | 0.14 | 0.35 | 0.57 | 0.14/0.35/0.57 | 22346.56 | 22346.56 | 0/1000 (0.00%) |
| GET /api/messages | 0.23 | 0.50 | 0.81 | 0.23/0.49/0.81 | 13514.71 | 13514.71 | 0/1000 (0.00%) |
| POST /api/messages | 0.16 | 0.37 | 0.61 | 0.16/0.37/0.60 | 20656.55 | 20656.55 | 0/1000 (0.00%) |
| GET /api/notifications | 0.23 | 0.50 | 0.76 | 0.23/0.50/0.76 | 13599.51 | 13599.51 | 0/1000 (0.00%) |
| POST /api/notifications | 0.15 | 0.37 | 0.61 | 0.15/0.37/0.61 | 21268.54 | 21268.54 | 0/1000 (0.00%) |
| POST /api/uploads | 0.24 | 0.58 | 0.99 | 0.24/0.58/0.99 | 13821.05 | 13821.05 | 0/1000 (0.00%) |
| GET /api/search | 0.13 | 0.30 | 0.42 | 0.13/0.29/0.42 | 24236.03 | 24236.03 | 0/1000 (0.00%) |
| GET /api/admin/metrics | 0.21 | 0.43 | 0.60 | 0.21/0.43/0.60 | 15812.89 | 15812.89 | 0/1000 (0.00%) |

Latency/TTFB percentiles include only complete successful HTTP responses. HTTP mismatches (including 404/429), disconnects and timeouts are errors. RPS includes all completions; inspect the error column. Short peak buckets are noisy and are not a sustainable capacity claim.

Gate: PASS
