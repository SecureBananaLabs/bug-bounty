import { mkdir, writeFile } from "node:fs/promises";

function n(value, digits = 2) {
  return Number(value ?? 0).toFixed(digits);
}

export function markdownReport(report) {
  const lines = [];
  lines.push(`# API Benchmark Report`);
  lines.push("");
  lines.push(`- Mode: ${report.mode}`);
  lines.push(`- Base URL: ${report.baseUrl}`);
  lines.push(`- Started: ${report.startedAt}`);
  lines.push(`- Completed: ${report.completedAt}`);
  lines.push(`- Duration: ${report.durationMs}ms`);
  lines.push(`- Concurrency: ${report.concurrency}`);
  lines.push(`- Result: ${report.thresholds.passed ? "PASS" : "FAIL"}`);
  lines.push(`- Endpoints covered: ${report.scenarios.length}`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---:|`);
  lines.push(`| Requests | ${report.summary.requests} |`);
  lines.push(`| Successes | ${report.summary.successes} |`);
  lines.push(`| Failures | ${report.summary.failures} |`);
  lines.push(`| Error rate | ${(report.summary.errorRate * 100).toFixed(2)}% |`);
  lines.push(`| Sustained RPS | ${n(report.summary.requestsPerSecond)} |`);
  lines.push(`| Peak scenario RPS | ${n(report.summary.peakRequestsPerSecond)} |`);
  lines.push(`| p50 latency | ${n(report.summary.latencyMs.p50)} ms |`);
  lines.push(`| p95 latency | ${n(report.summary.latencyMs.p95)} ms |`);
  lines.push(`| p99 latency | ${n(report.summary.latencyMs.p99)} ms |`);
  lines.push(`| p99 TTFB | ${n(report.summary.ttfbMs.p99)} ms |`);
  lines.push("");
  lines.push(`## Scenarios`);
  lines.push("");
  lines.push(`| Scenario | Method | Path | Requests | Error rate | Sustained RPS | p50 ms | p95 ms | p99 ms | p99 TTFB ms | Status counts |`);
  lines.push(`|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|`);
  for (const s of report.scenarios) {
    lines.push(`| ${s.name} | ${s.method} | ${s.path} | ${s.summary.requests} | ${(s.summary.errorRate * 100).toFixed(2)}% | ${n(s.summary.requestsPerSecond)} | ${n(s.summary.latencyMs.p50)} | ${n(s.summary.latencyMs.p95)} | ${n(s.summary.latencyMs.p99)} | ${n(s.summary.ttfbMs.p99)} | ${JSON.stringify(s.summary.statusCounts)} |`);
  }
  lines.push("");
  lines.push(`## Thresholds`);
  lines.push("");
  if (report.thresholds.failures.length === 0) {
    lines.push(`All configured thresholds passed.`);
  } else {
    for (const failure of report.thresholds.failures) lines.push(`- ${failure}`);
  }
  lines.push("");
  lines.push(`## Benchmark Environment`);
  lines.push("");
  lines.push(`- Node.js: ${report.environment.node}`);
  lines.push(`- Platform: ${report.environment.platform} ${report.environment.arch}`);
  lines.push(`- CPU: ${report.environment.cpu}`);
  lines.push(`- Memory total: ${report.environment.memoryTotalMb} MB`);
  return `${lines.join("\n")}\n`;
}

export async function writeReports(report, outDir = "benchmarks/results") {
  await mkdir(outDir, { recursive: true });
  const safeTs = report.startedAt.replace(/[:.]/g, "-");
  const json = JSON.stringify(report, null, 2);
  const md = markdownReport(report);
  const jsonPath = `${outDir}/benchmark-${safeTs}.json`;
  const mdPath = `${outDir}/benchmark-${safeTs}.md`;
  await writeFile(jsonPath, json);
  await writeFile(mdPath, md);
  await writeFile(`${outDir}/latest.json`, json);
  await writeFile(`${outDir}/latest.md`, md);
  return { jsonPath, mdPath, latestJsonPath: `${outDir}/latest.json`, latestMarkdownPath: `${outDir}/latest.md` };
}
