# API Benchmark Results

- Generated: 2026-05-27T20:18:02.648Z
- Mode: full
- Target: http://127.0.0.1:52237
- Local server started by runner: yes
- Concurrency: 4
- Duration per endpoint: 1500 ms
- Warmup requests per endpoint: 2
- TTFB note: measured as Node fetch response-header timing; total latency includes body read.

| Endpoint | Method | Path | Samples | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % | Gate |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| auth.register | POST | /api/auth/register | 2718 | 1.94 | 3.52 | 5.43 | 3.46 | 1811.01 | 1686 | 0 | pass |
| auth.login | POST | /api/auth/login | 3487 | 1.61 | 1.98 | 5.58 | 1.96 | 2323.85 | 2303 | 0 | pass |
| auth.oauthCallback | GET | /api/auth/oauth/github/callback | 7584 | 0.69 | 1.09 | 1.85 | 1.07 | 5055.26 | 4942 | 0 | pass |
| auth.refresh | POST | /api/auth/refresh | 5000 | 1.09 | 1.51 | 2.29 | 1.49 | 3332.63 | 3336 | 0 | pass |
| users.list | GET | /api/users | 9439 | 0.56 | 0.86 | 1.22 | 0.85 | 6291.08 | 6160 | 0 | pass |
| users.create | POST | /api/users | 5484 | 0.98 | 1.3 | 5.42 | 1.28 | 3655.18 | 3646 | 0 | pass |
| jobs.list | GET | /api/jobs | 9922 | 0.53 | 0.82 | 1.25 | 0.8 | 6613.44 | 6616 | 0 | pass |
| jobs.create | POST | /api/jobs | 5356 | 1.02 | 1.33 | 4.98 | 1.32 | 3569.25 | 3574 | 0 | pass |
| proposals.list | GET | /api/proposals | 10085 | 0.53 | 0.73 | 1.22 | 0.72 | 6722.25 | 6686 | 0 | pass |
| proposals.create | POST | /api/proposals | 5488 | 0.98 | 1.31 | 5.56 | 1.3 | 3657.29 | 3677 | 0 | pass |
| payments.create | POST | /api/payments | 5827 | 0.92 | 1.23 | 4.28 | 1.21 | 3883.48 | 3912 | 0 | pass |
| reviews.list | GET | /api/reviews | 10148 | 0.53 | 0.73 | 1.14 | 0.72 | 6748.83 | 6640 | 0 | pass |
| reviews.create | POST | /api/reviews | 5804 | 0.93 | 1.24 | 3.41 | 1.23 | 3868.89 | 3829 | 0 | pass |
| messages.list | GET | /api/messages | 9936 | 0.53 | 0.82 | 1.24 | 0.81 | 6623.53 | 6520 | 0 | pass |
| messages.create | POST | /api/messages | 5575 | 0.96 | 1.32 | 4.47 | 1.3 | 3715.61 | 3680 | 0 | pass |
| notifications.list | GET | /api/notifications | 10020 | 0.53 | 0.79 | 1.23 | 0.78 | 6678.86 | 6628 | 0 | pass |
| notifications.create | POST | /api/notifications | 5628 | 0.94 | 1.31 | 3.56 | 1.29 | 3750.82 | 3814 | 0 | pass |
| uploads.create | POST | /api/uploads | 3084 | 1.73 | 2.54 | 7.73 | 2.51 | 2055.49 | 1968 | 0 | pass |
| search.global | GET | /api/search?q=full-stack%20marketplace%20node%20benchmark | 8288 | 0.64 | 0.93 | 1.36 | 0.92 | 5524.28 | 5402 | 0 | pass |
| admin.metrics | GET | /api/admin/metrics | 5130 | 1.08 | 1.41 | 1.77 | 1.4 | 3418.74 | 3372 | 0 | pass |

## Threshold Gate

No threshold failures.
