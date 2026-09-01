/**
 * Accurate decimal precision rounding helper using exponential notation.
 * Avoids IEEE 754 floating point precision inaccuracies (e.g. 1.005 -> 1.01).
 */

/**
 * Rounds a number to a specified number of decimal places (symmetric half-up rounding).
 * @param {number|string} value The number to round
 * @param {number} [precision=0] Decimal precision (positive for decimals, negative for tens/hundreds)
 * @returns {number} The accurately rounded number
 */
export function roundTo(value, precision = 0) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
        return Number.NaN;
    }

    const prec = Math.trunc(Number(precision) || 0);
    if (num === 0) {
        return 0;
    }

    const sign = num < 0 ? -1 : 1;
    const absNum = Math.abs(num);

    // Use exponential notation on absolute value to avoid IEEE-754 precision and negative half-rounding pitfalls
    const [mantissa, exponent = "0"] = absNum.toString().split("e");
    const shifted = `${mantissa}e${Number(exponent) + prec}`;
    const rounded = Math.round(Number(shifted));
    const [roundedMantissa, roundedExponent = "0"] = rounded.toString().split("e");
    const result = Number(`${roundedMantissa}e${Number(roundedExponent) - prec}`);

    return sign * result;
}