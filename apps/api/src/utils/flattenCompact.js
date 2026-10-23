/**
 * Flattens an array up to a specified depth and removes null, undefined,
 * empty string (""), and NaN values while preserving valid falsy primitives (0, false).
 *
 * @template T
 * @param {any[]} array - Target array to flatten and compact
 * @param {number} [depth=1] - Maximum recursion depth (supports Infinity)
 * @returns {T[]} Cleaned and flattened array
 */
export function flattenCompact(array, depth = 1) {
  if (!Array.isArray(array)) {
    return [];
  }

  const maxDepth = typeof depth === 'number' && depth >= 0 ? depth : 1;

  function flatten(arr, currentDepth) {
    const res = [];
    for (const item of arr) {
      if (Array.isArray(item) && currentDepth < maxDepth) {
        res.push(...flatten(item, currentDepth + 1));
      } else if (
        item !== null &&
        item !== undefined &&
        item !== '' &&
        !Number.isNaN(item)
      ) {
        res.push(item);
      }
    }
    return res;
  }

  return flatten(array, 0);
}

export default flattenCompact;
