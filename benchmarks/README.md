# API benchmarks

Baseline performance suite for every endpoint mounted under `/api/`, plus
`/health`. It exists so a regression shows up in a pull request rather than in
production.

## Running it

```bash
npm install
cp benchmarks/.env.benchmark.example .env.benchmark   # then edit
npm run -w apps/api dev &                             # or point at staging
npm run benchmark
```

`npm run benchmark:smoke` is the same suite at low concurrency for three
seconds per endpoint. That is what CI runs on every pull request.

## What it measures

Per endpoint: p50, p95 and p99 latency, requests per second (sustained and
peak), error rate, and time to first byte. Auth-protected routes are exercised
with a token the runner signs itself — logging in inside the measurement would
charge the auth round-trip to every other endpoint.

## Output

Each run writes to `benchmarks/results/`:

- `<timestamp>.json` — the full measurement, for tracking over time
- `<timestamp>.md` — a table you can paste into a pull request
- `latest.json` / `latest.md` — the most recent run

## The rate limiter

`apps/api/src/middleware/rateLimit.js` allows 200 requests per 15 minutes
globally — about 0.22 req/s. A benchmark reaches that in the first fraction of
a second, and everything after it is a 429, so the first run of this suite
reported 99% "errors" on every endpoint and measured nothing.

The middleware now reads `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` from the
environment, keeping the current values as defaults so nothing changes in
production. Raise them on the target you are benchmarking; the CI job does.

The runner counts 429s separately from failures and warns when more than half
the requests were throttled, because at that point the numbers describe the
limiter rather than the API.

## Thresholds

`thresholds.json` holds the p99 ceiling, maximum error rate and minimum
throughput per endpoint. Anything without its own entry falls back to
`default`, so a new route cannot slip past the gate unmeasured. Exceeding a
threshold exits non-zero, which is what fails the CI job.

The committed values are the first baseline plus headroom. Tighten them as the
numbers improve; that is the point of keeping them in a reviewable file.

## Adding an endpoint

Add it to `endpoints.js` with a realistic payload, and give it a threshold if
the default does not suit it.
