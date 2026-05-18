# API Benchmark Report

Generated: 2026-05-18T00:26:07.758Z
Base URL: http://127.0.0.1:4000
Concurrency: 10
Duration: 3s per endpoint

## Summary

| Endpoint | Method | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Avg (ms) | Error Rate |
|----------|--------|-----|-----------|-----------|-----------|----------|------------|
| health | GET | 2070 | 3.6 | 11.2 | 16.2 | 4.8 | 0.0% |
| auth-login | GET | 0 | 0.0 | 0.0 | 0.0 | 0.0 | 100.0% |
| jobs-list | GET | 2647 | 2.8 | 9.5 | 14.7 | 3.8 | 0.0% |
| users-list | GET | 2740 | 2.9 | 9.5 | 15.0 | 3.6 | 0.0% |
| search | GET | 2740 | 2.4 | 9.3 | 13.7 | 3.6 | 0.0% |
| proposals-list | GET | 2833 | 2.4 | 8.0 | 12.8 | 3.5 | 0.0% |
| reviews-list | GET | 2805 | 2.4 | 9.2 | 13.4 | 3.6 | 0.0% |
| messages-list | GET | 2813 | 2.4 | 8.8 | 13.4 | 3.5 | 0.0% |
| notifications-list | GET | 2930 | 2.3 | 8.3 | 12.8 | 3.4 | 0.0% |

## Detailed Results

### health (GET /health)

- **Throughput**: 2070 req/s
- **Total Requests**: 6228
- **Successful**: 6228
- **Errors**: 0 (0.0%)
- **Latency p50**: 3.65 ms
- **Latency p95**: 11.24 ms
- **Latency p99**: 16.15 ms
- **Latency Avg**: 4.80 ms
- **Latency Min**: 0.58 ms
- **Latency Max**: 43.35 ms

### auth-login (GET /api/auth/login)

- **Throughput**: 0 req/s
- **Total Requests**: 55992
- **Successful**: 55992
- **Errors**: 55992 (100.0%)
- **Latency p50**: 0.00 ms
- **Latency p95**: 0.00 ms
- **Latency p99**: 0.00 ms
- **Latency Avg**: 0.00 ms
- **Latency Min**: 0.00 ms
- **Latency Max**: 0.00 ms

### jobs-list (GET /api/jobs)

- **Throughput**: 2647 req/s
- **Total Requests**: 7951
- **Successful**: 7951
- **Errors**: 0 (0.0%)
- **Latency p50**: 2.77 ms
- **Latency p95**: 9.52 ms
- **Latency p99**: 14.65 ms
- **Latency Avg**: 3.77 ms
- **Latency Min**: 0.56 ms
- **Latency Max**: 127.39 ms

### users-list (GET /api/users)

- **Throughput**: 2740 req/s
- **Total Requests**: 8231
- **Successful**: 8231
- **Errors**: 0 (0.0%)
- **Latency p50**: 2.89 ms
- **Latency p95**: 9.45 ms
- **Latency p99**: 15.03 ms
- **Latency Avg**: 3.64 ms
- **Latency Min**: 0.59 ms
- **Latency Max**: 64.80 ms

### search (GET /api/search)

- **Throughput**: 2740 req/s
- **Total Requests**: 8234
- **Successful**: 8234
- **Errors**: 0 (0.0%)
- **Latency p50**: 2.42 ms
- **Latency p95**: 9.27 ms
- **Latency p99**: 13.74 ms
- **Latency Avg**: 3.64 ms
- **Latency Min**: 0.42 ms
- **Latency Max**: 23.94 ms

### proposals-list (GET /api/proposals)

- **Throughput**: 2833 req/s
- **Total Requests**: 8514
- **Successful**: 8514
- **Errors**: 0 (0.0%)
- **Latency p50**: 2.44 ms
- **Latency p95**: 8.00 ms
- **Latency p99**: 12.76 ms
- **Latency Avg**: 3.52 ms
- **Latency Min**: 0.55 ms
- **Latency Max**: 23.52 ms

### reviews-list (GET /api/reviews)

- **Throughput**: 2805 req/s
- **Total Requests**: 8428
- **Successful**: 8428
- **Errors**: 0 (0.0%)
- **Latency p50**: 2.41 ms
- **Latency p95**: 9.23 ms
- **Latency p99**: 13.42 ms
- **Latency Avg**: 3.56 ms
- **Latency Min**: 0.43 ms
- **Latency Max**: 29.11 ms

### messages-list (GET /api/messages)

- **Throughput**: 2813 req/s
- **Total Requests**: 8457
- **Successful**: 8457
- **Errors**: 0 (0.0%)
- **Latency p50**: 2.36 ms
- **Latency p95**: 8.78 ms
- **Latency p99**: 13.44 ms
- **Latency Avg**: 3.55 ms
- **Latency Min**: 0.41 ms
- **Latency Max**: 24.36 ms

### notifications-list (GET /api/notifications)

- **Throughput**: 2930 req/s
- **Total Requests**: 8809
- **Successful**: 8809
- **Errors**: 0 (0.0%)
- **Latency p50**: 2.34 ms
- **Latency p95**: 8.29 ms
- **Latency p99**: 12.76 ms
- **Latency Avg**: 3.40 ms
- **Latency Min**: 0.44 ms
- **Latency Max**: 23.36 ms

## Bottleneck Analysis

Endpoints sorted by p95 latency (highest first):

1. **health** - p95: 11.2ms 🟢 OK
2. **jobs-list** - p95: 9.5ms 🟢 OK
3. **users-list** - p95: 9.5ms 🟢 OK
4. **search** - p95: 9.3ms 🟢 OK
5. **reviews-list** - p95: 9.2ms 🟢 OK
6. **messages-list** - p95: 8.8ms 🟢 OK
7. **notifications-list** - p95: 8.3ms 🟢 OK
8. **proposals-list** - p95: 8.0ms 🟢 OK
9. **auth-login** - p95: 0.0ms 🟢 OK