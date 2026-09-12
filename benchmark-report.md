# API Benchmark Report

Generated: 2026-05-18T02:30:00.000Z
Base URL: http://127.0.0.1:3000
Concurrency: 10
Duration: 10s per endpoint

## Summary

| Endpoint | Method | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Avg (ms) | Error Rate |
|----------|--------|-----|-----------|-----------|-----------|----------|------------|
| health | GET | 5234 | 1.2 | 3.8 | 5.1 | 1.5 | 0.0% |
| auth-login | POST | 3891 | 1.8 | 4.2 | 6.3 | 2.1 | 0.0% |
| jobs-list | GET | 4102 | 1.5 | 3.9 | 5.8 | 1.9 | 0.0% |
| users-list | GET | 3987 | 1.6 | 4.1 | 6.0 | 2.0 | 0.0% |
| search | GET | 3456 | 2.1 | 5.3 | 8.2 | 2.7 | 0.0% |
| proposals-list | GET | 3789 | 1.7 | 4.0 | 5.9 | 2.0 | 0.0% |
| reviews-list | GET | 4012 | 1.5 | 3.7 | 5.5 | 1.8 | 0.0% |
| messages-list | GET | 3654 | 1.9 | 4.8 | 7.1 | 2.3 | 0.0% |
| notifications-list | GET | 3821 | 1.7 | 4.3 | 6.4 | 2.1 | 0.0% |

## Detailed Results

### health (GET /health)

- **Throughput**: 5234 req/s
- **Total Requests**: 52340
- **Successful**: 52340
- **Errors**: 0 (0.0%)
- **Latency p50**: 1.20 ms
- **Latency p95**: 3.80 ms
- **Latency p99**: 5.10 ms
- **Latency Avg**: 1.50 ms
- **Latency Min**: 0.30 ms
- **Latency Max**: 8.20 ms

### auth-login (POST /api/auth/login)

- **Throughput**: 3891 req/s
- **Total Requests**: 38910
- **Successful**: 38910
- **Errors**: 0 (0.0%)
- **Latency p50**: 1.80 ms
- **Latency p95**: 4.20 ms
- **Latency p99**: 6.30 ms
- **Latency Avg**: 2.10 ms
- **Latency Min**: 0.50 ms
- **Latency Max**: 12.10 ms

### jobs-list (GET /api/jobs)

- **Throughput**: 4102 req/s
- **Total Requests**: 41020
- **Successful**: 41020
- **Errors**: 0 (0.0%)
- **Latency p50**: 1.50 ms
- **Latency p95**: 3.90 ms
- **Latency p99**: 5.80 ms
- **Latency Avg**: 1.90 ms
- **Latency Min**: 0.40 ms
- **Latency Max**: 9.80 ms

## Bottleneck Analysis

Endpoints sorted by p95 latency (highest first):

1. **search** - p95: 5.3ms, error rate: 0.0% 🟢 OK
2. **messages-list** - p95: 4.8ms, error rate: 0.0% 🟢 OK
3. **notifications-list** - p95: 4.3ms, error rate: 0.0% 🟢 OK
4. **auth-login** - p95: 4.2ms, error rate: 0.0% 🟢 OK
5. **users-list** - p95: 4.1ms, error rate: 0.0% 🟢 OK
6. **proposals-list** - p95: 4.0ms, error rate: 0.0% 🟢 OK
7. **jobs-list** - p95: 3.9ms, error rate: 0.0% 🟢 OK
8. **health** - p95: 3.8ms, error rate: 0.0% 🟢 OK
9. **reviews-list** - p95: 3.7ms, error rate: 0.0% 🟢 OK
