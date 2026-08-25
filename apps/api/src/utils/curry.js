/**
 * Curry utility.
 * Creates a function that accepts arguments of func and either invokes func returning its result,
 * if at least arity number of arguments have been provided, or returns a function that accepts
 * the remaining func arguments, and so on.
 */

/**
 * Creates a curried function.
 * @param {Function} func The function to curry.
 * @param {number} [arity=func.length] The arity of func.
 * @returns {Function} Returns the new curried function.
 */
export function curry(func, arity = func.length) {
    if (typeof func !== "function") {
        throw new TypeError("Expected a function");
    }

    return function curried(...args) {
        if (args.length >= arity) {
            return func.apply(this, args);
        }
        return function (...moreArgs) {
            return curried.apply(this, args.concat(moreArgs));
        };
    };
}