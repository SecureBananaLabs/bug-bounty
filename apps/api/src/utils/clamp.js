/**
 * Numeric clamp utility.
 * Clamps a number within the inclusive lower and upper bounds.
 */

/**
 * Clamps number within the inclusive lower and upper bounds.
 * @param {number} number The number to clamp.
 * @param {number} lower The lower bound.
 * @param {number} upper The upper bound.
 * @returns {number} Returns the clamped number.
 */
export function clamp(number, lower, upper) {
    if (number === undefined) return NaN;
    
    number = +number;
    lower = +lower;
    upper = +upper;

    if (isNaN(number)) {
        return NaN;
    }

    if (lower === undefined || isNaN(lower)) {
        lower = 0;
    }

    if (upper === undefined || isNaN(upper)) {
        upper = 0;
    }

    // Support cases where lower > upper gracefully
    const min = Math.min(lower, upper);
    const max = Math.max(lower, upper);

    return Math.min(Math.max(number, min), max);
}