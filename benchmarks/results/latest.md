# API Benchmark Report (full)

Generated: 2026-06-03T13:39:07.335Z
Target: http://127.0.0.1:60553
Local server: yes

## Environment

- Platform: win32 10.0.26200 (x64)
- CPU: Intel(R) Core(TM) i9-14900HX, 32 logical processors
- RAM: 31.8 GiB total
- Node.js: v24.4.1

## Profile

- Duration per endpoint: 5s
- Connections: 10
- Pipelining: 1
- TTFB samples per endpoint: 5

## Results

| Endpoint | Method | Path | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate | Statuses |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| health.check | GET | `/health` | 2.06 | 4.08 | 6.96 | 31.64 | 4327.19 | 5030 | 0.00% | {"200":21641} |
| auth.register | POST | `/api/auth/register` | 8.32 | 11.85 | 14.49 | 16.63 | 1160.68 | 1260 | 0.00% | {"201":5809} |
| auth.login | POST | `/api/auth/login` | 7.56 | 10 | 12.93 | 1.34 | 1279.62 | 1347 | 0.00% | {"200":6399} |
| auth.oauth.callback | GET | `/api/auth/oauth/github/callback` | 1.8 | 2.95 | 6.6 | 1.22 | 4944.79 | 5221 | 0.00% | {"200":24729} |
| auth.refresh | POST | `/api/auth/refresh` | 7.34 | 9.76 | 12.27 | 1.8 | 1316.11 | 1390 | 0.00% | {"200":6586} |
| users.list | GET | `/api/users` | 1.71 | 2.82 | 6.09 | 0.74 | 5190.46 | 5420 | 0.00% | {"200":25959} |
| users.create | POST | `/api/users` | 2.6 | 4.11 | 7.76 | 1.08 | 3490.66 | 3620 | 0.00% | {"201":17458} |
| jobs.list | GET | `/api/jobs` | 1.72 | 2.84 | 6.4 | 1.09 | 5120.54 | 5467 | 0.00% | {"200":25609} |
| jobs.create | POST | `/api/jobs` | 2.73 | 4.23 | 7.99 | 1.37 | 3353.37 | 3594 | 0.00% | {"201":16769} |
| proposals.list | GET | `/api/proposals` | 1.85 | 2.93 | 6.73 | 6.07 | 4916.27 | 5248 | 0.00% | {"200":24587} |
| proposals.create | POST | `/api/proposals` | 2.66 | 3.9 | 7.93 | 0.95 | 3454.86 | 3602 | 0.00% | {"201":17279} |
| payments.create | POST | `/api/payments` | 2.66 | 4.06 | 8.23 | 1.27 | 3460.72 | 3736 | 0.00% | {"201":17309} |
| reviews.list | GET | `/api/reviews` | 1.83 | 2.84 | 6.83 | 5.91 | 4921.84 | 5148 | 0.00% | {"200":24617} |
| reviews.create | POST | `/api/reviews` | 2.71 | 4.12 | 8.11 | 0.99 | 3385.89 | 3582 | 0.00% | {"201":16934} |
| messages.list | GET | `/api/messages` | 1.61 | 2.47 | 6.25 | 0.77 | 5538.29 | 5882 | 0.00% | {"200":27698} |
| messages.create | POST | `/api/messages` | 2.53 | 3.86 | 8.03 | 4.24 | 3597.03 | 3910 | 0.00% | {"201":17989} |
| notifications.list | GET | `/api/notifications` | 1.63 | 2.43 | 6.54 | 0.85 | 5488.81 | 5840 | 0.00% | {"200":27449} |
| notifications.create | POST | `/api/notifications` | 2.5 | 3.76 | 7.84 | 1.2 | 3635.26 | 3764 | 0.00% | {"201":18226} |
| uploads.create | POST | `/api/uploads` | 3.03 | 5.08 | 9.23 | 9.76 | 2973.55 | 3409 | 0.00% | {"201":14870} |
| search.query | GET | `/api/search?q=performance%20dashboard%20node` | 1.79 | 2.62 | 6.6 | 1.61 | 5046.06 | 5204 | 0.00% | {"200":25239} |
| admin.metrics | GET | `/api/admin/metrics` | 6.79 | 8.57 | 11.72 | 2.33 | 1443.08 | 1522 | 0.00% | {"200":7219} |

## Threshold Gate

All configured thresholds passed.
