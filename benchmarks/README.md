# API benchmarks

This suite drives all 20 registered `/api/` method/path combinations through the
real Express `createApp()` over HTTP. A coverage test compares the manifest with
the app's registered routers, so adding an API route requires adding a scenario
and a threshold. Fixtures enforce this check too, including direct app routes.
`/health` is covered by the application's functional test.

Use Node 22 or newer. From the repository root:

```sh
npm ci --workspace apps/api --include-workspace-root --ignore-scripts --no-audit --no-fund
npm test
npm run benchmark
```

The install selects only the API workspace; no frontend, Prisma generation or
global tool is needed. The root `build` and `lint` commands are placeholders,
not evidence of compilation or static analysis. Tests use Node's built-in test
runner, and the load generator uses native `http`, without a new dependency.

## Workload and isolation

Copy `.env.benchmark.example` to `.env.benchmark` to configure the loopback host,
port, requests, concurrency, warmup and timeout. Shell variables take precedence.
The default is 1,000 measured requests and 20 warmup requests per endpoint, with
four concurrent keep-alive connections and no pipelining. CI uses 60 requests,
five warmup requests and concurrency two. Counts and concurrency are bounded.

Every endpoint gets a new child process with the real app, real route handlers
and middleware, and 20 synthetic rows in each of the six in-memory collections.
The process is closed after that endpoint, including on failure or interruption.
GET payloads are stable across runs; POST collection growth is bounded by the
warmup and request counts. Samples exercise current Zod/Prisma field shapes;
description-bearing JSON is approximately 1.2 KiB and the multipart file is
16 KiB. The admin route receives a dedicated, short-lived JWT signed by the
project's token utility. Tokens and response bodies are not written to reports.

The parent does not inherit application credentials into the fixture. No `.env`
file is read by the app fixture, and it binds only a literal loopback address.
`BENCH_PORT=0` avoids existing services; a specified occupied port fails instead
of sending traffic to that service. This command intentionally starts its own
local target and cannot load-test an existing staging/production service.

The app currently implements `connectDb()` as a placeholder and its services
use arrays or synthetic responses. The payment service does not call Stripe.
These measurements establish a baseline for **this implementation**, not for
PostgreSQL, Stripe, realistic production authentication, or production capacity.
Fixture assumptions must be revisited when those integrations become real.

The standard server limit stays **200 requests per 15 minutes**. Only the
explicit fixture calls `createApp({rateLimitOptions: {limit: 100000}})` to retain
the actual limiter while measuring handler performance beyond 200 requests.
The default limiter is independently tested at its 201st request. The report
records both caps; rate-limit errors are never removed from statistics.

## Metrics and gate

`benchmarks/results/latest.json` contains machine-readable measurements and
`latest.md` contains the PR-ready table. Each file is replaced atomically.
Incomplete or interrupted runs record `passed: false, complete: false`.
Generated results are ignored by Git; CI uploads them even if the gate fails.
Set `BENCH_RESULTS_DIR` to keep a separate run's reports when comparing profiles.

- Latency: request start to full response completion, including local queue,
  connection and transport time. Warmup uses separate connections and is excluded.
- TTFB: request start to first socket data, including HTTP headers, not the full
  body duration. Both metrics report nearest-rank p50/p95/p99 for complete,
  successful responses only; absent samples are `null` and fail the gate.
- Error rate: failed requests divided by all measured requests. Unexpected
  statuses (including 404 and 429), network failures, truncated responses and
  timeouts count as errors. Status counts remain visible in JSON.
- Sustained RPS: all completions, including failures, divided by measured wall
  time. Peak RPS is the highest 100 ms completion bucket; the final shorter
  bucket uses its actual duration. Short runs and partial buckets are noisy;
  compare throughput alongside errors, sample count, hardware and concurrency.

This is a closed-loop test, so it does not model an independently scheduled
arrival rate or correct coordinated omission. A shared CI runner's p99 is a
coarse regression signal, not a service-level objective.

`thresholds.json` explicitly lists every endpoint's p99 ceiling and maximum
error fraction. Missing, extra or invalid entries fail closed. Initial smoke
ceilings are a deliberately broad **250 ms p99 and zero errors**, reviewable in
source; tighten them only using comparable baseline measurements. There are no
automatic retries, dropped errors, or automatic threshold/snapshot updates.

To exercise a failing gate without changing the checked-in budgets, copy the
threshold file within this checkout, lower a p99 ceiling below the observed
value, and set `BENCH_THRESHOLDS_PATH` to that copy. The same real API run writes
a failed report and exits nonzero. Restore the normal threshold path for the
baseline. `npm test` also checks known distributions, error counting, slow-body
TTFB, timeouts, authentication, fixture cleanup and normal rate limiting.

Reports record Node, OS/architecture, CPU model, logical CPUs, memory, workload
and limiter settings, without usernames, process lists, tokens or environment
dumps. In a PR, paste the Markdown summary and disclose the tool/AI assistance
and any known resource limits. Attach a short terminal recording of the run,
report, and failing gate for the bounty's requested demo.
