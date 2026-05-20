# API Benchmark Summary

Generated: 2026-05-20T04:16:11.873Z
Target: http://127.0.0.1:43277
Mode: CI smoke
Concurrency: 2
Duration per endpoint: 3s

## Results

| Endpoint | Requests | p50 | p95 | p99 | TTFB p95 | Sustained RPS | Peak RPS | Error Rate | Gate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
`POST /api/auth/register` | 697 | 6.55ms | 19.45ms | 44.85ms | 18.76ms | 232.11 | 294 | 0% | ✅ pass
`POST /api/auth/login` | 1081 | 4.72ms | 10.12ms | 19.58ms | 9.89ms | 360.05 | 416 | 0% | ✅ pass
`GET /api/auth/oauth/github/callback` | 2125 | 2.36ms | 5.17ms | 12.64ms | 4.95ms | 708.12 | 701 | 0% | ✅ pass
`POST /api/auth/refresh` | 2017 | 2.65ms | 4.75ms | 10ms | 4.59ms | 672.07 | 676 | 0% | ✅ pass
`GET /api/users` | 2882 | 1.72ms | 3.53ms | 10.32ms | 3.37ms | 960.54 | 1078 | 0% | ✅ pass
`POST /api/users` | 2001 | 2.59ms | 4.81ms | 11.87ms | 4.66ms | 666.84 | 674 | 0% | ✅ pass
`GET /api/jobs` | 3284 | 1.62ms | 2.58ms | 7.64ms | 2.48ms | 1094.49 | 1134 | 0% | ✅ pass
`POST /api/jobs` | 2056 | 2.51ms | 4.98ms | 13.24ms | 4.88ms | 683.23 | 726 | 0% | ✅ pass
`GET /api/proposals` | 3150 | 1.59ms | 2.82ms | 9.62ms | 2.73ms | 1049.92 | 1002 | 0% | ✅ pass
`POST /api/proposals` | 2287 | 2.29ms | 3.91ms | 10.27ms | 3.75ms | 761.89 | 780 | 0% | ✅ pass
`POST /api/payments` | 2023 | 2.49ms | 4.71ms | 13.64ms | 4.57ms | 673.81 | 723 | 0% | ✅ pass
`GET /api/reviews` | 2756 | 1.76ms | 4.12ms | 10.13ms | 3.98ms | 918.18 | 954 | 0% | ✅ pass
`POST /api/reviews` | 2156 | 2.39ms | 4.78ms | 12.16ms | 4.7ms | 718.34 | 715 | 0% | ✅ pass
`GET /api/messages` | 2870 | 1.72ms | 3.63ms | 10.87ms | 3.46ms | 956.59 | 1019 | 0% | ✅ pass
`POST /api/messages` | 2206 | 2.37ms | 4.6ms | 10.14ms | 4.44ms | 734.43 | 811 | 0% | ✅ pass
`GET /api/notifications` | 2655 | 1.77ms | 5.14ms | 10.7ms | 4.95ms | 884.73 | 927 | 0% | ✅ pass
`POST /api/notifications` | 2011 | 2.49ms | 5.96ms | 12.8ms | 5.87ms | 669.81 | 706 | 0% | ✅ pass
`POST /api/uploads` | 736 | 5.48ms | 22.71ms | 48.36ms | 21.48ms | 245.24 | 264 | 0% | ✅ pass
`GET /api/search` | 2454 | 1.92ms | 4.99ms | 13.7ms | 4.86ms | 817.67 | 848 | 0% | ✅ pass
`GET /api/admin/metrics` | 1750 | 3.05ms | 5.47ms | 12.4ms | 5.29ms | 582.43 | 614 | 0% | ✅ pass

## Gate

All thresholds passed.
