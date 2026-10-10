# API benchmark summary

Mode: smoke · Node v20.18.1 · 2 connections for 500ms per endpoint

| endpoint | p50 ms | p95 ms | p99 ms | peak rps | sustained rps | errors % | ttfb ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET /health | 0.54 | 1.1 | 1.7 | 3162 | 3168 | 0 | 1.06 |
| GET /api/search?q=designer | 0.33 | 0.69 | 1.1 | 4946 | 4946 | 0 | 0.67 |
| GET /api/users | 0.26 | 0.56 | 1.03 | 5956 | 5956 | 0 | 0.55 |
| GET /api/jobs?status=open&minBudget=100 | 0.28 | 0.58 | 1.12 | 5632 | 5643 | 0 | 0.57 |
| GET /api/proposals | 0.25 | 0.53 | 0.97 | 6222 | 6222 | 0 | 0.52 |
| GET /api/reviews | 0.25 | 0.49 | 1.07 | 6532 | 6532 | 0 | 0.48 |
| GET /api/messages | 0.25 | 0.51 | 1.1 | 6298 | 6298 | 0 | 0.5 |
| GET /api/notifications | 0.27 | 0.55 | 0.99 | 5932 | 5932 | 0 | 0.54 |
| GET /api/admin/metrics | 0.3 | 0.65 | 1.29 | 5258 | 5258 | 0 | 0.64 |
| POST /api/auth/register | 0.43 | 0.78 | 1.41 | 3962 | 3962 | 0 | 0.76 |
| POST /api/auth/login | 0.35 | 0.75 | 1.19 | 4602 | 4602 | 0 | 0.73 |
| POST /api/jobs | 0.35 | 0.72 | 1.26 | 4524 | 4524 | 0 | 0.71 |
| POST /api/proposals | 0.31 | 0.6 | 1.19 | 5322 | 5322 | 0 | 0.59 |
| POST /api/payments | 0.32 | 0.66 | 1.1 | 4920 | 4920 | 0 | 0.65 |
| POST /api/reviews | 0.33 | 0.68 | 1.34 | 4856 | 4856 | 0 | 0.66 |
| POST /api/messages | 0.34 | 0.69 | 1.34 | 4686 | 4686 | 0 | 0.67 |
| POST /api/notifications | 0.31 | 0.62 | 1.2 | 5222 | 5222 | 0 | 0.61 |
| POST /api/uploads | 0.3 | 0.57 | 1.03 | 5504 | 5504 | 0 | 0.56 |

Regression gate: PASS
