# Recorded baseline

These reports were produced by the actual benchmark against the pinned repository API, not a mock server. The full run matches the recorded terminal demo.

- Source before this change: `f5efbf38b336ec30df131ae5baccc973b91d37f1`.
- Runtime: Node 22.23.3, npm 10.9.9, Debian 12 container, DigitalOcean `DO-Regular` VM.
- Limits: one CPU, 512 MiB memory, 64 processes, no external network during benchmark execution.
- Transport: loopback. Physical disk type and DigitalOcean instance SKU were not independently identified.
- Existing ACE services were running on the same VM; these are shared-host measurements.
- Host total/free memory at benchmark start and actual cgroup quotas are recorded in each JSON report.
- Full: 20 endpoints, 200 measured requests each at concurrency four; 4,000 measured requests, zero errors.
- Smoke: 20 endpoints, ten measured requests each at concurrency one; 200 measured requests, zero errors.
- Each endpoint additionally receives two excluded warmup requests.

The runtime currently uses the repository's in-memory stores and service placeholders. The benchmark keeps real routes, validators, JWT handling, serialization and multipart parsing. Its local app bypasses the request quota; normal `createApp()` keeps the original limiter. These results make no claim about a production database or payment provider.

Validation: nine benchmark tests and the existing health test pass. A temporary-copy negative CLI test used impossible latency ceilings and correctly exited 1 with 20 regression failures and no HTTP errors. The existing `npm test` script fails on Node 22 because it supplies `src/tests` as a module path; the same existing health test passes with its explicit file path.
