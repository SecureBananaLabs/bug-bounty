# API Benchmarks

Run the API benchmark suite from `apps/api`:

```sh
npm run benchmark
```

The benchmark starts the Express app on an ephemeral local port, warms every scenario once, then records p50/p95/p99 total latency, p50/p95/p99 time to first byte, requests per second, and error rate for each endpoint.

The suite covers:

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/oauth/:provider/callback`
- `POST /api/auth/refresh`
- `GET /api/users`
- `POST /api/users`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/proposals`
- `POST /api/proposals`
- `POST /api/payments`
- `GET /api/reviews`
- `POST /api/reviews`
- `GET /api/messages`
- `POST /api/messages`
- `GET /api/notifications`
- `POST /api/notifications`
- `POST /api/uploads`
- `GET /api/search`
- `GET /api/admin/metrics`

Use environment variables or CLI flags to tune load:

```sh
API_BENCHMARK_ITERATIONS=20 API_BENCHMARK_CONCURRENCY=5 npm run benchmark
npm run benchmark -- --iterations=20 --concurrency=5
```

The default run stays below the local API rate limit so failures indicate endpoint behavior instead of benchmark self-throttling.
