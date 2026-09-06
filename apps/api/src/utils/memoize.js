/**
 * Memoize utility for function caching.
 * Creates a function that memoizes the result of func.
 */

/**
 * Creates a function that memoizes the result of func.
 * @param {Function} func The function to have its output memoized
 * @param {Function} [resolver] The function to resolve the cache key
 * @returns {Function} Returns the new memoizing function
 */
export function memoize(func, resolver) {
    if (typeof func !== "function" || (resolver != null && typeof resolver !== "function")) {
        throw new TypeError("Expected a function");
    }

    const memoized = function (...args) {
        const key = resolver ? resolver.apply(this, args) : args[0];
        const cache = memoized.cache;

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = func.apply(this, args);
        cache.set(key, result);
        return result;
    };

    memoized.cache = new Map();
    return memoized;
}