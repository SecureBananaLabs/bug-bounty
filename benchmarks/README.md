# API benchmarks

Requires Node 22+. Install the API dependencies from the repository root:

```sh
npm install --prefix apps/api --workspaces=false --ignore-scripts --package-lock=false
npm run benchmark
```

The command starts a fresh API process bound to 127.0.0.1 on an ephemeral port,
seeds each in-memory collection with 50 records, checks every response status,
and benchmarks all 20 current API routes. It generates a random signing secret
and a dedicated benchmark-admin JWT in memory. Neither is written to reports.
The local server uses the ordinary middleware with a 1,000,000-request rate limit;
`createApp()` and the ordinary server still use the original 200/15 min limit.
The server is stopped even if setup, preflight or the performance gate fails.

`endpoints.json` supplies bodies based on `packages/db/prisma/schema.prisma` and
the API validators: a 1.4 KBjob description,1.9 KBproposal, message/notification
text and a 64 KiB multipart file. GET routes run against populated collections.
The route inventory is checked before every run. Adding or removing an API
route without updating its workload fails; update the inventory reader if route
declaration syntax changes. Auth, OAuth callback and refresh routes are included.

Current services store arrays in memory; authentication, database, search and
Stripe integrations include placeholders. The committed baseline measures this
actual runtime at the recorded commit. It does not characterize PostgreSQL,
Stripe or an implemented OAuth provider. Keep this distinction when comparing
future runs.

## Configuration and staging

Copy `.env.benchmark.example` to `.env.benchmark`. An empty target runs locally.
A configured target must be an isolated staging origin containing disposable
fixtures. Set its dedicated `BENCHMARK_TOKEN`, and explicitly enable
`BENCHMARK_ALLOW_REMOTE=true` for a remote hostname. The suite sends writes,
including payment-intent requests, so use only a disposable environment with
payment sandboxes. Staging data and rate quotas are operator-managed; automatic
seeding is local only. Preflight rejects invalid tokens, fixtures and quotas.

The full default is 10000 requests per endpoint at concurrency 4; request count is
bounded at 10000 and concurrency at 64. Each request has a 5 s wall-clock deadline. Each route stops issuing requests
after 15 s; incomplete runs fail the gate.
`npm run benchmark:smoke` fixes 30 requests/route at concurrency 1 for CI. Values
are deliberately explicit: increase workload only after checking memory/data
volume and available API quota.

## Results and regression gates

Each run writes timestamped JSON and Markdown under `benchmarks/results/`.
JSON includes status counts, response/body bytes, request count, duration,
environment, commit and concurrency. The Markdown table reports p 50/p 95/p 99
latency, sustained/peak RPS, error rate and p 50/p 95/p 99 TTFB.

Latency spans request dispatch through response-body drain. TTFB spans dispatch
to parsed response headers. Sustained RPS is completed requests/elapsed seconds;
peak RPS is the highest full one-second completion bucket (the overall rate
for a run shorter than one second). This is a closed-loop, fixed-count test, not an open-loop
arrival-rate or saturation model. Subsecond runs and workstation contention
need consideration when comparing values; raw durations remain in JSON.

`thresholds.json` contains reviewable default, smoke and per-endpoint limits.
Any latency violation or unexpected HTTP/network/timeout error fails the command
with exit 1. CI runs API tests, benchmark tests and the smoke suite, then uploads
JSON/Markdown artifacts even when the gate fails. Review new baselines rather
than automatically raising thresholds to accommodate a regression.

```sh
npm run benchmark:test
npm run benchmark:smoke
```

The tests exercise real delayed,500 and timeout HTTP responses, route omissions,
percentile calculation and the latency/error gates. To demonstrate the real
command's regression gate, temporarily lower `default.p 99 Ms` to 0.001, run
`npm run benchmark`, observe exit 1 and its report, then restore the threshold.
