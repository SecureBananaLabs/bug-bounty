/**
 * Invert and InvertBy utilities.
 * Creates an object composed of the inverted keys and values.
 */

/**
 * Creates an object composed of the inverted keys and values of object.
 * Prototype pollution safe.
 * @param {Object} object The object to invert.
 * @returns {Object} Returns the new inverted object.
 */
export function invert(object) {
    const result = Object.create(null);
    if (object == null || typeof object !== "object") {
        return {};
    }

    const keys = Object.keys(object);
    for (const key of keys) {
        const val = String(object[key]);
        if (val === "__proto__" || val === "constructor" || val === "prototype") {
            continue;
        }
        result[val] = key;
    }

    return Object.assign({}, result);
}

/**
 * This method is like invert except that the inverted object contains arrays of keys.
 * @param {Object} object The object to invert.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @returns {Object} Returns the new inverted object.
 */
export function invertBy(object, iteratee) {
    const result = Object.create(null);
    if (object == null || typeof object !== "object") {
        return {};
    }

    const fn = typeof iteratee === "function" ? iteratee : (val) => val;
    const keys = Object.keys(object);

    for (const key of keys) {
        const val = String(fn(object[key]));
        if (val === "__proto__" || val === "constructor" || val === "prototype") {
            continue;
        }
        if (!result[val]) {
            result[val] = [];
        }
        result[val].push(key);
    }

    return Object.assign({}, result);
}