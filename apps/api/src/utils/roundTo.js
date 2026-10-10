/**
 * Accurately rounds a number to a specified number of decimal places,
 * mitigating JavaScript floating-point representation anomalies.
 *
 * @param {number|string} value - The numeric value to round.
 * @param {number} [decimals=0] - Number of decimal places (integer >= 0).
 * @param {('half-up'|'half-even'|'ceil'|'floor'|'trunc')} [mode='half-up'] - Rounding mode.
 * @returns {number} The accurately rounded number.
 */
export function roundTo(value, decimals = 0, mode = 'half-up') {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return num; // Handles NaN, Infinity, -Infinity
  }

  const d = Math.trunc(decimals);
  if (d < 0) {
    throw new RangeError('decimals must be a non-negative integer');
  }

  if (d === 0) {
    return roundInt(num, mode);
  }

  // Use exponential string notation to avoid floating point representation pitfalls (e.g. 1.005e2 = 100.5)
  const parts = num.toString().split('e');
  const exp = parts[1] ? Number(parts[1]) + d : d;
  const shifted = Number(parts[0] + 'e' + exp);

  const roundedShifted = roundInt(shifted, mode);

  const backParts = roundedShifted.toString().split('e');
  const backExp = backParts[1] ? Number(backParts[1]) - d : -d;
  return Number(backParts[0] + 'e' + backExp);
}

function roundInt(num, mode) {
  switch (mode) {
    case 'ceil':
      return Math.ceil(num);
    case 'floor':
      return Math.floor(num);
    case 'trunc':
      return Math.trunc(num);
    case 'half-even': { // Banker's rounding
      const floor = Math.floor(num);
      const diff = num - floor;
      if (diff < 0.5) return floor;
      if (diff > 0.5) return floor + 1;
      return floor % 2 === 0 ? floor : floor + 1;
    }
    case 'half-up':
    default:
      return Math.round(num);
  }
}
