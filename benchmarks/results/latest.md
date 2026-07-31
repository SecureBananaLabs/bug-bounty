# FreelanceFlow API Benchmark Report

- **Generated:** 2026-07-19T23:01:29.462Z
- **Target:** http://localhost:4099
- **Mode:** smoke

## Summary

| Endpoint | Auth | p50 (ms) | p95 (ms) | p99 (ms) | RPS (avg) | RPS (peak) | Error % | TTFB p99 (ms) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET /health | no | 1 | 4 | 7 | 1313.2 | 1737 | 96.95 | 7 | PASS |
| POST /api/auth/register | no | 0 | 3 | 8 | 1516.4 | 2098 | 100 | 8 | PASS |
| POST /api/auth/login | no | 0 | 2.33 | 4 | 1889.6 | 1985 | 100 | 4 | PASS |
| POST /api/auth/refresh | no | 0 | 2.33 | 4 | 1894.2 | 2032 | 100 | 4 | PASS |
| GET /api/users | yes | 0 | 1.67 | 4 | 2123.81 | 2206 | 100 | 4 | PASS |
| POST /api/users | yes | 1 | 5 | 9 | 1220.6 | 1636 | 100 | 9 | PASS |
| GET /api/jobs | yes | 1 | 8.33 | 15 | 823.2 | 1174 | 100 | 15 | PASS |
| POST /api/jobs | yes | 1 | 5.67 | 10 | 1104 | 1547 | 100 | 10 | PASS |
| GET /api/proposals | yes | 0 | 5.67 | 9 | 1232.8 | 2050 | 100 | 9 | PASS |
| POST /api/proposals | yes | 1 | 5.67 | 10 | 1106 | 1480 | 100 | 10 | PASS |
| POST /api/payments | yes | 1 | 3 | 6 | 1581.2 | 1702 | 100 | 6 | PASS |
| GET /api/reviews | yes | 0 | 2.33 | 4 | 2230.2 | 2550 | 100 | 4 | PASS |
| POST /api/reviews | yes | 0 | 3 | 6 | 1701 | 1904 | 100 | 6 | PASS |
| GET /api/messages | yes | 0 | 1.67 | 3 | 2255.4 | 2444 | 100 | 3 | PASS |
| POST /api/messages | yes | 0 | 2.33 | 5 | 1857.8 | 2119 | 100 | 5 | PASS |
| GET /api/notifications | yes | 0 | 3 | 7 | 1704.4 | 2134 | 100 | 7 | PASS |
| POST /api/notifications | yes | 0 | 4 | 8 | 1427 | 1569 | 100 | 8 | PASS |
| POST /api/uploads | yes | 0 | 2.33 | 4 | 2178.2 | 2427 | 100 | 4 | PASS |
| GET /api/search | yes | 1 | 6.67 | 12 | 1021.6 | 1253 | 100 | 12 | PASS |
| GET /api/admin/metrics | yes | 1 | 13.33 | 20 | 585 | 989 | 100 | 20 | PASS |

## Per-Endpoint Detail

### GET /health

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=1, p95=4, p99=7, mean=0.99, min=1, max=52
- **Throughput (req/s):** avg=1313.2, peak=1737, total=6566
- **Error rate:** 96.95% (errors=0, timeouts=0, non-2xx=6366)
- **TTFB (ms):** p50=1, p95=2, p99=7, mean=0.99
- **Bytes/s:** avg=1377228.8, max=1823850

### POST /api/auth/register

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=3, p99=8, mean=0.75, min=1, max=39
- **Throughput (req/s):** avg=1516.4, peak=2098, total=7581
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=7581)
- **TTFB (ms):** p50=1, p95=1, p99=8, mean=0.75
- **Bytes/s:** avg=1591961.6, max=2202900

### POST /api/auth/login

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=2.33, p99=4, mean=0.49, min=1, max=29
- **Throughput (req/s):** avg=1889.6, peak=1985, total=9448
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=9448)
- **TTFB (ms):** p50=1, p95=1, p99=4, mean=0.49
- **Bytes/s:** avg=1984204.8, max=2084250

### POST /api/auth/refresh

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=2.33, p99=4, mean=0.41, min=1, max=20
- **Throughput (req/s):** avg=1894.2, peak=2032, total=9471
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=9471)
- **TTFB (ms):** p50=1, p95=1, p99=4, mean=0.41
- **Bytes/s:** avg=1988812.8, max=2133600

### GET /api/users

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=1.67, p99=4, mean=0.27, min=1, max=24
- **Throughput (req/s):** avg=2123.81, peak=2206, total=10617
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=10617)
- **TTFB (ms):** p50=1, p95=1, p99=4, mean=0.27
- **Bytes/s:** avg=2229964.8, max=2316300

### POST /api/users

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=1, p95=5, p99=9, mean=1.11, min=1, max=29
- **Throughput (req/s):** avg=1220.6, peak=1636, total=6103
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=6103)
- **TTFB (ms):** p50=1, p95=3, p99=9, mean=1.11
- **Bytes/s:** avg=1281536, max=1717800

### GET /api/jobs

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=1, p95=8.33, p99=15, mean=1.85, min=1, max=56
- **Throughput (req/s):** avg=823.2, peak=1174, total=4116
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=4116)
- **TTFB (ms):** p50=1, p95=5, p99=15, mean=1.85
- **Bytes/s:** avg=864256, max=1232700

### POST /api/jobs

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=1, p95=5.67, p99=10, mean=1.31, min=1, max=42
- **Throughput (req/s):** avg=1104, peak=1547, total=5520
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=5520)
- **TTFB (ms):** p50=1, p95=3, p99=10, mean=1.31
- **Bytes/s:** avg=1159168, max=1624350

### GET /api/proposals

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=5.67, p99=9, mean=1.03, min=1, max=33
- **Throughput (req/s):** avg=1232.8, peak=2050, total=6163
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=6163)
- **TTFB (ms):** p50=1, p95=3, p99=9, mean=1.03
- **Bytes/s:** avg=1294438.4, max=2152500

### POST /api/proposals

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=1, p95=5.67, p99=10, mean=1.27, min=1, max=24
- **Throughput (req/s):** avg=1106, peak=1480, total=5530
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=5530)
- **TTFB (ms):** p50=1, p95=3, p99=10, mean=1.27
- **Bytes/s:** avg=1161318.4, max=1554000

### POST /api/payments

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=1, p95=3, p99=6, mean=0.8, min=1, max=35
- **Throughput (req/s):** avg=1581.2, peak=1702, total=7906
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=7906)
- **TTFB (ms):** p50=1, p95=1, p99=6, mean=0.8
- **Bytes/s:** avg=1660211.2, max=1787100

### GET /api/reviews

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=2.33, p99=4, mean=0.26, min=1, max=20
- **Throughput (req/s):** avg=2230.2, peak=2550, total=11149
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=11149)
- **TTFB (ms):** p50=1, p95=1, p99=4, mean=0.26
- **Bytes/s:** avg=2341376, max=2677500

### POST /api/reviews

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=3, p99=6, mean=0.59, min=1, max=25
- **Throughput (req/s):** avg=1701, peak=1904, total=8505
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=8505)
- **TTFB (ms):** p50=1, p95=1, p99=6, mean=0.59
- **Bytes/s:** avg=1786163.2, max=1999200

### GET /api/messages

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=1.67, p99=3, mean=0.23, min=1, max=46
- **Throughput (req/s):** avg=2255.4, peak=2444, total=11274
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=11274)
- **TTFB (ms):** p50=1, p95=1, p99=3, mean=0.23
- **Bytes/s:** avg=2367795.21, max=2566200

### POST /api/messages

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=2.33, p99=5, mean=0.51, min=1, max=18
- **Throughput (req/s):** avg=1857.8, peak=2119, total=9288
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=9288)
- **TTFB (ms):** p50=1, p95=1, p99=5, mean=0.51
- **Bytes/s:** avg=1950412.8, max=2224950

### GET /api/notifications

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=3, p99=7, mean=0.5, min=1, max=54
- **Throughput (req/s):** avg=1704.4, peak=2134, total=8520
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=8520)
- **TTFB (ms):** p50=1, p95=1, p99=7, mean=0.5
- **Bytes/s:** avg=1789440, max=2240700

### POST /api/notifications

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=4, p99=8, mean=0.84, min=1, max=21
- **Throughput (req/s):** avg=1427, peak=1569, total=7135
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=7135)
- **TTFB (ms):** p50=1, p95=2, p99=8, mean=0.84
- **Bytes/s:** avg=1498419.2, max=1647450

### POST /api/uploads

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=0, p95=2.33, p99=4, mean=0.26, min=1, max=24
- **Throughput (req/s):** avg=2178.2, peak=2427, total=10890
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=10890)
- **TTFB (ms):** p50=1, p95=1, p99=4, mean=0.26
- **Bytes/s:** avg=2287104, max=2548350

### GET /api/search

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=1, p95=6.67, p99=12, mean=1.42, min=1, max=43
- **Throughput (req/s):** avg=1021.6, peak=1253, total=5108
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=5108)
- **TTFB (ms):** p50=1, p95=4, p99=12, mean=1.42
- **Bytes/s:** avg=1072742.4, max=1315650

### GET /api/admin/metrics

- Connections: 2, Duration: 5s
- **Latency (ms):** p50=1, p95=13.33, p99=20, mean=2.84, min=1, max=42
- **Throughput (req/s):** avg=585, peak=989, total=2925
- **Error rate:** 100% (errors=0, timeouts=0, non-2xx=2925)
- **TTFB (ms):** p50=1, p95=8, p99=20, mean=2.84
- **Bytes/s:** avg=614272, max=1038450

## Regression Gate

All endpoints are within their configured p99 thresholds. ✅
