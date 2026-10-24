/**
 * Defensive Numerical Utilities
 * Hardened against NaN propagation (CWE-682), boundary inversion errors,
 * negative zero (-0) erasure, and BigInt interoperability issues.
 *
 * @module utils/numberUtils
 */

/**
 * Checks if a value is a valid finite numeric value (number, numeric string, or BigInt).
 *
 * @param {unknown} val - Input value
 * @returns {boolean}
 */
export function isNumeric(val) {
  if (typeof val === 'number') {
    return Number.isFinite(val);
  }
  if (typeof val === 'bigint') {
    return true;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return false;
    return Number.isFinite(Number(trimmed));
  }
  return false;
}

/**
 * Defensively parses an input value into a finite number, returning a fallback if invalid.
 *
 * @param {unknown} val - Input value to parse
 * @param {number} [fallback=0] - Fallback value if parsing fails or produces non-finite number
 * @returns {number}
 */
export function safeParseNumber(val, fallback = 0) {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : fallback;
  }
  if (typeof val === 'bigint') {
    return Number(val);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return fallback;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : fallback;
  }
  return fallback;
}

/**
 * Clamps a number within inclusive lower and upper bounds.
 *
 * Defensive features:
 * - NaN Propagation Defense (CWE-682): Returns lower bound if input is NaN or unparseable.
 * - Inverted Boundary Normalization: Automatically swaps lower and upper if lower > upper.
 * - Negative Zero (-0) Preservation: Faithfully preserves -0 according to IEEE-754 semantics.
 * - BigInt Support: Supports native BigInt clamping when given BigInt inputs.
 *
 * @template {number|bigint} T
 * @param {T|unknown} number - Value to clamp
 * @param {T|unknown} lower - Lower bound
 * @param {T|unknown} upper - Upper bound
 * @returns {T} Clamped value
 */
export function clamp(number, lower, upper) {
  // BigInt handling
  if (typeof number === 'bigint') {
    let bLower = typeof lower === 'bigint' ? lower : BigInt(safeParseNumber(lower, 0));
    let bUpper = typeof upper === 'bigint' ? upper : BigInt(safeParseNumber(upper, 0));

    // Normalize inverted bounds
    if (bLower > bUpper) {
      const temp = bLower;
      bLower = bUpper;
      bUpper = temp;
    }

    if (number < bLower) return bLower;
    if (number > bUpper) return bUpper;
    return number;
  }

  // Parse numeric values
  const num = typeof number === 'number' ? number : safeParseNumber(number, NaN);
  let low = typeof lower === 'number' ? lower : safeParseNumber(lower, -Infinity);
  let up = typeof upper === 'number' ? upper : safeParseNumber(upper, Infinity);

  // Normalize NaN in bounds
  if (Number.isNaN(low)) low = -Infinity;
  if (Number.isNaN(up)) up = Infinity;

  // Inverted boundary normalization
  if (low > up) {
    const temp = low;
    low = up;
    up = temp;
  }

  // NaN Defense: If input is NaN, return the normalized lower bound (or 0 if lower is -Infinity)
  if (Number.isNaN(num)) {
    return Number.isFinite(low) ? low : (Number.isFinite(up) ? up : 0);
  }

  // Negative zero (-0) preservation check
  if (Object.is(num, -0)) {
    if (low <= 0 && up >= 0) {
      return -0;
    }
    if (low > 0) return low;
    if (up < 0) return up;
  }

  if (num < low) return low;
  if (num > up) return up;
  return num;
}

/**
 * Checks if a number falls within a given range.
 *
 * Range is half-open `[start, end)` by default (standard Lodash convention),
 * or fully closed `[start, end]` when `options.inclusive` is true.
 *
 * Defensive features:
 * - Single argument range: `inRange(num, end)` assumes `start = 0`.
 * - Inverted boundary normalization: Automatically handles `start > end`.
 * - NaN Defense: Returns `false` if any argument evaluates to NaN.
 * - BigInt Support: Supports BigInt comparisons seamlessly.
 *
 * @param {number|bigint|unknown} number - Number to check
 * @param {number|bigint|unknown} start - Range start (or range end if `end` omitted)
 * @param {number|bigint|unknown|object} [end] - Range end (or options if 3rd arg is object)
 * @param {object} [options={}] - Range options
 * @param {boolean} [options.inclusive=false] - Whether range is inclusive of upper bound
 * @returns {boolean}
 */
export function inRange(number, start, end, options) {
  let rStart = start;
  let rEnd = end;
  let opts = options;

  if (end !== null && typeof end === 'object') {
    opts = end;
    rEnd = undefined;
  }

  // Single bound: inRange(x, 5) -> range [0, 5)
  if (rEnd === undefined) {
    rEnd = rStart;
    rStart = 0;
  }

  opts = opts || {};
  const { inclusive = false } = opts;

  // BigInt handling
  if (typeof number === 'bigint') {
    let bStart = typeof rStart === 'bigint' ? rStart : BigInt(safeParseNumber(rStart, 0));
    let bEnd = typeof rEnd === 'bigint' ? rEnd : BigInt(safeParseNumber(rEnd, 0));

    if (bStart > bEnd) {
      const temp = bStart;
      bStart = bEnd;
      bEnd = temp;
    }

    return inclusive
      ? number >= bStart && number <= bEnd
      : number >= bStart && number < bEnd;
  }

  const num = typeof number === 'number' ? number : safeParseNumber(number, NaN);
  let s = typeof rStart === 'number' ? rStart : safeParseNumber(rStart, NaN);
  let e = typeof rEnd === 'number' ? rEnd : safeParseNumber(rEnd, NaN);

  // NaN Defense: Reject if any parameter is NaN
  if (Number.isNaN(num) || Number.isNaN(s) || Number.isNaN(e)) {
    return false;
  }

  // Inverted boundary normalization
  if (s > e) {
    const temp = s;
    s = e;
    e = temp;
  }

  return inclusive
    ? num >= s && num <= e
    : num >= s && num < e;
}

/**
 * Accurately rounds a number to specified decimal places without floating point drift.
 *
 * @param {number} number - Number to round
 * @param {number} [decimals=0] - Decimal places
 * @returns {number}
 */
export function roundTo(number, decimals = 0) {
  if (typeof number !== 'number' || !Number.isFinite(number)) {
    return safeParseNumber(number, 0);
  }
  const d = Math.max(0, Math.min(20, Math.floor(safeParseNumber(decimals, 0))));
  if (d === 0) {
    const rounded = Math.round(number);
    return Object.is(number, -0) && rounded === 0 ? -0 : rounded;
  }
  const factor = 10 ** d;
  const rounded = Math.round((number + Number.EPSILON) * factor) / factor;
  return Object.is(number, -0) && rounded === 0 ? -0 : rounded;
}

/**
 * Linearly interpolates between two numbers with optional bounded clamping.
 *
 * @param {number} start - Range start
 * @param {number} end - Range end
 * @param {number} t - Interpolation factor (typically 0.0 - 1.0)
 * @param {boolean} [bounded=true] - Whether to clamp t to [0, 1]
 * @returns {number}
 */
export function lerp(start, end, t, bounded = true) {
  const s = safeParseNumber(start, 0);
  const e = safeParseNumber(end, 0);
  let factor = safeParseNumber(t, 0);
  if (bounded) {
    factor = clamp(factor, 0, 1);
  }
  return s + (e - s) * factor;
}

const numberUtils = {
  clamp,
  inRange,
  isNumeric,
  safeParseNumber,
  roundTo,
  lerp,
};

export default numberUtils;
