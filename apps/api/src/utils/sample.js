/**
 * Sample and SampleSize utilities.
 * Gets random element(s) from collection using Fisher-Yates sampling.
 */

/**
 * Gets a random element from an array.
 * @param {Array} array The array to sample.
 * @returns {*} Returns the random element.
 */
export function sample(array) {
    if (!Array.isArray(array) || array.length === 0) {
        return undefined;
    }
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

/**
 * Gets n random elements at unique keys from array up to the size of array.
 * @param {Array} array The array to sample.
 * @param {number} [n=1] The number of elements to sample.
 * @returns {Array} Returns the random elements.
 */
export function sampleSize(array, n = 1) {
    if (!Array.isArray(array) || array.length === 0 || n <= 0) {
        return [];
    }

    const length = array.length;
    const count = Math.min(Math.floor(n), length);
    const shuffled = array.slice();

    for (let i = 0; i < count; i++) {
        const rand = i + Math.floor(Math.random() * (length - i));
        const temp = shuffled[i];
        shuffled[i] = shuffled[rand];
        shuffled[rand] = temp;
    }

    return shuffled.slice(0, count);
}