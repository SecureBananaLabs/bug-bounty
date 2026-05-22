function percent(value) {
  return `${Math.round(value * 100)}%`;
}

export function evaluateThresholds(results, thresholds) {
  return results.map((result) => {
    const limit = {...thresholds.defaults, ...(thresholds.endpoints[result.id] ?? {})};
    const violations = [];

    if (result.p99Ms > limit.maxP99Ms) {
      violations.push(`p99 ${result.p99Ms}ms exceeds ${limit.maxP99Ms}ms`);
    }
    if (result.errorRate > limit.maxErrorRate) {
      violations.push(`error rate ${percent(result.errorRate)} exceeds ${percent(limit.maxErrorRate)}`);
    }

    return {
      ...result,
      passed: violations.length === 0,
      violations,
    };
  });
}

export function buildMarkdownReport(packet) {
  const rows = packet.results.map((result) => [
    result.passed ? "pass" : "fail",
    result.id,
    result.status,
    `${result.p50Ms} ms`,
    `${result.p95Ms} ms`,
    `${result.p99Ms} ms`,
    `${result.ttfbP95Ms} ms`,
    result.requestsPerSecond,
    percent(result.errorRate),
    result.violations.join("; ") || "-",
  ]);

  return [
    "# API Benchmark Summary",
    "",
    `Generated: ${packet.generatedAt}`,
    `Mode: \`${packet.mode}\``,
    `Target: \`${packet.target}\``,
    "",
    "## Results",
    "",
    "| Gate | Endpoint | Status | p50 | p95 | p99 | p95 TTFB | RPS | Error Rate | Notes |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## Benchmark Environment",
    "",
    `- Node.js: ${packet.benchmarkEnv.node}`,
    `- Platform: ${packet.benchmarkEnv.platform} ${packet.benchmarkEnv.arch}`,
    `- CPU: ${packet.benchmarkEnv.cpu}`,
    `- Cores: ${packet.benchmarkEnv.cores}`,
    `- Total memory: ${packet.benchmarkEnv.totalMemoryMb} MB`,
    "",
    "Synthetic payloads only. No production data, secrets, payment credentials, or live external APIs are used.",
    "",
  ].join("\n");
}
