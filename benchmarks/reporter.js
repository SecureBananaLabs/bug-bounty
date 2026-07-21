import thresholdsData from "./thresholds.json" with { type: "json" };

const thresholds = thresholdsData;

function statusBadge(value, limit) {
  if (limit == null) return "n/a";
  return value <= limit ? "PASS" : "FAIL";
}

export function formatReport(report, failures = [], thresholdMap = thresholds) {
  const lines = [];
  lines.push(`# FreelanceFlow API Benchmark Report`);
  lines.push("");
  lines.push(`- **Generated:** ${report.generatedAt}`);
  lines.push(`- **Target:** ${report.targetHost}`);
  lines.push(`- **Mode:** ${report.mode}`);
  lines.push("");

  lines.push(`## Summary`);
  lines.push("");
  lines.push(`| Endpoint | Auth | p50 (ms) | p95 (ms) | p99 (ms) | RPS (avg) | RPS (peak) | Error % | TTFB p99 (ms) | Status |`);
  lines.push(`| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`);

  for (const e of report.endpoints) {
    const t = thresholdMap[e.name];
    const status = statusBadge(e.latency.p99, t?.p99Ms);
    lines.push(
      `| ${e.name} | ${e.auth ? "yes" : "no"} | ${e.latency.p50} | ${e.latency.p95} | ${e.latency.p99} | ${e.requestsPerSecond} | ${e.peakRequestsPerSecond} | ${e.errorRate} | ${e.ttfb.p99} | ${status} |`
    );
  }
  lines.push("");

  lines.push(`## Per-Endpoint Detail`);
  lines.push("");
  for (const e of report.endpoints) {
    lines.push(`### ${e.name}`);
    lines.push("");
    lines.push(`- Connections: ${e.connections}, Duration: ${e.duration}s`);
    lines.push(`- **Latency (ms):** p50=${e.latency.p50}, p95=${e.latency.p95}, p99=${e.latency.p99}, mean=${e.latency.mean}, min=${e.latency.min}, max=${e.latency.max}`);
    lines.push(`- **Throughput (req/s):** avg=${e.requestsPerSecond}, peak=${e.peakRequestsPerSecond}, total=${e.totalRequests}`);
    lines.push(`- **Error rate:** ${e.errorRate}% (errors=${e.errors}, timeouts=${e.timeouts}, non-2xx=${e.non2xx})`);
    lines.push(`- **TTFB (ms):** p50=${e.ttfb.p50}, p95=${e.ttfb.p95}, p99=${e.ttfb.p99}, mean=${e.ttfb.mean}`);
    lines.push(`- **Bytes/s:** avg=${e.throughput.average}, max=${e.throughput.max}`);
    lines.push("");
  }

  lines.push(`## Regression Gate`);
  lines.push("");
  if (failures.length === 0) {
    lines.push(`All endpoints are within their configured p99 thresholds. ✅`);
  } else {
    lines.push(`The following endpoints exceeded their p99 thresholds:`);
    lines.push("");
    for (const f of failures) lines.push(`- ${f}`);
  }
  lines.push("");

  return lines.join("\n");
}
