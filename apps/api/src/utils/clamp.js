/**
 * Clamps a number within the inclusive lower and upper bounds.
 * @param {unknown} val - Input value
 * @param {number} min - Lower bound
 * @param {number} max - Upper bound
 * @param {number} [defaultValue=min] - Fallback value if val cannot be parsed
 * @returns {number} Clamped numeric value
 */
export function clamp(val, min, max, defaultValue = min) {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  const num = Number(val);
  if (!Number.isFinite(num)) {
    return lower <= defaultValue && defaultValue <= upper ? defaultValue : lower;
  }

  return Math.min(Math.max(num, lower), upper);
}
