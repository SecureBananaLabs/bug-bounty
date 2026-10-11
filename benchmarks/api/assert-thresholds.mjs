#!/usr/bin/env node

import { readFile } from "node:fs/promises";

function parseArgs(argv) {
  const options = {
    report: "benchmarks/results/api-latest.json",
    thresholds: "benchmarks/thresholds.json"
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];

    if (arg === "--report") {
      options.report = value;
      i += 1;
    } else if (arg === "--thresholds") {
      options.thresholds = value;
      i += 1;
    } else if (arg === "--help") {
      console.log(`Usage: node benchmarks/api/assert-thresholds.mjs [options]

Options:
  --report <path>       Benchmark JSON report. Default: benchmarks/results/api-latest.json
  --thresholds <path>   Threshold JSON file. Default: benchmarks/thresholds.json
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function thresholdFor(thresholds, endpointName) {
  return {
    ...thresholds.defaults,
    ...(thresholds.endpoints?.[endpointName] ?? {})
  };
}

function mainFailures(report, thresholds) {
  const failures = [];

  for (const endpoint of report.endpoints) {
    const threshold = thresholdFor(thresholds, endpoint.name);

    if (endpoint.latencyMs.p99 > threshold.p99LatencyMs) {
      failures.push(
        `${endpoint.name} p99 ${endpoint.latencyMs.p99}ms exceeded ${threshold.p99LatencyMs}ms`
      );
    }

    if (endpoint.errorRate > threshold.errorRate) {
      failures.push(
        `${endpoint.name} error rate ${formatPercent(endpoint.errorRate)} exceeded ${formatPercent(
          threshold.errorRate
        )}`
      );
    }
  }

  return failures;
}

function formatPercent(value) {
  return `${Math.round(value * 10_000) / 100}%`;
}

const options = parseArgs(process.argv.slice(2));
const report = await readJson(options.report);
const thresholds = await readJson(options.thresholds);
const failures = mainFailures(report, thresholds);

if (failures.length > 0) {
  console.error("Benchmark threshold failures:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Benchmark thresholds passed for ${report.endpoints.length} endpoints using ${options.thresholds}`
);
