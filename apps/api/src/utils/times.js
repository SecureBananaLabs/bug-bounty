/**
 * Times utility.
 * Invokes the iteratee n times, returning an array of the results of each invocation.
 * The iteratee is invoked with one argument; (index).
 */

/**
 * Invokes the iteratee n times, returning an array of the results.
 * @param {number} n The number of times to invoke iteratee.
 * @param {Function} [iteratee=(i) => i] The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
export function times(n, iteratee = (i) => i) {
    if (n === undefined || isNaN(n)) {
        return [];
    }

    const count = Math.max(0, Math.floor(n));
    if (count === 0) {
        return [];
    }

    const fn = typeof iteratee === "function" ? iteratee : (i) => i;
    const result = new Array(count);

    for (let i = 0; i < count; i++) {
        result[i] = fn(i);
    }

    return result;
}