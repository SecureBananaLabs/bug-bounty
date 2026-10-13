/**
 * Without and WithoutBy utilities.
 * Creates an array excluding all given values using non-mutating pure functions.
 */

/**
 * Creates an array excluding all provided values.
 * @param {Array} array The array to inspect.
 * @param {...*} values The values to exclude.
 * @returns {Array} Returns the new array of filtered values.
 */
export function without(array, ...values) {
    if (!Array.isArray(array)) {
        return [];
    }
    const excludeSet = new Set(values);
    return array.filter((item) => !excludeSet.has(item));
}

/**
 * Creates an array excluding all values computed via iteratee.
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @param {Function|string} [iteratee] The iteratee invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 */
export function withoutBy(array, values, iteratee) {
    if (!Array.isArray(array)) {
        return [];
    }
    if (!Array.isArray(values) || values.length === 0) {
        return array.slice();
    }

    const iterFn = typeof iteratee === "function"
        ? iteratee
        : typeof iteratee === "string"
        ? (item) => (item != null ? item[iteratee] : undefined)
        : (item) => item;

    const excludeSet = new Set(values.map((v) => iterFn(v)));
    return array.filter((item) => !excludeSet.has(iterFn(item)));
}