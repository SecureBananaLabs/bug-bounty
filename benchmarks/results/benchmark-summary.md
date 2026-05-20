# API Benchmark Summary

Generated: 2026-05-20T03:56:14.377Z
Target: http://127.0.0.1:43289
Mode: CI smoke
Concurrency: 2
Duration per endpoint: 1s

## Results

| Endpoint | Requests | p50 | p95 | p99 | TTFB p95 | Sustained RPS | Peak RPS | Error Rate | Gate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
`POST /api/auth/register` | 343 | 5.25ms | 9.76ms | 20.47ms | 9.3ms | 342.58 | 261 | 0% | ✅ pass
`POST /api/auth/login` | 413 | 4.2ms | 9.81ms | 15.17ms | 9.74ms | 412.16 | 335 | 0% | ✅ pass
`GET /api/auth/oauth/github/callback` | 776 | 2.15ms | 3.97ms | 11.4ms | 3.61ms | 774.45 | 610 | 0% | ✅ pass
`POST /api/auth/refresh` | 790 | 2.35ms | 3.31ms | 7.47ms | 3.21ms | 788.87 | 616 | 0% | ✅ pass
`GET /api/users` | 1041 | 1.73ms | 2.48ms | 9.38ms | 2.37ms | 1040.18 | 750 | 0% | ✅ pass
`POST /api/users` | 836 | 2.15ms | 3.35ms | 9.1ms | 3.31ms | 835.53 | 657 | 0% | ✅ pass
`GET /api/jobs` | 1072 | 1.66ms | 2.87ms | 8.29ms | 2.79ms | 1070.33 | 836 | 0% | ✅ pass
`POST /api/jobs` | 358 | 3.51ms | 15.18ms | 25.94ms | 14.89ms | 357.59 | 234 | 0% | ✅ pass
`GET /api/proposals` | 890 | 1.76ms | 4.08ms | 13.23ms | 3.93ms | 889.69 | 628 | 0% | ✅ pass
`POST /api/proposals` | 639 | 2.61ms | 6.77ms | 12.67ms | 6.71ms | 638.29 | 460 | 0% | ✅ pass
`POST /api/payments` | 816 | 2.16ms | 4.07ms | 9.06ms | 3.98ms | 815.09 | 538 | 0% | ✅ pass
`GET /api/reviews` | 1261 | 1.45ms | 2.15ms | 7.38ms | 2.08ms | 1259.92 | 896 | 0% | ✅ pass
`POST /api/reviews` | 883 | 1.98ms | 3.68ms | 11.91ms | 3.57ms | 882.34 | 624 | 0% | ✅ pass
`GET /api/messages` | 1188 | 1.47ms | 2.17ms | 7.66ms | 2.11ms | 1187.26 | 863 | 0% | ✅ pass
`POST /api/messages` | 788 | 2.17ms | 4.35ms | 9.54ms | 4.24ms | 787.84 | 537 | 0% | ✅ pass
`GET /api/notifications` | 1204 | 1.41ms | 2.47ms | 8.14ms | 2.4ms | 1203.42 | 811 | 0% | ✅ pass
`POST /api/notifications` | 991 | 1.82ms | 2.81ms | 7.93ms | 2.71ms | 989.81 | 676 | 0% | ✅ pass
`POST /api/uploads` | 366 | 4.9ms | 9.09ms | 16.99ms | 8.97ms | 365.19 | 220 | 0% | ✅ pass
`GET /api/search` | 1046 | 1.67ms | 2.83ms | 7.85ms | 2.74ms | 1044.91 | 672 | 0% | ✅ pass
`GET /api/admin/metrics` | 833 | 2.26ms | 3.21ms | 7.32ms | 3.13ms | 831.57 | 534 | 0% | ✅ pass

## Gate

All thresholds passed.
