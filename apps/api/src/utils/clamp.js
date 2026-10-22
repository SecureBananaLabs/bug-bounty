/**
 * Safely parses and validates a finite number.
 * Returns null for non-numeric types, non-finite values (NaN, Infinity, -Infinity),
 * empty/whitespace strings, booleans, arrays, objects, etc.
 *
 * @param {unknown} val - The value to parse
 * @returns {number|null} The parsed finite number, or null if invalid
 */
export function toFiniteNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) ? (val === 0 ? 0 : val) : null;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? (num === 0 ? 0 : num) : null;
  }
  if (typeof val === 'object') {
    if (val instanceof Number || val instanceof String) {
      return toFiniteNumber(val.valueOf());
    }
  }
  return null;
}

/**
 * Checks whether an input value can be safely parsed into a finite number.
 *
 * @param {unknown} val - Value to check
 * @returns {boolean} True if the value is a valid finite number or numeric string
 */
export function isNumeric(val) {
  return toFiniteNumber(val) !== null;
}

/**
 * Resolves and auto-swaps bounds to ensure lower <= upper.
 *
 * @param {unknown} min - Proposed minimum bound
 * @param {unknown} max - Proposed maximum bound
 * @returns {{ lower: number, upper: number }} Normalized lower and upper bounds
 */
function resolveBounds(min, max) {
  let lower = toFiniteNumber(min);
  let upper = toFiniteNumber(max);

  if (lower === null && upper === null) {
    lower = 0;
    upper = 1;
  } else if (lower === null) {
    lower = upper < 0 ? upper : 0;
  } else if (upper === null) {
    upper = lower > 1 ? lower : 1;
  }

  // Auto-swap inverted bounds (min > max)
  if (lower > upper) {
    const tmp = lower;
    lower = upper;
    upper = tmp;
  }

  return { lower, upper };
}

/**
 * Clamps a numeric value within inclusive [min, max] bounds.
 *
 * - Inclusive numeric clamp.
 * - Auto-swaps inverted bounds (min > max).
 * - Safely parses numeric strings.
 * - Handles NaN, Infinity, -Infinity, null, undefined, and non-numeric types
 *   by returning safely clamped defaultValue.
 *
 * @param {unknown} val - Value to clamp
 * @param {unknown} [min=0] - Lower bound (inclusive)
 * @param {unknown} [max=1] - Upper bound (inclusive)
 * @param {unknown} [defaultValue=min] - Fallback value if val is non-numeric/non-finite
 * @returns {number} Clamped numeric value
 */
export function clamp(val, min = 0, max = 1, defaultValue = min) {
  const { lower, upper } = resolveBounds(min, max);

  const parsedVal = toFiniteNumber(val);
  if (parsedVal === null) {
    const def = defaultValue !== undefined ? defaultValue : min;
    let parsedDef = toFiniteNumber(def);
    if (parsedDef === null) {
      parsedDef = lower;
    }
    if (parsedDef < lower) return lower;
    if (parsedDef > upper) return upper;
    return parsedDef === 0 ? 0 : parsedDef;
  }

  if (parsedVal < lower) return lower;
  if (parsedVal > upper) return upper;
  return parsedVal === 0 ? 0 : parsedVal;
}

/**
 * Clamps a value strictly between 0 and 1 inclusive.
 * Equivalent to clamp(val, 0, 1, 0).
 *
 * @param {unknown} val - Value to clamp
 * @returns {number} Value clamped between 0 and 1
 */
export function clamp01(val) {
  return clamp(val, 0, 1, 0);
}

/**
 * Clamps a numeric value within inclusive bounds and rounds the result to an integer.
 * Also guarantees the integer result remains within [min, max] bounds.
 *
 * @param {unknown} val - Value to clamp
 * @param {unknown} [min=0] - Lower bound
 * @param {unknown} [max=1] - Upper bound
 * @param {unknown} [defaultValue=min] - Fallback value if val is non-numeric
 * @returns {number} Clamped integer value
 */
export function clampInt(val, min = 0, max = 1, defaultValue = min) {
  const { lower, upper } = resolveBounds(min, max);
  const clamped = clamp(val, lower, upper, defaultValue);
  let rounded = Math.round(clamped);

  const intMin = Math.ceil(lower);
  const intMax = Math.floor(upper);
  if (intMin <= intMax) {
    if (rounded < intMin) rounded = intMin;
    if (rounded > intMax) rounded = intMax;
  }

  return rounded === 0 ? 0 : rounded;
}

clamp.clamp01 = clamp01;
clamp.clampInt = clampInt;
clamp.toFiniteNumber = toFiniteNumber;
clamp.isNumeric = isNumeric;

export default clamp;
