/**
 * Transform utility.
 * An alternative to reduce that transforms object to a new accumulator.
 */

/**
 * Transforms object to a new accumulator object.
 * Returning false from iteratee breaks execution early.
 * @param {Array|Object} object The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @returns {*} Returns the accumulated value.
 */
export function transform(object, iteratee, accumulator) {
    if (object == null || typeof object !== "object") {
        return accumulator !== undefined ? accumulator : {};
    }

    const isArr = Array.isArray(object);
    if (accumulator === undefined) {
        accumulator = isArr ? [] : Object.create(Object.getPrototypeOf(object) || null);
    }

    const fn = typeof iteratee === "function" ? iteratee : () => true;

    if (isArr) {
        for (let i = 0; i < object.length; i++) {
            if (fn(accumulator, object[i], i, object) === false) {
                break;
            }
        }
    } else {
        const keys = Object.keys(object);
        for (const key of keys) {
            if (key === "__proto__" || key === "constructor" || key === "prototype") {
                continue;
            }
            if (fn(accumulator, object[key], key, object) === false) {
                break;
            }
        }
    }

    return accumulator;
}