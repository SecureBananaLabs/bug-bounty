/**
 * Take and TakeRight utilities.
 * Creates a slice of array with n elements taken from the beginning or end.
 */

/**
 * Creates a slice of array with n elements taken from the beginning.
 * @param {Array} array The array to query.
 * @param {number} [n=1] The number of elements to take.
 * @returns {Array} Returns the slice of array.
 */
export function take(array, n = 1) {
    if (!Array.isArray(array) || array.length === 0 || n <= 0) {
        return [];
    }
    const count = Math.min(Math.floor(n), array.length);
    return array.slice(0, count);
}

/**
 * Creates a slice of array with n elements taken from the end.
 * @param {Array} array The array to query.
 * @param {number} [n=1] The number of elements to take.
 * @returns {Array} Returns the slice of array.
 */
export function takeRight(array, n = 1) {
    if (!Array.isArray(array) || array.length === 0 || n <= 0) {
        return [];
    }
    const count = Math.min(Math.floor(n), array.length);
    return array.slice(array.length - count);
}