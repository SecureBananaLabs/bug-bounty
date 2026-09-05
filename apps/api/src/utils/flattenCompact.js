/**
 * Recursively flatten an array up to a given depth, removing falsy values.
 * @param {Array} array - The array to flatten
 * @param {number} [depth=1] - Maximum recursion depth (Infinity for full flatten)
 * @returns {Array} Flattened and compacted array
 */
export function flattenCompact(array, depth = 1) {
  if (!Array.isArray(array)) return [];

  const d = depth === Infinity ? Infinity : Math.max(0, Math.floor(depth));

  function walk(arr, currentDepth) {
    const result = [];
    for (const item of arr) {
      if (Array.isArray(item) && currentDepth < d) {
        result.push(...walk(item, currentDepth + 1));
      } else if (Array.isArray(item) && currentDepth >= d) {
        // Depth exceeded — keep the nested array as-is (but skip if falsy)
        result.push(item);
      } else {
        // Skip null, undefined, empty string, NaN
        if (item != null && item !== '' && !Number.isNaN(item)) {
          result.push(item);
        }
      }
    }
    return result;
  }

  return walk(array, 0);
}
