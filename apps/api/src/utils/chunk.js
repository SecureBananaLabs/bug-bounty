/**
 * Split an array into chunks of a given size.
 * @param {Array} array - The array to chunk
 * @param {number} size - The size of each chunk
 * @returns {Array[]} Array of chunks
 */
export function chunk(array, size) {
  if (!Array.isArray(array)) return [];

  const s = Math.max(1, Math.floor(size) || 1);
  const result = [];

  for (let i = 0; i < array.length; i += s) {
    result.push(array.slice(i, i + s));
  }

  return result;
}
