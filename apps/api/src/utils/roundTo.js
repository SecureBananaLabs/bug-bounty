/**
 * Accurately rounds a number to a specified decimal precision using scientific
 * notation exponent shifting to eliminate binary floating-point rounding drift.
 *
 * @param {number} value - Input numeric value to round
 * @param {number} [precision=0] - Decimal places (positive or negative integer)
 * @returns {number} Rounded number, or NaN for non-finite inputs
 */
export function roundTo(value, precision = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return NaN;
  }

  const p =
    typeof precision === 'number' && Number.isFinite(precision)
      ? Math.trunc(precision)
      : 0;

  if (p === 0) {
    const r = Math.round(value);
    return Object.is(r, -0) ? 0 : r;
  }

  const sign = value < 0 ? -1 : 1;
  const absVal = Math.abs(value);
  const shifted = Number(`${absVal}e${p}`);
  const rounded = Math.round(shifted);
  const result = Number(`${rounded}e${-p}`) * sign;

  return Object.is(result, -0) ? 0 : result;
}

export default roundTo;
