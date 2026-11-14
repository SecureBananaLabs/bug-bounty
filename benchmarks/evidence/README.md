# Recorded local validation

These artifacts were captured against implementation commit `edaa8fdbd885f3dcc98224a12d0675e5dc25569b` on macOS arm64, Node 24.19.0.

- `baseline.json` / `baseline.md`: default workload, all 20 API endpoints, 20,000 measured requests, zero errors and no threshold violations.
- `demo.mp4`: faithful rendering of actual CLI output, first with deliberately strict thresholds (expected exit 1), then with the normal thresholds (exit 0). Only the local absolute workspace prefix was redacted.

The initial draft, tests and review were prepared using OpenAI Codex. The API currently uses in-memory collections and placeholder integrations; these are local regression measurements, not production-capacity estimates. The video is a rendered terminal recording, not a live-desktop screen capture.

The short failure run uses 60 requests per endpoint, five warmup requests and concurrency two, with p99 set deliberately to 0.000001 ms in a separate threshold file. All 1,200 HTTP requests completed successfully; all 20 latency gates rejected the artificially strict limit. No checked-in threshold was relaxed.
