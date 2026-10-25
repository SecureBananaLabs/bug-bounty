/**
 * Once utility.
 * Creates a function that is restricted to invoking func once.
 * Repeat calls to the function return the value of the first invocation.
 */

/**
 * Creates a function that is restricted to invoking func once.
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new restricted function.
 */
export function once(func) {
    if (typeof func !== "function") {
        throw new TypeError("Expected a function");
    }

    let called = false;
    let result;

    return function (...args) {
        if (!called) {
            called = true;
            result = func.apply(this, args);
        }
        return result;
    };
}