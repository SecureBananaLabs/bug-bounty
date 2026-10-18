/**
 * Chunk utility.
 * Creates an array of elements split into groups the length of size.
 */

/**
 * Creates an array of elements split into groups the length of size.
 * @param {Array} array The array to process.
 * @param {number} [size=1] The length of each chunk.
 * @returns {Array[]} Returns the new array of chunks.
 */
export function chunk(array, size = 1) {
    if (!Array.isArray(array)) {
        return [];
    }

    const chunkSize = Math.max(Math.floor(size), 0);
    const length = array.length;

    if (!length || chunkSize < 1) {
        return [];
    }

    let index = 0;
    let resIndex = 0;
    const result = new Array(Math.ceil(length / chunkSize));

    while (index < length) {
        result[resIndex++] = array.slice(index, (index += chunkSize));
    }

    return result;
}