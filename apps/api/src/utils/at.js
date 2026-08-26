/**
 * At and Get utilities.
 * Resolves nested paths on objects and returns extracted values.
 */

function toPath(path) {
    if (Array.isArray(path)) {
        return path;
    }
    if (typeof path !== "string") {
        return [];
    }

    return path
        .replace(/\[(\w+)\]/g, ".$1")
        .replace(/^\./, "")
        .split(".")
        .filter(Boolean);
}

/**
 * Gets the value at path of object.
 * Prototype pollution safe.
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for undefined resolved values.
 * @returns {*} Returns the resolved value.
 */
export function get(object, path, defaultValue) {
    if (object == null) {
        return defaultValue;
    }

    const segments = toPath(path);
    let current = object;

    for (const seg of segments) {
        if (seg === "__proto__" || seg === "constructor" || seg === "prototype") {
            return defaultValue;
        }
        if (current == null) {
            return defaultValue;
        }
        current = current[seg];
    }

    return current === undefined ? defaultValue : current;
}

/**
 * Creates an array of values corresponding to paths of object.
 * @param {Object} object The object to iterate over.
 * @param {...(string|string[])} paths The property paths to pick.
 * @returns {Array} Returns the picked values.
 */
export function at(object, ...paths) {
    if (object == null) {
        return [];
    }

    const flattenedPaths = [];
    for (const p of paths) {
        if (Array.isArray(p) && p.length > 0 && Array.isArray(p[0])) {
            flattenedPaths.push(...p);
        } else if (Array.isArray(p)) {
            flattenedPaths.push(p);
        } else {
            flattenedPaths.push(p);
        }
    }

    return flattenedPaths.map((p) => get(object, p));
}