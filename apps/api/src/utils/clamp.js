/**
 * Defensively clamps a numeric value within inclusive minimum and maximum bounds.
 * Automatically normalizes inverted bounds (min > max), handles non-numeric
 * or NaN inputs defensively, and supports infinite boundaries.
 *
 * @param {number} val - The numeric value to clamp.
 * @param {number} min - Lower boundary.
 * @param {number} max - Upper boundary.
 * @returns {number} The clamped value.
 */
export function clamp(val, min, max) {
  let lower = typeof min === 'number' && !Number.isNaN(min) ? min : -Infinity;
  let upper = typeof max === 'number' && !Number.isNaN(max) ? max : Infinity;

  // Swap if bounds are inverted
  if (lower > upper) {
    const temp = lower;
    lower = upper;
    upper = temp;
  }

  const num = typeof val === 'number' && !Number.isNaN(val) ? val : lower;

  if (num < lower) return lower;
  if (num > upper) return upper;
  return num;
}

export default clamp;
