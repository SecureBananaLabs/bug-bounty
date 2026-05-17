import fs from "node:fs";

export function loadThresholds(thresholdsPath) {
  return JSON.parse(fs.readFileSync(thresholdsPath, "utf8"));
}

function routeThresholds(thresholds, routeId) {
  return {
    ...(thresholds.defaults ?? {}),
    ...((thresholds.routes ?? {})[routeId] ?? {})
  };
}

export function evaluateThresholds(results, thresholds) {
  const failures = [];

  for (const result of results) {
    const limits = routeThresholds(thresholds, result.id);
    const p99 = result.metrics.latency.p99;
    const errorRate = result.metrics.errorRate;
    const sustainedRps = result.metrics.rps.sustained;

    if (Number.isFinite(limits.maxP99Ms) && p99 > limits.maxP99Ms) {
      failures.push({
        id: result.id,
        metric: "p99",
        message: `${result.id} p99 ${p99.toFixed(2)}ms exceeded ${limits.maxP99Ms}ms`
      });
    }

    if (Number.isFinite(limits.maxErrorRatePct) && errorRate > limits.maxErrorRatePct) {
      failures.push({
        id: result.id,
        metric: "errorRate",
        message: `${result.id} error rate ${errorRate.toFixed(2)}% exceeded ${limits.maxErrorRatePct}%`
      });
    }

    if (Number.isFinite(limits.minSustainedRps) && sustainedRps < limits.minSustainedRps) {
      failures.push({
        id: result.id,
        metric: "sustainedRps",
        message: `${result.id} sustained RPS ${sustainedRps.toFixed(2)} was below ${limits.minSustainedRps}`
      });
    }
  }

  return failures;
}
