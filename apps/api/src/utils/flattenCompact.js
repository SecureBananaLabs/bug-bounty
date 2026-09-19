/**
 * @file flattenCompact.js
 * High-performance array flattening and compaction utility with configurable depth and filtering modes.
 */

'use strict';

/**
 * Compacts an array by removing empty or invalid values.
 *
 * @param {Array} arr Input array
 * @param {'nullish'|'falsy'} [mode='nullish'] Compaction mode
 * @returns {Array} Compacted array
 */
export function compact(arr, mode = 'nullish') {
  if (!Array.isArray(arr)) {
    throw new TypeError('First argument must be an array');
  }

  if (mode === 'falsy') {
    return arr.filter(Boolean);
  }

  return arr.filter((val) => val !== null && val !== undefined && !Number.isNaN(val));
}

/**
 * Flattens an array recursively up to the specified depth.
 *
 * @param {Array} arr Input array
 * @param {number} [depth=Infinity] Maximum recursion depth
 * @returns {Array} Flattened array
 */
export function flatten(arr, depth = Infinity) {
  if (!Array.isArray(arr)) {
    throw new TypeError('First argument must be an array');
  }

  if (depth < 1) {
    return [...arr];
  }

  const result = [];
  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      result.push(...flatten(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}

/**
 * Flattens and compacts an array in a single configurable pipeline.
 *
 * @param {Array} arr Input array
 * @param {Object} [options={}] Configuration options
 * @param {number} [options.depth=Infinity] Maximum recursion depth
 * @param {'nullish'|'falsy'} [options.mode='nullish'] Compaction mode
 * @returns {Array} Flattened and compacted array
 */
export function flattenCompact(arr, options = {}) {
  if (!Array.isArray(arr)) {
    throw new TypeError('First argument must be an array');
  }

  const depth = options.depth ?? Infinity;
  const mode = options.mode ?? 'nullish';

  const flattened = flatten(arr, depth);
  return compact(flattened, mode);
}