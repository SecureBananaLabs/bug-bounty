/**
 * Xor and XorBy utilities.
 * Creates an array of unique values that is the symmetric difference of the given arrays.
 */

/**
 * Creates an array of unique values that is the symmetric difference of the given arrays.
 * @param {...Array} arrays The arrays to inspect.
 * @returns {Array} Returns the new array of filtered values.
 */
export function xor(...arrays) {
    return xorBy(...arrays);
}

/**
 * This method is like xor except that it accepts iteratee which is invoked for each element.
 * @param {...Array} arrays The arrays to inspect.
 * @param {Function|string} [iteratee] The iteratee invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 */
export function xorBy(...arrays) {
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

    const validArrays = arrays.filter(Array.isArray);
    if (validArrays.length === 0) {
        return [];
    }

    const valueCounts = new Map();
    const valueMap = new Map();

    for (const arr of validArrays) {
        const seenInArr = new Set();
        for (const item of arr) {
            const criterion = iterFn(item);
            if (!seenInArr.has(criterion)) {
                seenInArr.add(criterion);
                valueCounts.set(criterion, (valueCounts.get(criterion) || 0) + 1);
                if (!valueMap.has(criterion)) {
                    valueMap.set(criterion, item);
                }
            }
        }
    }

    const result = [];
    for (const [criterion, count] of valueCounts.entries()) {
        if (count === 1) {
            result.push(valueMap.get(criterion));
        }
    }

    return result;
}