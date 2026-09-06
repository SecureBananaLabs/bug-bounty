/**
 * Range and RangeRight utilities.
 * Creates an array of numbers progressing from start up to, but not including, end.
 */

function baseRange(start, end, step, fromRight) {
    let index = -1;
    let length = Math.max(Math.ceil((end - start) / (step || 1)), 0);
    const result = new Array(length);

    while (length--) {
        result[fromRight ? length : ++index] = start;
        start += step;
    }

    return result;
}

function createRange(fromRight) {
    return function (start, end, step) {
        if (end === undefined) {
            end = start;
            start = 0;
        }
        start = Number(start) || 0;
        end = Number(end) || 0;

        if (step === undefined) {
            step = start < end ? 1 : -1;
        } else {
            step = Number(step) || 0;
        }

        return baseRange(start, end, step, fromRight);
    };
}

/**
 * Creates an array of numbers progressing from start up to, but not including, end.
 * @param {number} [start=0] The start of the range.
 * @param {number} end The end of the range.
 * @param {number} [step=1] The value to step by.
 * @returns {Array} Returns the range of numbers.
 */
export const range = createRange(false);

/**
 * This method is like range except that it populates values in descending order.
 * @param {number} [start=0] The start of the range.
 * @param {number} end The end of the range.
 * @param {number} [step=1] The value to step by.
 * @returns {Array} Returns the range of numbers.
 */
export const rangeRight = createRange(true);