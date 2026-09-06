/**
 * Pick utility.
 * Creates an object composed of the picked object properties.
 */

/**
 * Creates an object composed of the picked object properties.
 * Prototype pollution safe.
 * @param {Object} object The source object.
 * @param {string[]|string} paths The property paths to pick.
 * @returns {Object} Returns the new object with picked properties.
 */
export function pick(object, paths) {
    if (object == null || typeof object !== "object") {
        return {};
    }

    const keys = Array.isArray(paths) ? paths : [paths];
    const result = {};

    for (const key of keys) {
        if (typeof key !== "string" && typeof key !== "number") {
            continue;
        }

        const prop = String(key);
        if (prop === "__proto__" || prop === "constructor" || prop === "prototype") {
            continue;
        }

        if (prop in object) {
            result[prop] = object[prop];
        }
    }

    return result;
}