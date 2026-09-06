/**
 * Accurately rounds a number to a specified decimal precision using scientific exponent shifting.
 * @param {number} value - Input number
 * @param {number} [precision=0] - Decimal places to round to
 * @returns {number} Rounded number
 */
export function roundTo(value, precision = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return NaN;
  }

  const p = typeof precision === 'number' && Number.isFinite(precision) ? Math.floor(precision) : 0;
  if (p === 0) {
    return Math.round(value);
  }

  // Shift using exponential notation to avoid binary floating-point rounding errors
  const [mantissa, exponent] = `${value}e`.split('e');
  const shifted = Math.round(Number(`${mantissa}e${Number(exponent) + p}`));

  const [resMantissa, resExponent] = `${shifted}e`.split('e');
  return Number(`${resMantissa}e${Number(resExponent) - p}`);
}
