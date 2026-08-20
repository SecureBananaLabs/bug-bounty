# API Benchmark Summary

Generated: 2026-05-28T16:54:34.361Z
Target: http://127.0.0.1:53856
Mode: full
Concurrency: 4
Duration per endpoint: 1500ms

| Endpoint | Route | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Error rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health | GET /health | 10609 | 7071.79 | 6666 | 0.49 | 0.9 | 1.39 | 0.88 | 0% |
| auth-register | POST /api/auth/register | 5628 | 3751.73 | 3648 | 0.98 | 1.41 | 2.13 | 1.4 | 0% |
| auth-login | POST /api/auth/login | 5860 | 3906.25 | 3888 | 0.95 | 1.29 | 2.16 | 1.27 | 0% |
| auth-oauth-callback | GET /api/auth/oauth/github/callback | 12524 | 8348.43 | 8464 | 0.45 | 0.56 | 0.95 | 0.55 | 0% |
| auth-refresh | POST /api/auth/refresh | 7160 | 4772.19 | 4776 | 0.79 | 0.94 | 1.56 | 0.93 | 0% |
| users-list | GET /api/users | 12658 | 8437.18 | 8353 | 0.44 | 0.55 | 1.09 | 0.54 | 0% |
| users-create | POST /api/users | 9818 | 6544.05 | 6380 | 0.56 | 0.74 | 1.34 | 0.72 | 0% |
| jobs-list | GET /api/jobs | 12973 | 8647.63 | 8660 | 0.43 | 0.5 | 1.02 | 0.49 | 0% |
| jobs-create | POST /api/jobs | 9680 | 6451.6 | 6392 | 0.58 | 0.73 | 1.46 | 0.72 | 0% |
| proposals-list | GET /api/proposals | 12688 | 8457.58 | 8415 | 0.44 | 0.52 | 0.98 | 0.51 | 0% |
| proposals-create | POST /api/proposals | 9892 | 6593.93 | 6480 | 0.56 | 0.69 | 1.31 | 0.68 | 0% |
| payments-create | POST /api/payments | 10576 | 7049.8 | 7028 | 0.54 | 0.61 | 1.04 | 0.6 | 0% |
| reviews-list | GET /api/reviews | 12769 | 8511.4 | 8483 | 0.44 | 0.51 | 1.21 | 0.51 | 0% |
| reviews-create | POST /api/reviews | 10331 | 6885.88 | 6887 | 0.55 | 0.62 | 1.29 | 0.61 | 0% |
| messages-list | GET /api/messages | 12215 | 8138.21 | 7988 | 0.45 | 0.57 | 0.96 | 0.56 | 0% |
| messages-create | POST /api/messages | 9693 | 6459.67 | 6420 | 0.58 | 0.77 | 1.25 | 0.76 | 0% |
| notifications-list | GET /api/notifications | 12672 | 8446.85 | 8496 | 0.44 | 0.54 | 1.23 | 0.53 | 0% |
| notifications-create | POST /api/notifications | 10245 | 6828.89 | 6864 | 0.55 | 0.65 | 1.46 | 0.64 | 0% |
| uploads-create | POST /api/uploads | 6684 | 4455.63 | 4300 | 0.78 | 1.21 | 2.98 | 1.2 | 0% |
| search | GET /api/search?q=secure%20payments%20react | 11120 | 7411.64 | 7329 | 0.5 | 0.59 | 1.25 | 0.58 | 0% |
| admin-metrics | GET /api/admin/metrics | 6448 | 4298.1 | 4268 | 0.88 | 1.05 | 1.89 | 1.04 | 0% |

## Threshold Result

- PASS: all configured p99 latency and error-rate thresholds passed.
