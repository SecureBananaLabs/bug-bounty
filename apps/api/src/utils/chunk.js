/**
 * Splits an array into chunks of specified size.
 * @param {Array} array - The array to chunk
 * @param {number} size - The size of each chunk
 * @returns {Array<Array>} Array of chunks
 */
function chunk(array, size) {
  // Handle invalid input
  if (!Array.isArray(array)) {
    return [];
  }

  // Handle zero, negative, or non-integer sizes
  const chunkSize = Math.floor(size);
  if (chunkSize <= 0) {
    return [];
  }

  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }

  return result;
}

module.exports = { chunk };
