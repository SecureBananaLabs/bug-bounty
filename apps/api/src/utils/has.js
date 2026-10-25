/**
 * Has and HasIn utilities.
 * Checks if path is a direct (or inherited) property of object.
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

function hasPath(object, path, checkDirect) {
    if (object == null) {
        return false;
    }

    const segments = toPath(path);
    if (segments.length === 0) {
        return false;
    }

    let current = object;
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];

        if (seg === "__proto__" || seg === "constructor" || seg === "prototype") {
            return false;
        }

        if (current == null) {
            return false;
        }

        if (checkDirect && !Object.prototype.hasOwnProperty.call(current, seg)) {
            return false;
        }

        if (!checkDirect && !(seg in Object(current))) {
            return false;
        }

        current = current[seg];
    }

    return true;
}

/**
 * Checks if path is a direct property of object.
 * Prototype pollution safe.
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns true if path exists, else false.
 */
export function has(object, path) {
    return hasPath(object, path, true);
}

/**
 * Checks if path is a direct or inherited property of object.
 * Prototype pollution safe.
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns true if path exists, else false.
 */
export function hasIn(object, path) {
    return hasPath(object, path, false);
}