/**
 * Difference utility.
 * Creates an array of array values not included in the other given arrays.
 * The order and references of result values are determined by the first array.
 */

/**
 * Creates an array of array values not included in the other given arrays.
 * @param {Array} array The array to inspect.
 * @param {...Array} [values] The values to exclude.
 * @returns {Array} Returns the new array of filtered values.
 */
export function difference(array, ...values) {
    if (!Array.isArray(array)) {
        return [];
    }

    const excludeSet = new Set();
    for (const valArray of values) {
        if (Array.isArray(valArray)) {
            for (const item of valArray) {
                excludeSet.add(item);
            }
        }
    }

    const result = [];
    for (const item of array) {
        if (!excludeSet.has(item)) {
            result.push(item);
        }
    }

    return result;
}