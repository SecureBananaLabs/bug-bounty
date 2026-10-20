/** Numeric helpers shared by the load runner and the TTFB probe. */

export function round(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Nearest-rank percentile over an already sorted array.
 *
 * @param {number[]} sorted
 * @param {number} p percentile in the range 0-100
 * @returns {number|null}
 */
export function percentileSorted(sorted, p) {
  if (sorted.length === 0) return null;

  const rank = Math.ceil((p / 100) * sorted.length);
  const index = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[index];
}

/**
 * Summarise a list of millisecond measurements.
 *
 * @param {number[]} values
 * @returns {{samples:number,min:number|null,mean:number|null,p50:number|null,p95:number|null,p99:number|null,max:number|null}}
 */
export function summarize(values) {
  if (values.length === 0) {
    return { samples: 0, min: null, mean: null, p50: null, p95: null, p99: null, max: null };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);

  return {
    samples: sorted.length,
    min: round(sorted[0]),
    mean: round(sum / sorted.length),
    p50: round(percentileSorted(sorted, 50)),
    p95: round(percentileSorted(sorted, 95)),
    p99: round(percentileSorted(sorted, 99)),
    max: round(sorted[sorted.length - 1])
  };
}

/**
 * Error rate over completed plus failed requests.
 *
 * @param {{completed:number, non2xx:number, errors:number, timeouts:number}} counts
 * @returns {number} percentage, 0-100
 */
export function errorRate({ completed, non2xx, errors, timeouts }) {
  const transportFailures = errors + timeouts;
  const attempted = completed + transportFailures;
  if (attempted === 0) return 0;

  return round(((non2xx + transportFailures) / attempted) * 100);
}
