/** Nearest-rank percentile (p is 0–100). Empty input has no percentile: null. */
export function percentile(values, p) {
  if (!Array.isArray(values) || values.some((value) => !Number.isFinite(value))) {
    throw new TypeError('Percentile values must be an array of finite numbers');
  }
  if (!Number.isFinite(p) || p < 0 || p > 100) {
    throw new RangeError('Percentile must be between 0 and 100');
  }
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
}

const isNonNegative = (value) => Number.isFinite(value) && value >= 0;
const isStatus = (value) => Number.isInteger(value) && value >= 100 && value <= 599;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const distribution = (values) => ({
  p50: percentile(values, 50),
  p95: percentile(values, 95),
  p99: percentile(values, 99)
});

/**
 * Summarize completed requests over the entire measurement window, including drain.
 * Samples: {durationMs, ttfbMs, completedAtMs, statusCode, error, expectedStatus}.
 * error is false or an error string; statusCode/ttfbMs may be null on failure.
 *
 * latencyMs and ttfbMs contain only complete, error-free HTTP responses with the
 * expected 2xx/3xx status. HTTP 4xx/5xx, network errors and incomplete timings fail.
 * Both RPS metrics count ALL completed requests, including errors. statusCounts
 * counts observed HTTP status codes, omitting requests with no response status.
 * Peak uses fixed buckets (100 ms by default); the final partial bucket uses its
 * actual width. Short windows/partial buckets can therefore produce noisy peaks.
 * A completion exactly at elapsedMs belongs to the final bucket, not a new one.
 */
export function summarize(samples, elapsedMs, { bucketMs = 100 } = {}) {
  if (!Array.isArray(samples)) throw new TypeError('Samples must be an array');
  if (!isNonNegative(elapsedMs) || (elapsedMs === 0 && samples.length > 0)) {
    throw new RangeError('Elapsed time must be nonnegative and positive for nonempty samples');
  }
  if (!Number.isFinite(bucketMs) || bucketMs <= 0) {
    throw new RangeError('Bucket width must be positive and finite');
  }

  const durations = [];
  const ttfbs = [];
  const statusCounts = {};
  const buckets = new Map();
  const bucketCount = Math.ceil(elapsedMs / bucketMs);
  let succeeded = 0;

  for (const sample of samples) {
    if (!isRecord(sample) || !isNonNegative(sample.durationMs)
      || !isNonNegative(sample.completedAtMs) || sample.completedAtMs > elapsedMs
      || (sample.ttfbMs !== null && !isNonNegative(sample.ttfbMs))
      || (sample.statusCode !== null && !isStatus(sample.statusCode))
      || !isStatus(sample.expectedStatus)
      || (sample.error !== false && typeof sample.error !== 'string')) {
      throw new TypeError('Sample contains invalid timings, status or error fields');
    }

    if (sample.statusCode !== null) {
      statusCounts[sample.statusCode] = (statusCounts[sample.statusCode] ?? 0) + 1;
    }
    const success = sample.error === false
      && sample.statusCode === sample.expectedStatus
      && sample.statusCode >= 200 && sample.statusCode < 400
      && sample.ttfbMs !== null && sample.ttfbMs <= sample.durationMs;
    if (success) {
      succeeded += 1;
      durations.push(sample.durationMs);
      ttfbs.push(sample.ttfbMs);
    }

    const bucket = Math.min(Math.floor(sample.completedAtMs / bucketMs), bucketCount - 1);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  let peakRps = 0;
  for (const [bucket, count] of buckets) {
    const widthMs = Math.min(bucketMs, elapsedMs - bucket * bucketMs);
    peakRps = Math.max(peakRps, count / (widthMs / 1000));
  }
  const total = samples.length;
  const errors = total - succeeded;
  return {
    total,
    succeeded,
    errors,
    errorRate: total === 0 ? 0 : errors / total,
    latencyMs: distribution(durations),
    ttfbMs: distribution(ttfbs),
    sustainedRps: elapsedMs === 0 ? 0 : total / (elapsedMs / 1000),
    peakRps,
    statusCounts
  };
}

/**
 * Return gate violations, or [] when all endpoints meet their thresholds.
 * results: [{id, ...summarize(...)}]
 * thresholds: { [id]: {p99Ms: finite positive number, maxErrorRate: 0..1} }
 * Missing/unknown endpoint thresholds and fields fail closed, as do absent p99s.
 */
export function evaluateThresholds(results, thresholds) {
  const violations = [];
  if (!Array.isArray(results) || results.length === 0) return ['No endpoint results to evaluate'];
  if (!isRecord(thresholds)) return ['Thresholds must be an endpoint-to-threshold object'];
  const ids = new Set();
  for (const result of results) {
    if (!isRecord(result) || typeof result.id !== 'string' || result.id.length === 0) {
      violations.push('Result is missing a valid endpoint id');
      continue;
    }
    const id = result.id;
    if (ids.has(id)) violations.push(`${id}: duplicate endpoint result`);
    ids.add(id);
    const threshold = Object.hasOwn(thresholds, id) ? thresholds[id] : undefined;
    if (!isRecord(threshold)) {
      violations.push(`${id}: missing or invalid thresholds`);
      continue;
    }
    for (const key of Object.keys(threshold)) {
      if (key !== 'p99Ms' && key !== 'maxErrorRate') {
        violations.push(`${id}: unknown threshold ${key}`);
      }
    }
    const validP99 = Object.hasOwn(threshold, 'p99Ms')
      && Number.isFinite(threshold.p99Ms) && threshold.p99Ms > 0;
    const validErrorRate = Object.hasOwn(threshold, 'maxErrorRate')
      && Number.isFinite(threshold.maxErrorRate)
      && threshold.maxErrorRate >= 0 && threshold.maxErrorRate <= 1;
    if (!validP99) violations.push(`${id}: p99Ms must be positive and finite`);
    if (!validErrorRate) violations.push(`${id}: maxErrorRate must be between 0 and 1`);

    const p99 = result.latencyMs?.p99;
    if (!isNonNegative(p99)) {
      violations.push(`${id}: no valid successful-response p99 measurement`);
    } else if (validP99 && p99 > threshold.p99Ms) {
      violations.push(`${id}: p99 ${p99} ms exceeds ${threshold.p99Ms} ms`);
    }
    if (!isNonNegative(result.errorRate) || result.errorRate > 1) {
      violations.push(`${id}: invalid measured error rate`);
    } else if (validErrorRate && result.errorRate > threshold.maxErrorRate) {
      violations.push(`${id}: error rate ${result.errorRate} exceeds ${threshold.maxErrorRate}`);
    }
  }
  for (const id of Object.keys(thresholds)) {
    if (!ids.has(id)) violations.push(`${id}: threshold has no endpoint result`);
  }
  return violations;
}
