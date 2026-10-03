# API Benchmark Summary

- Generated at: 2026-05-22T21:41:57.849Z
- Profile: full
- Base URL: http://127.0.0.1:4010
- Endpoints covered: 20

## Benchmark Environment

**Hardware**
- CPU model & core count: 13th Gen Intel(R) Core(TM) i5-13600K (20 cores)
- RAM (total & available during benchmark): 31.75 GB total / 13.85 GB free
- Storage type (SSD / NVMe / HDD): unknown
- Network interface (Ethernet / WiFi / loopback): loopback
- Machine type (local workstation / cloud VM / CI runner - include instance type if cloud): local workstation
- OS & version: win32 10.0.26200

**Runtime**
- Node.js version (or relevant runtime): v22.18.0
- Any resource limits applied (Docker memory cap, cgroup limits, etc.): none declared
- Other significant processes running during benchmark (yes / no - if yes, describe): unknown

**If submitted by or with an AI agent**
- Agent or tool name: Codex
- Underlying model and version: GPT-5
- Inference provider: OpenAI
- Orchestration framework if any: Codex desktop
- Execution mode: fully autonomous
- Did the agent have shell/tool access during execution: yes
- Did the agent have internet access during execution: yes
- Were benchmark commands run by the agent directly or handed off to the human to run: agent directly
- Any known agent constraints or sandboxing that may have affected execution: No GitHub CLI in PATH; some authenticated payout pages are browser-policy limited.

## Endpoint Metrics

| Endpoint | Method | Auth | Payload bytes | p50 ms | p95 ms | p99 ms | Avg ms | Sustained req/s | Peak req/s | Error % | Avg TTFB ms | p95 TTFB ms |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| /api/auth/register | POST | public | 90 | 4.33 | 21.07 | 21.39 | 5.53 | 80 | 80 | 0 | 3.44 | 9.79 |
| /api/auth/login | POST | public | 71 | 4.17 | 6 | 6.31 | 4 | 80 | 80 | 0 | 1.54 | 2.01 |
| /api/auth/oauth/github/callback | GET | public | 0 | 1.53 | 2.99 | 3.11 | 1.25 | 80 | 80 | 0 | 0.96 | 1.82 |
| /api/auth/refresh | POST | public | 2 | 6.94 | 10.61 | 11.12 | 6.69 | 80 | 80 | 0 | 2.52 | 5.91 |
| /api/users | GET | public | 0 | 2.19 | 8.32 | 8.4 | 2.6 | 80 | 80 | 0 | 1.05 | 1.78 |
| /api/users | POST | public | 352 | 3.05 | 6.06 | 6.16 | 2.73 | 80 | 80 | 0 | 1.6 | 2.9 |
| /api/jobs | GET | public | 0 | 2.55 | 8.22 | 8.38 | 2.53 | 80 | 80 | 0 | 0.77 | 1.11 |
| /api/jobs | POST | public | 673 | 3.97 | 10.13 | 10.45 | 4.18 | 80 | 80 | 0 | 1.32 | 1.79 |
| /api/proposals | GET | public | 0 | 2.71 | 8.3 | 8.98 | 3.19 | 80 | 80 | 0 | 0.99 | 1.81 |
| /api/proposals | POST | public | 552 | 2.73 | 9.28 | 9.36 | 3.2 | 80 | 80 | 0 | 1.2 | 1.5 |
| /api/payments | POST | public | 34 | 3.09 | 6.36 | 6.46 | 2.95 | 80 | 80 | 0 | 1.07 | 1.4 |
| /api/reviews | GET | public | 0 | 2.13 | 5.08 | 5.18 | 1.98 | 80 | 80 | 0 | 0.75 | 1.05 |
| /api/reviews | POST | public | 376 | 2.89 | 5.52 | 5.56 | 2.78 | 80 | 80 | 0 | 1.57 | 4.09 |
| /api/messages | GET | public | 0 | 2.18 | 6 | 6.02 | 1.93 | 80 | 80 | 0 | 1.06 | 1.73 |
| /api/messages | POST | public | 357 | 3.65 | 12.46 | 12.5 | 3.74 | 80 | 80 | 0 | 2.82 | 9.8 |
| /api/notifications | GET | public | 0 | 2.68 | 6.87 | 7.69 | 2.63 | 80 | 80 | 0 | 1.07 | 2.22 |
| /api/notifications | POST | public | 311 | 3.01 | 6.78 | 7.74 | 3.12 | 80 | 80 | 0 | 1.18 | 1.69 |
| /api/uploads | POST | public | 150 | 4.77 | 13.26 | 13.39 | 5.15 | 80 | 80 | 0 | 2.25 | 3.21 |
| /api/search?q=marketplace+payout+benchmark+plan | GET | public | 0 | 4.7 | 7.48 | 8.64 | 4.57 | 80 | 80 | 0 | 1.03 | 1.7 |
| /api/admin/metrics | GET | benchmark token | 0 | 6.42 | 14.49 | 14.5 | 7.13 | 80 | 80 | 0 | 1.81 | 2.66 |
