# API Benchmark Summary

Mode: full
Target: http://127.0.0.1:4000
Requests per endpoint: 8
Concurrency: 2
Warmup requests per endpoint: 1
Generated: 2026-05-20T19:08:17.363Z

Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | TTFB p50 ms | RPS | Error % | Gate
--- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---
auth.register | POST /api/auth/register | 8 | 0.96 | 4.84 | 4.84 | 0.95 | 1073.86 | 0 | pass
auth.login | POST /api/auth/login | 8 | 0.62 | 0.98 | 0.98 | 0.61 | 2465.58 | 0 | pass
auth.oauthCallback | GET /api/auth/oauth/google/callback | 8 | 0.41 | 0.53 | 0.53 | 0.38 | 4452.38 | 0 | pass
auth.refresh | POST /api/auth/refresh | 8 | 0.49 | 0.86 | 0.86 | 0.48 | 3152.81 | 0 | pass
users.list | GET /api/users | 8 | 0.32 | 0.74 | 0.74 | 0.31 | 4497.12 | 0 | pass
users.create | POST /api/users | 8 | 0.4 | 0.64 | 0.64 | 0.39 | 4313.74 | 0 | pass
jobs.list | GET /api/jobs | 8 | 0.37 | 0.91 | 0.91 | 0.35 | 3864.81 | 0 | pass
jobs.create | POST /api/jobs | 8 | 0.51 | 0.73 | 0.73 | 0.51 | 3478.77 | 0 | pass
proposals.list | GET /api/proposals | 8 | 0.31 | 0.38 | 0.38 | 0.3 | 5927.94 | 0 | pass
proposals.create | POST /api/proposals | 8 | 0.41 | 0.9 | 0.9 | 0.39 | 3405.1 | 0 | pass
payments.create | POST /api/payments | 8 | 0.4 | 1.55 | 1.55 | 0.4 | 2416.55 | 0 | pass
reviews.list | GET /api/reviews | 8 | 0.34 | 0.41 | 0.41 | 0.34 | 5340.45 | 0 | pass
reviews.create | POST /api/reviews | 8 | 0.3 | 0.54 | 0.54 | 0.3 | 4787.79 | 0 | pass
messages.list | GET /api/messages | 8 | 0.26 | 0.38 | 0.38 | 0.26 | 6541.07 | 0 | pass
messages.create | POST /api/messages | 8 | 0.3 | 0.86 | 0.86 | 0.29 | 4134.1 | 0 | pass
notifications.list | GET /api/notifications | 8 | 0.28 | 0.37 | 0.37 | 0.27 | 6321.82 | 0 | pass
notifications.create | POST /api/notifications | 8 | 0.44 | 0.59 | 0.59 | 0.43 | 4131.52 | 0 | pass
uploads.create | POST /api/uploads | 8 | 0.65 | 1.16 | 1.16 | 0.64 | 2593.37 | 0 | pass
search.global | GET /api/search?q=benchmark | 8 | 0.39 | 0.99 | 0.99 | 0.39 | 3533.44 | 0 | pass
admin.metrics | GET /api/admin/metrics | 8 | 0.37 | 0.61 | 0.61 | 0.36 | 4427.23 | 0 | pass

## Benchmark Environment

- CPU: Apple M3 Ultra, 28 cores
- RAM: 96 GiB total
- Network: loopback
- OS: Darwin 25.3.0 arm64
- Node.js: v24.9.0
- Agent: Codex, OpenAI, shell/tool access enabled

Thresholds are read from `benchmarks/thresholds.json`.