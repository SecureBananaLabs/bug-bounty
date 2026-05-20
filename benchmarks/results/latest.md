# API Benchmark Summary

Mode: full
Target: http://127.0.0.1:4000
Requests per endpoint: 8
Concurrency: 2
Warmup requests per endpoint: 1
Generated: 2026-05-20T05:22:21.413Z

Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | TTFB p50 ms | RPS | Error % | Gate
--- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---
auth.register | POST /api/auth/register | 8 | 0.65 | 1.32 | 1.32 | 0.64 | 2287.43 | 0 | pass
auth.login | POST /api/auth/login | 8 | 0.41 | 0.48 | 0.48 | 0.4 | 4492.91 | 0 | pass
auth.oauthCallback | GET /api/auth/oauth/google/callback | 8 | 0.25 | 0.38 | 0.38 | 0.24 | 6770.34 | 0 | pass
auth.refresh | POST /api/auth/refresh | 8 | 0.33 | 0.46 | 0.46 | 0.33 | 5418.68 | 0 | pass
users.list | GET /api/users | 8 | 0.24 | 0.27 | 0.27 | 0.23 | 7827.79 | 0 | pass
users.create | POST /api/users | 8 | 0.25 | 0.31 | 0.31 | 0.25 | 7189.12 | 0 | pass
jobs.list | GET /api/jobs | 8 | 0.21 | 0.28 | 0.28 | 0.2 | 8000 | 0 | pass
jobs.create | POST /api/jobs | 8 | 0.35 | 0.49 | 0.49 | 0.35 | 4643.74 | 0 | pass
proposals.list | GET /api/proposals | 8 | 0.22 | 0.31 | 0.31 | 0.21 | 8000 | 0 | pass
proposals.create | POST /api/proposals | 8 | 0.22 | 0.26 | 0.26 | 0.22 | 8000 | 0 | pass
payments.create | POST /api/payments | 8 | 0.26 | 0.49 | 0.49 | 0.25 | 6338.31 | 0 | pass
reviews.list | GET /api/reviews | 8 | 0.22 | 0.25 | 0.25 | 0.22 | 8000 | 0 | pass
reviews.create | POST /api/reviews | 8 | 0.22 | 0.27 | 0.27 | 0.21 | 8000 | 0 | pass
messages.list | GET /api/messages | 8 | 0.2 | 0.28 | 0.28 | 0.2 | 8000 | 0 | pass
messages.create | POST /api/messages | 8 | 0.22 | 0.33 | 0.33 | 0.22 | 7552.51 | 0 | pass
notifications.list | GET /api/notifications | 8 | 0.21 | 0.27 | 0.27 | 0.2 | 8000 | 0 | pass
notifications.create | POST /api/notifications | 8 | 0.25 | 0.31 | 0.31 | 0.24 | 7088.79 | 0 | pass
uploads.create | POST /api/uploads | 8 | 0.41 | 0.61 | 0.61 | 0.4 | 4236.45 | 0 | pass
search.global | GET /api/search?q=benchmark | 8 | 0.28 | 0.35 | 0.35 | 0.27 | 6324.11 | 0 | pass
admin.metrics | GET /api/admin/metrics | 8 | 0.36 | 0.54 | 0.54 | 0.36 | 4880.53 | 0 | pass

## Benchmark Environment

- CPU: Apple M4 Pro, 12 cores
- RAM: 48 GiB total
- Storage: internal Apple SSD
- Network: loopback for local benchmark target
- OS: macOS 26.3.1
- Node.js: v25.2.1
- Agent: Codex, OpenAI, shell/tool access enabled

Thresholds are read from `benchmarks/thresholds.json`.