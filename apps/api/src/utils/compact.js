/**
 * Compact utility.
 * Creates an array with all falsy values removed.
 * The values false, null, 0, "", undefined, and NaN are falsy.
 */

/**
 * Creates an array with all falsy values removed.
 * @param {Array} array The array to compact.
 * @returns {Array} Returns the new array of filtered values.
 */
export function compact(array) {
    if (!Array.isArray(array)) {
        return [];
    }

    const result = [];
    for (const value of array) {
        if (value) {
            result.push(value);
        }
    }

    return result;
}