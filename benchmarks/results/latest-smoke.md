# API Benchmark Summary

- Generated at: 2026-05-22T21:41:18.494Z
- Profile: smoke
- Base URL: http://127.0.0.1:4010
- Endpoints covered: 20

## Benchmark Environment

**Hardware**
- CPU model & core count: 13th Gen Intel(R) Core(TM) i5-13600K (20 cores)
- RAM (total & available during benchmark): 31.75 GB total / 13.79 GB free
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
| /api/auth/register | POST | public | 90 | 1.64 | 16.71 | 16.82 | 2.59 | 24 | 24 | 0 | 3.57 | 10.04 |
| /api/auth/login | POST | public | 71 | 1.45 | 3.06 | 3.1 | 1.17 | 24 | 24 | 0 | 1.92 | 2.87 |
| /api/auth/oauth/github/callback | GET | public | 0 | 0.54 | 1.82 | 1.92 | 0.09 | 24 | 24 | 0 | 2.36 | 5.6 |
| /api/auth/refresh | POST | public | 2 | 2.26 | 4.56 | 4.61 | 2.17 | 24 | 24 | 0 | 1.97 | 3.21 |
| /api/users | GET | public | 0 | 0.95 | 2.48 | 2.69 | 0.55 | 24 | 24 | 0 | 1.24 | 2.08 |
| /api/users | POST | public | 352 | 1.19 | 2.46 | 2.5 | 1 | 24 | 24 | 0 | 1.67 | 3.79 |
| /api/jobs | GET | public | 0 | 0.97 | 2.65 | 2.65 | 0.67 | 24 | 24 | 0 | 1.11 | 1.75 |
| /api/jobs | POST | public | 673 | 1.77 | 3.24 | 3.25 | 1.63 | 24 | 24 | 0 | 1.04 | 1.35 |
| /api/proposals | GET | public | 0 | 0.81 | 4.28 | 4.31 | 0.63 | 24 | 24 | 0 | 0.95 | 1.62 |
| /api/proposals | POST | public | 552 | 1.16 | 3.32 | 3.32 | 1.09 | 24 | 24 | 0 | 2.94 | 8.64 |
| /api/payments | POST | public | 34 | 1.24 | 3.22 | 3.24 | 1.17 | 24 | 24 | 0 | 3.34 | 9.22 |
| /api/reviews | GET | public | 0 | 1.1 | 3.68 | 3.7 | 0.84 | 24 | 24 | 0 | 0.92 | 1.74 |
| /api/reviews | POST | public | 376 | 1.5 | 3.33 | 3.71 | 1.34 | 24 | 24 | 0 | 1.55 | 3.18 |
| /api/messages | GET | public | 0 | 1.02 | 3.34 | 3.34 | 0.92 | 24 | 24 | 0 | 0.91 | 1.38 |
| /api/messages | POST | public | 357 | 1.05 | 4.49 | 5.13 | 1 | 24 | 24 | 0 | 1.67 | 4.28 |
| /api/notifications | GET | public | 0 | 0.87 | 2.22 | 2.25 | 0.46 | 24 | 24 | 0 | 0.98 | 1.84 |
| /api/notifications | POST | public | 311 | 0.93 | 2.36 | 2.39 | 0.42 | 24 | 24 | 0 | 1.2 | 1.78 |
| /api/uploads | POST | public | 150 | 1.67 | 7.79 | 7.8 | 1.59 | 24 | 24 | 0 | 1.16 | 1.6 |
| /api/search?q=marketplace+payout+benchmark+plan | GET | public | 0 | 0.9 | 3.02 | 3.07 | 0.5 | 24 | 24 | 0 | 1.26 | 2.8 |
| /api/admin/metrics | GET | benchmark token | 0 | 2.27 | 12.41 | 12.73 | 3 | 24 | 24 | 0 | 1.48 | 1.81 |
