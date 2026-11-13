# Benchmark demo

[Watch the recorded run](benchmark-demo.mp4).

This 23.4-second terminal replay shows a real `npm run benchmark` execution on
2026-10-15 at 22:40:51 UTC. Output appears at its original captured timing, with
one second of lead-in and five seconds holding the final screen. The recorded
command finished in 17.37 seconds with exit status 0: all 20 API endpoints,
200 measured requests each, zero errors, and a passing regression gate.

The companion [recording JSON](recording.json) preserves the output and timing.
The full baseline reports were copied from this same run. Rendering changes only
the terminal presentation; no benchmark results were edited or synthesized.

Execution: Node 22.23.3, npm 10.9.9, Debian 12, one CPU, 512 MiB RAM, and no
container network access. The harness starts its own isolated loopback API.
Current services use in-memory data and placeholders; these results do not
measure production database or payment-service capacity.

To reproduce the measured command after installing dependencies:

```sh
npm run benchmark
```
