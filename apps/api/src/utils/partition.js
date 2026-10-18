/**
 * Prototype-safe collection partition helper.
 * Splits a collection into two arrays: [truthyElements, falsyElements].
 */

/**
 * Splits collection into two arrays according to predicate.
 * @param {Array<any>|Iterable<any>} collection
 * @param {((item: any) => boolean)|string} [predicate=Boolean]
 * @returns {[Array<any>, Array<any>]} [passArray, failArray]
 */
export function partition(collection, predicate = Boolean) {
    if (collection == null || typeof collection[Symbol.iterator] !== "function") {
        return [[], []];
    }

    const testFn =
        typeof predicate === "function"
            ? predicate
            : (item) => Boolean(item != null && item[predicate]);

    const passes = [];
    const fails = [];

    for (const item of collection) {
        if (testFn(item)) {
            passes.push(item);
        } else {
            fails.push(item);
        }
    }

    return [passes, fails];
}