/**
 * Zip and Unzip utilities.
 * Creates an array of grouped elements based on their positions.
 */

/**
 * Creates an array of grouped elements, the first of which contains the first elements of the given arrays, etc.
 * @param {...Array} arrays The arrays to process.
 * @returns {Array[]} Returns the new array of grouped elements.
 */
export function zip(...arrays) {
    if (arrays.length === 0) {
        return [];
    }

    const validArrays = arrays.map((a) => (Array.isArray(a) ? a : []));
    let maxLength = 0;
    for (const arr of validArrays) {
        if (arr.length > maxLength) {
            maxLength = arr.length;
        }
    }

    const result = new Array(maxLength);
    for (let i = 0; i < maxLength; i++) {
        result[i] = validArrays.map((arr) => arr[i]);
    }

    return result;
}

/**
 * This method is like zip except that it accepts an array of grouped elements and creates an array regroups the elements.
 * @param {Array[]} array The array of grouped elements to process.
 * @returns {Array[]} Returns the new array of regrouped elements.
 */
export function unzip(array) {
    if (!Array.isArray(array) || array.length === 0) {
        return [];
    }
    return zip(...array);
}