/**
 * Over, OverEvery, and OverSome utilities.
 * Functional composition and multi-predicate evaluator utilities.
 */

function flattenIteratees(iteratees) {
    if (iteratees.length === 1 && Array.isArray(iteratees[0])) {
        return iteratees[0].filter((fn) => typeof fn === "function");
    }
    return iteratees.filter((fn) => typeof fn === "function");
}

/**
 * Creates a function that invokes iteratees with the arguments it receives and returns their results.
 * @param {...(Function|Function[])} iteratees The iteratees to invoke.
 * @returns {Function} Returns the new composite function.
 */
export function over(...iteratees) {
    const fns = flattenIteratees(iteratees);
    return function (...args) {
        return fns.map((fn) => fn.apply(this, args));
    };
}

/**
 * Creates a function that checks if all of the predicates return truthy when invoked with arguments.
 * Short-circuits on first falsy evaluation.
 * @param {...(Function|Function[])} predicates The predicates to check.
 * @returns {Function} Returns the new composite predicate function.
 */
export function overEvery(...predicates) {
    const fns = flattenIteratees(predicates);
    return function (...args) {
        if (fns.length === 0) return true;
        for (const fn of fns) {
            if (!fn.apply(this, args)) {
                return false;
            }
        }
        return true;
    };
}

/**
 * Creates a function that checks if any of the predicates return truthy when invoked with arguments.
 * Short-circuits on first truthy evaluation.
 * @param {...(Function|Function[])} predicates The predicates to check.
 * @returns {Function} Returns the new composite predicate function.
 */
export function overSome(...predicates) {
    const fns = flattenIteratees(predicates);
    return function (...args) {
        if (fns.length === 0) return false;
        for (const fn of fns) {
            if (fn.apply(this, args)) {
                return true;
            }
        }
        return false;
    };
}