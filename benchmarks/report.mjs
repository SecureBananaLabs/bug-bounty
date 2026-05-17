import fs from "node:fs/promises";
import path from "node:path";

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function safeTimestamp(value) {
  return value.replace(/[:.]/g, "-");
}

export function renderMarkdownReport(report) {
  const lines = [
    `# API Benchmark Report (${report.mode})`,
    "",
    `Generated: ${report.generatedAt}`,
    `Target: ${report.target}`,
    `Node: ${report.environment.node}`,
    `Platform: ${report.environment.platform} ${report.environment.release}`,
    `CPU: ${report.environment.cpu} (${report.environment.logicalCores} logical cores)`,
    `Memory: ${report.environment.totalMemoryMb} MB total`,
    `Load: ${report.config.connections} connection(s), ${report.config.requests} request(s) per endpoint`,
    "",
    "| Endpoint | Method | Expected | p50 ms | p95 ms | p99 ms | TTFB p50 ms | TTFB p95 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error % |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const result of report.results) {
    lines.push(
      [
        `| ${result.id}`,
        result.method,
        result.expectedStatus.join(", "),
        formatNumber(result.metrics.latency.p50),
        formatNumber(result.metrics.latency.p95),
        formatNumber(result.metrics.latency.p99),
        formatNumber(result.metrics.ttfb.p50),
        formatNumber(result.metrics.ttfb.p95),
        formatNumber(result.metrics.ttfb.p99),
        formatNumber(result.metrics.rps.sustained),
        formatNumber(result.metrics.rps.peak),
        `${formatNumber(result.metrics.errorRate)} |`
      ].join(" | ")
    );
  }

  lines.push("", "## Regression Gate", "");

  if (report.thresholdFailures.length === 0) {
    lines.push("Passed: all endpoints stayed within configured thresholds.");
  } else {
    lines.push("Failed:");
    for (const failure of report.thresholdFailures) {
      lines.push(`- ${failure.message}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export async function writeReports(report, resultsDir) {
  await fs.mkdir(resultsDir, { recursive: true });

  const markdown = renderMarkdownReport(report);
  const timestamp = safeTimestamp(report.generatedAt);
  const jsonPath = path.join(resultsDir, `${timestamp}.json`);
  const markdownPath = path.join(resultsDir, `${timestamp}.md`);
  const latestJsonPath = path.join(resultsDir, "latest.json");
  const latestMarkdownPath = path.join(resultsDir, "latest.md");

  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, markdown);
  await fs.writeFile(latestJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(latestMarkdownPath, markdown);

  return {
    jsonPath,
    markdownPath,
    latestJsonPath,
    latestMarkdownPath
  };
}
