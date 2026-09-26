/**
 * Recursively flattens an array up to a specified depth and removes falsy or nullish items.
 *
 * @param {Array} array - The array to flatten and compact.
 * @param {Object} [options={}] - Options.
 * @param {number} [options.depth=Infinity] - Maximum recursion depth.
 * @param {('falsy'|'nullish')} [options.compactMode='falsy'] - Compaction mode: 'falsy' removes all falsy values, 'nullish' removes only null and undefined.
 * @returns {Array} The flattened and compacted array.
 */
export function flattenCompact(array, options = {}) {
  if (!Array.isArray(array)) {
    return [];
  }

  const { depth = Infinity, compactMode = 'falsy' } = options;
  const isNullishMode = compactMode === 'nullish';

  const shouldKeep = (val) => {
    if (isNullishMode) {
      return val !== null && val !== undefined;
    }
    return Boolean(val);
  };

  const result = [];

  function helper(arr, currentDepth) {
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (Array.isArray(item) && currentDepth < depth) {
        helper(item, currentDepth + 1);
      } else if (shouldKeep(item)) {
        result.push(item);
      }
    }
  }

  helper(array, 0);
  return result;
}
