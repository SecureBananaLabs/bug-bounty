/**
 * Intersection utility.
 * Creates an array of unique values that are included in all given arrays.
 * The order and references of result values are determined by the first array.
 */

/**
 * Creates an array of unique values that are included in all given arrays.
 * @param {...Array} arrays The arrays to inspect.
 * @returns {Array} Returns the new array of intersecting values.
 */
export function intersection(...arrays) {
    if (arrays.length === 0) {
        return [];
    }

    const validArrays = arrays.filter(Array.isArray);
    if (validArrays.length !== arrays.length || validArrays.length === 0) {
        return [];
    }

    const firstArray = validArrays[0];
    const otherSets = validArrays.slice(1).map((arr) => new Set(arr));

    const result = [];
    const seen = new Set();

    for (const item of firstArray) {
        if (!seen.has(item)) {
            const includedInAll = otherSets.every((s) => s.has(item));
            if (includedInAll) {
                seen.add(item);
                result.push(item);
            }
        }
    }

    return result;
}