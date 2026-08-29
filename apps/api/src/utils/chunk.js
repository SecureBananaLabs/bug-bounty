/**
 * Splits an array into chunks of a specified size.
 * @template T
 * @param {T[]} array - Input array to partition
 * @param {number} [size=1] - Maximum size of each chunk
 * @returns {T[][]} Array of chunked elements
 */
export function chunk(array, size = 1) {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  const chunkSize = typeof size === 'number' && Number.isFinite(size) ? Math.floor(size) : 1;
  if (chunkSize <= 0) {
    return [];
  }

  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }

  return result;
}
