/**
 * @file chunk.js
 * Array chunking utility for batch database inserts, notification dispatches, and paginated operations.
 */

'use strict';

/**
 * Creates an array of elements split into groups the length of `size`.
 * If `array` cannot be split evenly, the final chunk will be the remaining elements.
 *
 * @param {Array|Iterable} array - The array or iterable to process.
 * @param {number} [size=1] - The length of each chunk.
 * @returns {Array[]} Returns the new array of chunks.
 */
export function chunk(array, size = 1) {
  if (array == null) {
    return [];
  }

  const items = Array.isArray(array) ? array : Array.from(array);
  const length = items.length;

  if (length === 0) {
    return [];
  }

  const chunkSize = Math.max(Math.floor(Number(size)), 0);
  if (chunkSize < 1 || isNaN(chunkSize)) {
    return [];
  }

  const result = [];
  for (let i = 0; i < length; i += chunkSize) {
    result.push(items.slice(i, i + chunkSize));
  }

  return result;
}
