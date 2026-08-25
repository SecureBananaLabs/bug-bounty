/**
 * Safely clamps a numeric value within inclusive bounds.
 * Handles NaN, Infinity, and inverted min/max by returning defaultValue.
 *
 * @param {number} val - The value to clamp
 * @param {number} min - Minimum inclusive bound
 * @param {number} max - Maximum inclusive bound
 * @param {number} [defaultValue=0] - Fallback when val is not a finite number or bounds are invalid
 * @returns {number} Clamped value or defaultValue
 */
function clamp(val, min, max, defaultValue = 0) {
  // Validate bounds first
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return defaultValue;
  }

  // Handle inverted bounds
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  // Validate input value
  if (!Number.isFinite(val)) {
    return defaultValue;
  }

  // Clamp to bounds
  if (val < lower) return lower;
  if (val > upper) return upper;
  return val;
}

module.exports = { clamp };
