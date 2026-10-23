/**
 * Creates an array of elements split into groups the length of `size`.
 * If `array` can't be split evenly, the final chunk will be the remaining elements.
 *
 * @param {Array} array The array to process.
 * @param {number} [size=1] The length of each chunk.
 * @returns {Array<Array>} Returns the new array of chunks.
 */
export function chunk(array, size = 1) {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  const numericSize = Number(size);
  if (!Number.isFinite(numericSize) || numericSize <= 0) {
    return [];
  }

  const chunkSize = Math.floor(numericSize);
  if (chunkSize <= 0) {
    return [];
  }

  const result = [];
  const length = array.length;

  for (let index = 0; index < length; index += chunkSize) {
    result.push(array.slice(index, index + chunkSize));
  }

  return result;
}

export default chunk;
