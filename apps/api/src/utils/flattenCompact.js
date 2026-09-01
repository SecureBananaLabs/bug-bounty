/**
 * Array flatten and compact helper utility.
 * Flattens array up to a given depth and removes all falsy values (null, undefined, false, 0, "", NaN).
 */

/**
 * Recursively flattens array up to depth and filters out falsy values.
 * @param {Array<any>} array Input array
 * @param {number|'deep'} [depth=1] Maximum recursion depth or 'deep' for Infinity
 * @returns {Array<any>} Flattened and compacted array
 */
export function flattenCompact(array, depth = 1) {
    if (!Array.isArray(array)) {
        return [];
    }

    const maxDepth = depth === "deep" ? Number.POSITIVE_INFINITY : Math.max(0, Number(depth) || 0);

    function flatten(items, currentDepth) {
        const result = [];
        for (const item of items) {
            if (Array.isArray(item) && currentDepth < maxDepth) {
                result.push(...flatten(item, currentDepth + 1));
            } else if (Boolean(item)) {
                result.push(item);
            }
        }
        return result;
    }

    return flatten(array, 0);
}