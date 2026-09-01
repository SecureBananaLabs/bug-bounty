/**
 * Unset utility.
 * Removes the property at path of object.
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
 * Removes the property at path of object.
 * Prototype pollution safe.
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to unset.
 * @returns {boolean} Returns true if the property is deleted, else false.
 */
export function unset(object, path) {
    if (object == null || typeof object !== "object") {
        return true;
    }

    const segments = toPath(path);
    if (segments.length === 0) {
        return true;
    }

    let current = object;
    for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i];

        if (seg === "__proto__" || seg === "constructor" || seg === "prototype") {
            return false;
        }

        current = current[seg];
        if (current == null || typeof current !== "object") {
            return true;
        }
    }

    const lastSeg = segments[segments.length - 1];
    if (lastSeg === "__proto__" || lastSeg === "constructor" || lastSeg === "prototype") {
        return false;
    }

    if (current && typeof current === "object" && lastSeg in current) {
        delete current[lastSeg];
        return true;
    }

    return true;
}