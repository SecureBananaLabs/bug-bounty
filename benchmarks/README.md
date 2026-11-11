# API benchmarks

Run repeatable measurements against all **20 current HTTP method and route combinations under `/api/`**. The runner starts the real Express application in a fresh child process for each endpoint, prepares synthetic data, validates successful responses, and writes JSON and Markdown results. The [endpoint inventory](ENDPOINTS.md) describes each payload, expected response, and implementation limitation.

These measurements describe the current in-memory and placeholder services over loopback. The API and load generator share a machine. Database queries, payment-provider calls, TLS, network transit, and production deployment overhead are outside this measurement. The reported request rate is the throughput observed at the configured load; it does not establish maximum service capacity.

## Run from the repository root

Use Node.js **22.9 or later** and npm. The npm commands use [`--env-file-if-exists`, added in Node 22.9](https://nodejs.org/download/release/v22.23.0/docs/api/cli.html#--env-file-if-existsfile). Install the API workspace and root dependencies from the existing lockfile:

```sh
npm ci --ignore-scripts --workspace apps/api --include-workspace-root --no-audit --no-fund
npm test
npm run benchmark:smoke
npm run benchmark
```

`npm test` runs the API tests and benchmark tests. `npm run benchmark:test` runs only the benchmark tests, including metric calculations, failure cases, route coverage, and integration checks. Neither benchmark command needs a separately running API or a database.

| Command | Measured requests per endpoint | Maximum concurrent requests | Target starts per second |
| --- | ---: | ---: | ---: |
| `npm run benchmark` | 200 | 4 | 100 |
| `npm run benchmark:smoke` | 50 | 1 | 50 |

Both modes cover every endpoint. Each endpoint gets one semantic preflight and five additional warmup requests before measurement. List endpoints also receive three seed records. Seeds, startup, preflight, and warmup are excluded from the measured sample count and elapsed time.

Results are written to `benchmarks/results/latest.json` and `benchmarks/results/latest.md`. A later run in the same output directory replaces those files. Keep comparisons in separate directories:

```sh
npm run benchmark -- --output benchmarks/results/baseline
npm run benchmark -- --output benchmarks/results/candidate
npm run benchmark:smoke -- --output benchmarks/results/smoke
npm run benchmark -- --help
```

## Configuration

For optional local overrides, copy the example to the repository root:

```sh
cp benchmarks/.env.benchmark.example .env.benchmark
```

The npm commands load `.env.benchmark` with Node's `--env-file-if-exists` option. Leave the example's values commented to use the defaults for the selected mode. CLI options override configuration from the environment. Existing shell environment variables take precedence over values in the optional environment file.

| CLI option | Environment variable | Default and meaning |
| --- | --- | --- |
| `--smoke` | — | Selects the smoke defaults; maximum concurrency is restricted to 1 or 2. |
| `--requests N` | `BENCHMARK_REQUESTS` | 200 full / 50 smoke measured attempts per endpoint; integer from 1 to 1,000. The default gate requires at least 30 samples. |
| `--concurrency N` | `BENCHMARK_CONCURRENCY` | 4 full / 1 smoke; integer from 1 to 32, subject to the smoke restriction. |
| `--rate N` | `BENCHMARK_RATE` | 100 full / 50 smoke target starts per second; 0 disables pacing, with concurrency still bounded. Maximum 2,000. |
| `--warmup N` | `BENCHMARK_WARMUP` | 5 additional warmup requests per endpoint after its required preflight; integer from 0 to 20. |
| `--timeout-ms N` | `BENCHMARK_TIMEOUT_MS` | 1,000 ms absolute deadline per attempt; integer from 10 to 10,000. Covers the response body as well as headers. |
| `--thresholds PATH` | `BENCHMARK_THRESHOLDS` | `benchmarks/thresholds.json`; a complete threshold file for every scenario. |
| `--output PATH` | `BENCHMARK_OUTPUT` | `benchmarks/results`; directory containing `latest.json` and `latest.md`. |
| `--host HOST` | `BENCHMARK_HOST` | `127.0.0.1`; accepts `127.0.0.1`, `localhost`, or `::1` to select the local bind address. |
| `--help` | — | Prints usage without starting a benchmark. |

The runner always binds an ephemeral local port and owns the API process lifecycle. It accepts no remote base URL or external service target. Invalid CLI options or load settings fail before benchmark traffic begins; such early configuration errors may not produce result files.

Fractional rates are supported. A positive rate is rejected if the last scheduled request would be more than 2,147,483,647 ms after the start, preventing Node's timer overflow from silently converting a long wait into a 1 ms burst. A rate of zero remains the explicit unpaced mode.

For example, this preserves all endpoint coverage while increasing the sample size:

```sh
npm run benchmark -- --requests 500 --concurrency 4 --rate 100 --output benchmarks/results/500-samples
```

## Measurement definitions

The load generator uses Node's HTTP client with keep-alive connections and a bounded number of in-flight requests. It schedules starts at the requested rate, subject to available concurrency. Slow responses can reduce the achieved start rate. The wait before dispatch is excluded from individual request latency and included in the measured run's elapsed time. No correction for unissued requests or coordinated omission is applied.

| Metric | Definition |
| --- | --- |
| Latency p50 / p95 / p99 | Milliseconds from request dispatch to complete response body, request failure, or deadline. Every measured attempt contributes, including HTTP errors and timeouts. Percentiles use the nearest-rank method. |
| TTFB p50 / p95 / p99 | Milliseconds from request dispatch to the first observed response byte on the socket, measured separately from body completion. Only attempts with an observed byte contribute; the report includes the TTFB sample count. |
| Sustained RPS | Completed measured attempts divided by measured elapsed seconds, including failed attempts and pacing time. |
| Successful RPS | Successful measured attempts divided by the same elapsed seconds. |
| Peak RPS | Highest number of completed attempts in a fixed, complete one-second window. The final partial window is excluded. If the whole run is under one second, peak equals sustained RPS and the actual window duration is reported. |
| Error percentage | Failed measured attempts divided by all measured attempts, multiplied by 100. The expected status, valid JSON, successful envelope, and endpoint-specific semantic checks must all pass. |

HTTP 401, 429, and 500 responses, connection failures, deadlines, malformed JSON, oversized responses, and semantic mismatches count as errors. The report retains status counts and failure categories without storing response bodies, passwords, or tokens. A TTFB sample can exist for a request whose body later fails; no response byte leaves that attempt out of the TTFB percentile calculation.

At 50 samples, nearest-rank p99 is the largest observed latency. The smoke run is deliberately a broad, short regression check. It cannot substantiate a production p99 service-level objective or a high-confidence tail-latency estimate. Compare larger runs only when their hardware, runtime, resource limits, data, and load settings are comparable.

## Fixtures, authentication, and isolation

Every endpoint starts with a new API process and new in-memory state. List scenarios seed three representative records through the corresponding create route. Write scenarios use synthetic records and bounded request counts. See [ENDPOINTS.md](ENDPOINTS.md) for the exact method/path coverage, request fields, and response checks.

Each child receives a new random signing secret. A short-lived token for the dedicated `benchmark-admin` identity is supplied to the protected metrics scenario through process IPC. The runner does not require a user's JWT or password. Child environments clear `DATABASE_URL` and `STRIPE_SECRET_KEY`, and do not inherit `NODE_OPTIONS`.

The application's normal rate limit remains **200 requests per 15 minutes**. Benchmark children explicitly inject a separate **1,100 requests per 15 minutes** limiter, sized for the bounded measured load and setup requests. A fresh limiter is created for each scenario. This keeps rate-limit rejections from being mistaken for useful throughput; unexpected 429 responses still fail the run. The higher limit applies only to benchmark-created application instances.

The current auth and payments routes contain placeholders; a successful response from them is not evidence of password verification, an OAuth exchange, or payment processing. The dedicated metrics token exercises the current authentication middleware, whose authorization limitations are documented in the endpoint inventory.

## Performance gate

[`thresholds.json`](thresholds.json) has schema version `1` and an `endpoints` object keyed by scenario ID. Each endpoint specifies:

- `p99Ms`: maximum allowed p99 latency in milliseconds; the initial value is 250.
- `maxErrorRatePct`: maximum allowed error percentage; the initial value is 0.
- `minSamples`: minimum measured sample count; the initial value is 30.

The API's mounted `/api/` routes, scenario manifest, and threshold entries must agree exactly. Missing, additional, or duplicate coverage fails validation. An absent result, insufficient or incomplete samples, non-finite required metrics, missing TTFB, excessive p99, or excessive errors fails the gate. A run with no measurements cannot pass.

The initial thresholds are explicit guard values, not production commitments or an automatically learned baseline. Changes to a threshold should include comparable measurements and a reason for the new limit. Increasing the p99 budget cannot compensate for failed semantic checks or incomplete route coverage.

The command exits unsuccessfully when execution or the gate fails. The runner writes both result formats for handled execution and gate failures as well as successful runs. Termination or an unwritable output directory can prevent a report from being saved. Check the process exit status and the overall report outcome before using any rows as evidence; a partial failed report is not a successful baseline.

## Results and environment disclosure

The JSON report is intended for automation; the Markdown report presents the per-endpoint metrics and gate outcome for review. The reports identify the source commit, working-tree state, an input SHA-256 digest, load settings, and available environment data. Unknown environment details remain `UNKNOWN` rather than being inferred from a container's host-visible resources.

For a submitted result, complete the issue's environment disclosure from observed facts. Preserve unknowns when the execution environment does not expose them:

| Area | Details to disclose |
| --- | --- |
| Hardware | CPU model and core count; total RAM and available RAM during the run; storage type; loopback network; workstation, VM, container, or CI runner and instance type if known; OS and version. |
| Runtime | Exact Node version; memory or CPU limits, including cgroup/container limits; other significant processes sharing resources, or unknown visibility. |
| AI assistance | Tool and model/version if known; inference provider; orchestration framework if any; execution mode; shell/tool and internet access; whether the agent or a human ran the commands; sandbox constraints that affected execution. |

A source commit alone does not identify uncommitted code. Keep the input digest and working-tree disclosure with local results. A later source, scenario, configuration, or threshold change requires new measurements. Use the files generated by the run being reviewed.

## CI smoke run

The [benchmark smoke workflow](../.github/workflows/benchmark-smoke.yml) runs on pull requests and changes to `main`, with manual dispatch available. It installs the API workspace using the existing lockfile, runs `npm test`, then runs `npm run benchmark:smoke` on Ubuntu with Node 22. The job has a five-minute timeout and cancels superseded runs for the same PR or ref.

The workflow uses read-only repository permissions and pinned official Actions. It needs no repository secrets, external database, payment API, or deployment. Its final step attempts to upload `latest.json` and `latest.md` even when a previous step fails; no report exists if failure occurred before the runner produced one. Uploaded reports are retained for seven days.

Shared CI runners can be noisy. Use the environment data and repeated comparable runs to investigate an isolated slow result before changing a threshold. The workflow file's presence does not establish that hosted CI has run or passed.

## Demo for a bounty submission

[Issue #30's bounty instructions](https://github.com/SecureBananaLabs/bug-bounty/issues/30#issuecomment-4469529424) require a short demo video. Prepare and provide that video with the delivery before making a claim; the benchmark commands do not create or commit a recording.

Show the source/environment disclosure, the benchmark command, all endpoint results, and the generated JSON and Markdown files. Also demonstrate a deliberate failure using a separate stricter threshold file, including the nonzero exit status, followed by the normal gate result. Keep the stricter demonstration's output in a separate directory so it does not overwrite the result submitted as the baseline.
