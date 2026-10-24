/**
 * Safely clamps a numeric value within inclusive minimum and maximum bounds.
 *
 * Guarantees bounded outputs for NaN, infinite, non-numeric,
 * or inverted min/max inputs.
 *
 * @param {number|string|any} val - The input value to clamp.
 * @param {number} [min=-Infinity] - The inclusive lower bound.
 * @param {number} [max=Infinity] - The inclusive upper bound.
 * @param {number} [defaultValue=0] - Fallback value if val cannot be resolved to a valid number.
 * @returns {number} The clamped numeric value.
 */
export function clamp(val, min = -Infinity, max = Infinity, defaultValue = 0) {
  let lower = typeof min === "number" && !Number.isNaN(min) ? min : -Infinity;
  let upper = typeof max === "number" && !Number.isNaN(max) ? max : Infinity;

  // Handle inverted min/max
  if (lower > upper) {
    const temp = lower;
    lower = upper;
    upper = temp;
  }

  let num;
  if (typeof val === "number") {
    num = val;
  } else if (typeof val === "string" && val.trim() !== "") {
    num = Number(val);
  } else {
    num = NaN;
  }

  if (Number.isNaN(num)) {
    let fallback = typeof defaultValue === "number" ? defaultValue : Number(defaultValue);
    if (Number.isNaN(fallback)) {
      fallback = Number.isFinite(lower) ? lower : (Number.isFinite(upper) ? upper : 0);
    }
    num = fallback;
  }

  if (num < lower) {
    return lower;
  }
  if (num > upper) {
    return upper;
  }

  return num;
}

export default clamp;
