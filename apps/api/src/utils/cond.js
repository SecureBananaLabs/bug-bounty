/**
 * Cond utility.
 * Creates a function that iterates over pairs and invokes the corresponding
 * function of the first predicate to return truthy.
 */

/**
 * Creates a function that executes the matched branch of pairs.
 * @param {Array<[Function, Function]>} pairs The predicate-transform pairs.
 * @returns {Function} Returns the new composite function.
 */
export function cond(pairs) {
    if (!Array.isArray(pairs)) {
        return function () {
            return undefined;
        };
    }

    const validPairs = pairs.filter((pair) => Array.isArray(pair) && pair.length >= 2);

    return function (...args) {
        for (const [predicate, transform] of validPairs) {
            if (typeof predicate === "function" && predicate.apply(this, args)) {
                return typeof transform === "function" ? transform.apply(this, args) : transform;
            }
        }
        return undefined;
    };
}