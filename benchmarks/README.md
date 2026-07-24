# API Benchmark Suite

Run the full local benchmark:

```bash
npm run benchmark
```

Run the low-concurrency smoke gate used by CI:

```bash
npm run benchmark:smoke
```

Configuration can be supplied through environment variables or a local `.env.benchmark` file copied from `.env.benchmark.example`.

The runner starts the Express app locally by default, generates a dedicated benchmark JWT for protected routes, exercises every current `/api/*` route with realistic synthetic payloads, and writes JSON plus Markdown reports to `benchmarks/results/`.

Set `BENCHMARK_TARGET_URL` to benchmark an already running local or staging API instead of the in-process Express app.
