/**
 * @file clamp.js
 * Safe numeric clamping utility with fail-safe NaN, infinite, and inverted boundary handling.
 */

'use strict';

/**
 * Clamps a numeric value within an inclusive range [min, max].
 * Handles non-numeric inputs, NaN, Infinity, and inverted bounds safely.
 *
 * @param {number|string} val - The input value to clamp.
 * @param {number|string} min - Lower boundary.
 * @param {number|string} max - Upper boundary.
 * @param {number|string} [defaultValue=min] - Fallback value if `val` is NaN or non-finite.
 * @returns {number} The clamped numeric value.
 */
export function clamp(val, min, max, defaultValue) {
  let numMin = Number(min);
  let numMax = Number(max);

  if (isNaN(numMin)) {
    numMin = -Infinity;
  }
  if (isNaN(numMax)) {
    numMax = Infinity;
  }

  // Ensure min <= max
  if (numMin > numMax) {
    const temp = numMin;
    numMin = numMax;
    numMax = temp;
  }

  let numVal = Number(val);
  if (isNaN(numVal) || !Number.isFinite(numVal)) {
    const fallback = defaultValue !== undefined ? Number(defaultValue) : numMin;
    numVal = isNaN(fallback) ? (Number.isFinite(numMin) ? numMin : (Number.isFinite(numMax) ? numMax : 0)) : fallback;
  }

  if (numVal < numMin) {
    return numMin;
  }
  if (numVal > numMax) {
    return numMax;
  }

  return numVal;
}
