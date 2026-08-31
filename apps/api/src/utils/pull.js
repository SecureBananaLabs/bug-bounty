/**
 * Pull and PullAll utilities.
 * Removes all given values from array using in-place mutation.
 */

/**
 * Removes all provided values from array in-place.
 * @param {Array} array The array to modify.
 * @param {...*} values The values to remove.
 * @returns {Array} Returns array.
 */
export function pull(array, ...values) {
    return pullAll(array, values);
}

/**
 * Removes all values in the values array from array in-place.
 * @param {Array} array The array to modify.
 * @param {Array} values The values to remove.
 * @returns {Array} Returns array.
 */
export function pullAll(array, values) {
    if (!Array.isArray(array) || !Array.isArray(values) || values.length === 0) {
        return array;
    }

    const removeSet = new Set(values);
    let writeIndex = 0;

    for (let i = 0; i < array.length; i++) {
        if (!removeSet.has(array[i])) {
            array[writeIndex++] = array[i];
        }
    }

    array.length = writeIndex;
    return array;
}