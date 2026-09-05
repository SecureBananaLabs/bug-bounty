# API Benchmark Results

- Run: `2026-05-20T17-15-51-980Z`
- Mode: `full`
- Target: `local-loopback`
- Endpoints: 21
- Requests per endpoint: 8
- Concurrency: 2
- Total requests: 168
- Error rate: 0%
- Max p99 latency: 3.11 ms
- Max p99 TTFB: 3.09 ms
- Peak RPS: 4666.76
- Sustained RPS total: 53503.74

## Environment

- Node: v26.0.0
- Platform: darwin arm64
- CPU: Apple M1 Max
- Cores: 10
- Memory: 32768 MB

## Endpoint Metrics

| Endpoint | Method | Auth | Statuses | p50 ms | p95 ms | p99 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error rate |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/health` | GET | none | 200:8 | 1.3 | 2.87 | 2.87 | 2.85 | 1183.95 | 1183.95 | 0% |
| `/api/auth/register` | POST | none | 201:8 | 1.6 | 3.11 | 3.11 | 3.09 | 1077.22 | 1077.22 | 0% |
| `/api/auth/login` | POST | none | 200:8 | 1.01 | 1.47 | 1.47 | 1.44 | 1792.62 | 1792.62 | 0% |
| `/api/auth/oauth/github/callback` | GET | none | 200:8 | 0.56 | 0.7 | 0.7 | 0.69 | 3252.8 | 3252.8 | 0% |
| `/api/auth/refresh` | POST | none | 200:8 | 0.94 | 1.82 | 1.82 | 1.81 | 1678.57 | 1678.57 | 0% |
| `/api/users` | GET | none | 200:8 | 0.53 | 1 | 1 | 0.99 | 2977.67 | 2977.67 | 0% |
| `/api/users` | POST | none | 201:8 | 0.67 | 0.8 | 0.8 | 0.78 | 2866.91 | 2866.91 | 0% |
| `/api/jobs` | GET | none | 200:8 | 0.5 | 0.89 | 0.89 | 0.88 | 3211.56 | 3211.56 | 0% |
| `/api/jobs` | POST | none | 201:8 | 0.93 | 1.25 | 1.25 | 1.24 | 1971.76 | 1971.76 | 0% |
| `/api/proposals` | GET | none | 200:8 | 0.59 | 0.91 | 0.91 | 0.89 | 2749.57 | 2749.57 | 0% |
| `/api/proposals` | POST | none | 201:8 | 0.72 | 2.16 | 2.16 | 2.15 | 1821.34 | 1821.34 | 0% |
| `/api/payments` | POST | none | 201:8 | 0.78 | 0.98 | 0.98 | 0.96 | 2343.89 | 2343.89 | 0% |
| `/api/reviews` | GET | none | 200:8 | 0.45 | 0.53 | 0.53 | 0.52 | 4225.26 | 4225.26 | 0% |
| `/api/reviews` | POST | none | 201:8 | 1.01 | 1.72 | 1.72 | 1.71 | 1662.05 | 1662.05 | 0% |
| `/api/messages` | GET | none | 200:8 | 0.42 | 0.59 | 0.59 | 0.58 | 4162.6 | 4162.6 | 0% |
| `/api/messages` | POST | none | 201:8 | 0.86 | 1.12 | 1.12 | 1.11 | 2174.53 | 2174.53 | 0% |
| `/api/notifications` | GET | none | 200:8 | 0.4 | 0.48 | 0.48 | 0.47 | 4666.76 | 4666.76 | 0% |
| `/api/notifications` | POST | none | 201:8 | 0.84 | 1.13 | 1.13 | 1.11 | 2200.32 | 2200.32 | 0% |
| `/api/uploads` | POST | none | 201:8 | 1.39 | 2.57 | 2.57 | 2.56 | 1149.42 | 1149.42 | 0% |
| `/api/search?q=api%20benchmark` | GET | none | 200:8 | 0.49 | 0.57 | 0.57 | 0.56 | 3902.68 | 3902.68 | 0% |
| `/api/admin/metrics` | GET | admin | 200:8 | 0.7 | 1.07 | 1.07 | 1.06 | 2432.26 | 2432.26 | 0% |

## Thresholds

All configured benchmark thresholds passed.
