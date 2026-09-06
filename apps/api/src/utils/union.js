/**
 * Union and UnionBy utilities.
 * Creates an array of unique values, in order, from all given arrays.
 */

/**
 * Creates an array of unique values, in order, from all given arrays.
 * @param {...Array} arrays The arrays to inspect.
 * @returns {Array} Returns the new array of combined values.
 */
export function union(...arrays) {
    return unionBy(...arrays);
}

/**
 * This method is like union except that it accepts iteratee which is invoked for each element.
 * @param {...Array} arrays The arrays to inspect.
 * @param {Function|string} [iteratee] The iteratee invoked per element.
 * @returns {Array} Returns the new array of combined values.
 */
export function unionBy(...arrays) {
    let iteratee = arrays.length > 0 ? arrays[arrays.length - 1] : undefined;

    if (typeof iteratee === "function" || (typeof iteratee === "string" && !Array.isArray(iteratee))) {
        arrays = arrays.slice(0, -1);
    } else {
        iteratee = undefined;
    }

    const iterFn = typeof iteratee === "function"
        ? iteratee
        : typeof iteratee === "string"
        ? (item) => (item != null ? item[iteratee] : undefined)
        : (item) => item;

    const result = [];
    const seen = new Set();

    for (const arr of arrays) {
        if (Array.isArray(arr)) {
            for (const item of arr) {
                const criterion = iterFn(item);
                if (!seen.has(criterion)) {
                    seen.add(criterion);
                    result.push(item);
                }
            }
        }
    }

    return result;
}