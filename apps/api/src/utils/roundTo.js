/**
 * Round a number to a given precision, avoiding floating-point bugs.
 * Uses epsilon-corrected exponent shifting for mathematically sound rounding.
 * @param {number} value - The value to round
 * @param {number} precision - Decimal places (negative = round to 10s, 100s, etc.)
 * @returns {number}
 */
export function roundTo(value, precision = 0) {
  if (!Number.isFinite(value)) return NaN;
  const p = Math.max(-20, Math.min(20, Math.floor(precision)));
  const factor = Math.pow(10, p);

  if (p > 0) {
    // For decimal precision, add tiny epsilon to correct floating-point
    // representation errors (e.g. 1.005 * 100 = 100.49999... should round to 101)
    const eps = Math.pow(10, -(p + 10));
    return Math.round((value + eps) * factor) / factor;
  }

  return Math.round(value * factor) / factor;
}
