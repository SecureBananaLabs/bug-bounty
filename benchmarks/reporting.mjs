import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Number(value.toFixed(digits)).toString();
}

export function evaluateThresholds(results, thresholds) {
  const failures = [];

  for (const result of results) {
    const endpointThresholds = thresholds.endpoints?.[result.id] ?? {};
    const p99Limit = endpointThresholds.p99LatencyMs ?? thresholds.defaults?.p99LatencyMs;
    const errorRateLimit = endpointThresholds.errorRate ?? thresholds.defaults?.errorRate;
    const ttfbLimit = endpointThresholds.ttfbP95Ms ?? thresholds.defaults?.ttfbP95Ms;

    if (Number.isFinite(p99Limit) && result.metrics.latency.p99 > p99Limit) {
      failures.push(`${result.id} p99 latency ${formatNumber(result.metrics.latency.p99)}ms exceeded ${p99Limit}ms`);
    }
    if (Number.isFinite(errorRateLimit) && result.metrics.errors.rate > errorRateLimit) {
      failures.push(`${result.id} error rate ${formatNumber(result.metrics.errors.rate * 100, 2)}% exceeded ${formatNumber(errorRateLimit * 100, 2)}%`);
    }
    if (Number.isFinite(ttfbLimit) && result.metrics.ttfb.p95 > ttfbLimit) {
      failures.push(`${result.id} TTFB p95 ${formatNumber(result.metrics.ttfb.p95)}ms exceeded ${ttfbLimit}ms`);
    }
  }

  return { passed: failures.length === 0, failures };
}

export function buildMarkdownReport(report) {
  const rows = report.results.map((result) => [
    result.id,
    `${result.method} ${result.path}`,
    result.status,
    `${formatNumber(result.metrics.latency.p50)} ms`,
    `${formatNumber(result.metrics.latency.p95)} ms`,
    `${formatNumber(result.metrics.latency.p99)} ms`,
    `${formatNumber(result.metrics.ttfb.p95)} ms`,
    formatNumber(result.metrics.requests.sustainedRps),
    formatNumber(result.metrics.requests.peakRps),
    `${formatNumber(result.metrics.errors.rate * 100, 2)}%`
  ]);

  const table = [
    "| Endpoint | Route | Status | p50 latency | p95 latency | p99 latency | TTFB p95 | sustained RPS | peak RPS | error rate |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");

  const failures = report.thresholdSummary.failures.length
    ? report.thresholdSummary.failures.map((failure) => `- ${failure}`).join("\n")
    : "- None";

  return [
    "# API Benchmark Summary",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Target: ${report.targetUrl}`,
    `Duration per endpoint: ${report.durationSeconds}s`,
    `Connections: ${report.connections}`,
    "",
    table,
    "",
    "## Regression Gate",
    "",
    `Passed: ${report.thresholdSummary.passed ? "yes" : "no"}`,
    "",
    failures,
    ""
  ].join("\n");
}

export async function writeReports(report, markdown, outputDir = "benchmarks/results") {
  await mkdir(outputDir, { recursive: true });

  const safeTimestamp = report.generatedAt.replace(/[:.]/g, "-");
  const basename = `api-benchmark-${report.mode}-${safeTimestamp}`;
  const jsonPath = path.join(outputDir, `${basename}.json`);
  const markdownPath = path.join(outputDir, `${basename}.md`);
  const latestJsonPath = path.join(outputDir, "latest.json");
  const latestMarkdownPath = path.join(outputDir, "latest.md");

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, markdown);
  await writeFile(latestJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(latestMarkdownPath, markdown);

  return { jsonPath, markdownPath, latestJsonPath, latestMarkdownPath };
}
