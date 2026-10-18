/**
 * Omit utility.
 * The opposite of pick; this method creates an object composed of the own and inherited
 * enumerable property paths of object that are not omitted.
 */

/**
 * Creates an object composed of the own and inherited enumerable property paths of object that are not omitted.
 * Prototype pollution safe.
 * @param {Object} object The source object.
 * @param {string[]|string} paths The property paths to omit.
 * @returns {Object} Returns the new object.
 */
export function omit(object, paths) {
    if (object == null || typeof object !== "object") {
        return {};
    }

    const omitList = Array.isArray(paths) ? paths : [paths];
    const omitSet = new Set(omitList.map(String));
    const result = {};

    for (const key in object) {
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
            continue;
        }

        if (!omitSet.has(key)) {
            result[key] = object[key];
        }
    }

    return result;
}