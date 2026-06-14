import { readFileSync } from "node:fs";

export function loadThresholds(path = "benchmarks/thresholds.json") {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function evaluateThresholds(report, thresholds) {
  const modeDefaults = thresholds[report.mode] ?? {};
  const globalDefaults = thresholds.default ?? {};
  const failures = [];
  for (const scenario of report.scenarios) {
    const specific = thresholds.scenarios?.[scenario.name] ?? {};
    const merged = { ...globalDefaults, ...modeDefaults, ...specific };
    if (merged.maxErrorRate !== undefined && scenario.summary.errorRate > merged.maxErrorRate) {
      failures.push(`${scenario.name}: error rate ${scenario.summary.errorRate.toFixed(4)} > ${merged.maxErrorRate}`);
    }
    if (merged.maxP99Ms !== undefined && scenario.summary.latencyMs.p99 > merged.maxP99Ms) {
      failures.push(`${scenario.name}: p99 ${scenario.summary.latencyMs.p99.toFixed(2)}ms > ${merged.maxP99Ms}ms`);
    }
    if (merged.minRequestsPerSecond !== undefined && scenario.summary.requestsPerSecond < merged.minRequestsPerSecond) {
      failures.push(`${scenario.name}: RPS ${scenario.summary.requestsPerSecond.toFixed(2)} < ${merged.minRequestsPerSecond}`);
    }
  }
  return { passed: failures.length === 0, failures };
}
