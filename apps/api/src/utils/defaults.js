/**
 * Defaults utility.
 * Assigns own and inherited enumerable string keyed properties of source objects
 * to the destination object for all destination properties that resolve to undefined.
 * Source objects are applied from left to right.
 */

/**
 * Assigns default properties to target object.
 * Prototype pollution safe.
 * @param {Object} object The destination object.
 * @param {...Object} sources The source objects.
 * @returns {Object} Returns object.
 */
export function defaults(object, ...sources) {
    if (object == null || typeof object !== "object") {
        return object;
    }

    for (const source of sources) {
        if (source && typeof source === "object") {
            for (const key in source) {
                if (key === "__proto__" || key === "constructor" || key === "prototype") {
                    continue;
                }
                if (object[key] === undefined) {
                    object[key] = source[key];
                }
            }
        }
    }

    return object;
}