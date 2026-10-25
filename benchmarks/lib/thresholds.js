import { readFileSync } from "node:fs";

/**
 * Merge the default threshold with an endpoint-specific override.
 *
 * @param {object} thresholds parsed thresholds.json
 * @param {string} key "METHOD /route"
 */
export function resolveThreshold(thresholds, key) {
  return {
    ...thresholds.default,
    ...(thresholds.endpoints?.[key] ?? {})
  };
}

/**
 * Compare benchmark results against the reviewable regression gate.
 *
 * @param {Array<{key:string, latency:{p99:number|null}, errorRatePct:number}>} results
 * @param {object} thresholds parsed thresholds.json
 * @returns {{passed:boolean, violations:Array<object>}}
 */
export function evaluateThresholds(results, thresholds) {
  const violations = [];

  for (const result of results) {
    const threshold = resolveThreshold(thresholds, result.key);

    if (
      typeof threshold.p99Ms === "number" &&
      result.latency.p99 !== null &&
      result.latency.p99 > threshold.p99Ms
    ) {
      violations.push({
        key: result.key,
        metric: "p99",
        actual: result.latency.p99,
        limit: threshold.p99Ms,
        unit: "ms"
      });
    }

    if (typeof threshold.errorRatePct === "number" && result.errorRatePct > threshold.errorRatePct) {
      violations.push({
        key: result.key,
        metric: "errorRate",
        actual: result.errorRatePct,
        limit: threshold.errorRatePct,
        unit: "%"
      });
    }
  }

  return { passed: violations.length === 0, violations };
}

/**
 * Load and validate thresholds.json. Throws with file context on malformed input.
 *
 * @param {string} path
 */
export function loadThresholds(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(`Unable to read thresholds file at ${path}: ${error.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in thresholds file at ${path}: ${error.message}`);
  }

  if (!parsed.default || typeof parsed.default.p99Ms !== "number") {
    throw new Error(`Thresholds file at ${path} must define default.p99Ms`);
  }

  return parsed;
}
