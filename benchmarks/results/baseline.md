# API benchmark

Recorded 2026-10-25T06:50:44.218Z; commit 274ae220a922f36e491cba4efb8a6caf6febbe4b; baseline; isolated loopback API.

Current Express API and middleware, with in-memory service arrays and placeholder database/search/payment integrations. Benchmark server limit:1,000,000requests/15min. Normal server default remains200. Each invocation starts a fresh process; collections are seeded with50records.

{"node":"v22.23.1","platform":"darwin","release":"25.3.0","arch":"arm64","cpu":"Apple M4 Pro","logicalCpus":12,"totalMemoryBytes":25769803776,"freeMemoryBytesAtStart":135708672}

Request count/route: 10000; concurrency: 4. Closed-loop fixed-count workload. Peak uses full one-second completion buckets; a subsecond run uses its overall rate. TTFB is time to parsed response headers. Latency includes body drain; timed-out/network/nonexpected-status requests count as errors. Other workstation activity was not isolated.

| Endpoint | p50 ms | p95 ms | p99 ms | RPS sustained | RPS peak | Errors % | TTFB p50 / p95 / p99 ms |
|---|---:|---:|---:|---:|---:|---:|---|
| POST /api/auth/register | 0.27 | 0.64 | 1.11 | 11341.81 | 11341.81 | 0.00 | 0.27 / 0.64 / 1.10 |
| POST /api/auth/login | 0.24 | 0.54 | 0.87 | 12139.76 | 12139.76 | 0.00 | 0.24 / 0.54 / 0.86 |
| GET /api/auth/oauth/:provider/callback | 0.16 | 0.34 | 0.60 | 18265.63 | 18265.63 | 0.00 | 0.16 / 0.34 / 0.59 |
| POST /api/auth/refresh | 0.24 | 0.51 | 0.78 | 12518.16 | 12518.16 | 0.00 | 0.23 / 0.51 / 0.77 |
| GET /api/users | 0.35 | 0.76 | 1.16 | 8638.70 | 8592.00 | 0.00 | 0.34 / 0.75 / 1.15 |
| POST /api/users | 0.18 | 0.40 | 0.71 | 15327.16 | 15327.16 | 0.00 | 0.18 / 0.40 / 0.70 |
| GET /api/jobs | 0.56 | 1.18 | 1.68 | 5270.45 | 5311.00 | 0.00 | 0.55 / 1.16 / 1.66 |
| POST /api/jobs | 0.20 | 0.45 | 0.97 | 13903.61 | 13903.61 | 0.00 | 0.20 / 0.44 / 0.96 |
| GET /api/proposals | 0.67 | 1.45 | 2.12 | 4400.90 | 4505.00 | 0.00 | 0.65 / 1.42 / 2.09 |
| POST /api/proposals | 0.20 | 0.44 | 0.95 | 13736.05 | 13736.05 | 0.00 | 0.20 / 0.44 / 0.95 |
| GET /api/messages | 0.44 | 0.94 | 1.43 | 6684.25 | 6694.00 | 0.00 | 0.43 / 0.94 / 1.41 |
| POST /api/messages | 0.20 | 0.42 | 1.03 | 14730.88 | 14730.88 | 0.00 | 0.19 / 0.42 / 1.02 |
| GET /api/notifications | 0.29 | 0.62 | 1.05 | 10032.62 | 10032.62 | 0.00 | 0.29 / 0.61 / 1.05 |
| POST /api/notifications | 0.18 | 0.39 | 1.04 | 15280.91 | 15280.91 | 0.00 | 0.18 / 0.39 / 1.04 |
| GET /api/reviews | 0.33 | 0.77 | 1.26 | 8629.10 | 8662.00 | 0.00 | 0.33 / 0.75 / 1.25 |
| POST /api/reviews | 0.18 | 0.41 | 1.09 | 15211.40 | 15211.40 | 0.00 | 0.18 / 0.40 / 1.09 |
| POST /api/payments | 0.18 | 0.38 | 0.97 | 16589.61 | 16589.61 | 0.00 | 0.18 / 0.37 / 0.97 |
| POST /api/uploads | 0.26 | 0.65 | 1.23 | 10803.61 | 10803.61 | 0.00 | 0.26 / 0.65 / 1.23 |
| GET /api/search | 0.17 | 0.56 | 1.15 | 14982.81 | 14982.81 | 0.00 | 0.17 / 0.55 / 1.15 |
| GET /api/admin/metrics | 0.22 | 0.48 | 1.12 | 12814.02 | 12814.02 | 0.00 | 0.22 / 0.48 / 1.11 |

Gate: PASS
