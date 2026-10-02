import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function percentile(values, p) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );

  return sorted[index];
}

function mean(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarizeSamples(samples, elapsedMs = 0) {
  const ttfb = samples.map((sample) => sample.ttfbMs);
  const latency = samples.map((sample) => sample.totalMs);
  const errors = samples.filter((sample) => sample.error).length;

  return {
    count: samples.length,
    errorCount: errors,
    errorRate: samples.length ? errors / samples.length : 0,
    ttfb: {
      min: samples.length ? Math.min(...ttfb) : 0,
      avg: mean(ttfb),
      p50: percentile(ttfb, 50),
      p95: percentile(ttfb, 95),
      p99: percentile(ttfb, 99),
      max: samples.length ? Math.max(...ttfb) : 0
    },
    latency: {
      min: samples.length ? Math.min(...latency) : 0,
      avg: mean(latency),
      p50: percentile(latency, 50),
      p95: percentile(latency, 95),
      p99: percentile(latency, 99),
      max: samples.length ? Math.max(...latency) : 0
    },
    rps: elapsedMs > 0 ? (samples.length / elapsedMs) * 1000 : 0,
    wallClockMs: elapsedMs
  };
}

function formatMs(value) {
  return `${value.toFixed(1)}ms`;
}

function formatRate(value) {
  return `${value.toFixed(2)}/s`;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

export function buildReport(payload) {
  const lines = [
    `# Benchmark Report`,
    ``,
    `- Profile: \`${payload.profile}\``,
    `- Generated: \`${payload.generatedAt}\``,
    `- Base URL: \`${payload.baseUrl}\``,
    `- Sample count: \`${payload.sampleCount}\``,
    `- Warmup count: \`${payload.warmupCount}\``,
    `- Concurrency: \`${payload.concurrency}\``,
    ``,
    `## Overall`,
    ``,
    `- Requests: \`${payload.overall.count}\``,
    `- Error rate: \`${formatPercent(payload.overall.errorRate)}\``,
    `- RPS: \`${formatRate(payload.overall.rps)}\``,
    `- TTFB p50/p95/p99: \`${formatMs(payload.overall.ttfb.p50)}\` / \`${formatMs(payload.overall.ttfb.p95)}\` / \`${formatMs(payload.overall.ttfb.p99)}\``,
    `- Latency p50/p95/p99: \`${formatMs(payload.overall.latency.p50)}\` / \`${formatMs(payload.overall.latency.p95)}\` / \`${formatMs(payload.overall.latency.p99)}\``,
    ``,
    `## Routes`,
    ``,
    `| Route | Requests | Error rate | RPS | TTFB p95 | Latency p95 |`,
    `| --- | ---: | ---: | ---: | ---: | ---: |`
  ];

  for (const route of payload.routes) {
    lines.push(
      `| \`${route.label}\` | ${route.metrics.count} | ${formatPercent(route.metrics.errorRate)} | ${formatRate(route.metrics.rps)} | ${formatMs(route.metrics.ttfb.p95)} | ${formatMs(route.metrics.latency.p95)} |`
    );
  }

  lines.push(``);
  lines.push(`## Thresholds`);
  lines.push(``);
  lines.push(`- Smoke profile thresholds are loaded from \`benchmarks/thresholds.json\`.`);

  return lines.join("\n");
}

export function buildJson(payload) {
  return JSON.stringify(payload, null, 2);
}

export function writeResultsFiles({
  resultsDir,
  baseName,
  markdown,
  json
}) {
  return Promise.all([
    mkdir(resultsDir, { recursive: true }),
    writeFile(path.join(resultsDir, `${baseName}.md`), markdown),
    writeFile(path.join(resultsDir, `${baseName}.json`), json),
    writeFile(path.join(resultsDir, "latest.md"), markdown),
    writeFile(path.join(resultsDir, "latest.json"), json)
  ]);
}

export { summarizeSamples };
