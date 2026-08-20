/**
 * Flattens an array up to a specified depth and removes nullish/empty values.
 * @template T
 * @param {any[]} array - Target array
 * @param {number} [depth=1] - Recursion depth
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
      } else {
        res.push(item);
      }
    }
    return res;
  }

  const flattened = flatten(array, 0);

  return flattened.filter((item) => {
    if (item === null || item === undefined || item === '') return false;
    if (typeof item === 'number' && Number.isNaN(item)) return false;
    return true;
  });
}
