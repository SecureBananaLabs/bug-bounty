/**
 * @file chunk.js
 * High-performance array chunking utility with size and predicate-based chunking support.
 */

'use strict';

/**
 * Splits an array into chunks of the specified size.
 *
 * @template T
 * @param {Array<T>} arr Input array to chunk
 * @param {number} [size=1] Size of each chunk
 * @returns {Array<Array<T>>} Array of chunked arrays
 */
export function chunk(arr, size = 1) {
  if (!Array.isArray(arr)) {
    throw new TypeError('First argument arr must be an array');
  }

  if (typeof size !== 'number' || Number.isNaN(size) || !Number.isInteger(size) || size < 1) {
    throw new TypeError('Second argument size must be a positive integer');
  }

  const length = arr.length;
  if (length === 0) {
    return [];
  }

  const result = [];
  for (let i = 0; i < length; i += size) {
    result.push(arr.slice(i, i + size));
  }

  return result;
}

/**
 * Splits an array into chunks based on a grouping predicate comparator.
 *
 * @template T
 * @param {Array<T>} arr Input array
 * @param {(current: T, previous: T, index: number, array: Array<T>) => boolean} predicate Predicate returning true to continue current chunk
 * @returns {Array<Array<T>>} Chunked array
 */
export function chunkWhile(arr, predicate) {
  if (!Array.isArray(arr)) {
    throw new TypeError('First argument arr must be an array');
  }

  if (typeof predicate !== 'function') {
    throw new TypeError('Second argument predicate must be a function');
  }

  const length = arr.length;
  if (length === 0) {
    return [];
  }

  const result = [];
  let currentChunk = [arr[0]];

  for (let i = 1; i < length; i++) {
    const current = arr[i];
    const previous = arr[i - 1];

    if (predicate(current, previous, i, arr)) {
      currentChunk.push(current);
    } else {
      result.push(currentChunk);
      currentChunk = [current];
    }
  }

  result.push(currentChunk);
  return result;
}