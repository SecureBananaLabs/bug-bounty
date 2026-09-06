/**
 * InRange utility.
 * Checks if number is between start and up to, but not including, end.
 * If end is not specified, it's set to start with start=0.
 * If start is greater than end the params are swapped.
 */

/**
 * Checks if number is between start and up to, but not including, end.
 * @param {number} number The number to check.
 * @param {number} [start=0] The start of the range.
 * @param {number} end The end of the range.
 * @returns {boolean} Returns true if number is in the range, else false.
 */
export function inRange(number, start, end) {
    if (number === undefined || isNaN(number)) {
        return false;
    }

    number = +number;

    if (end === undefined) {
        end = start === undefined ? 0 : +start;
        start = 0;
    } else {
        start = +start;
        end = +end;
    }

    if (isNaN(start) || isNaN(end)) {
        return false;
    }

    const min = Math.min(start, end);
    const max = Math.max(start, end);

    return number >= min && number < max;
}