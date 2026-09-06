/**
 * Set and SetWith utilities.
 * Sets the value at path of object, creating missing structures.
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

function isIndex(val) {
    return /^\d+$/.test(String(val));
}

/**
 * Sets the value at path of object.
 * Prototype pollution safe.
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns object.
 */
export function set(object, path, value) {
    return setWith(object, path, value);
}

/**
 * This method is like set except that it accepts customizer to produce path objects.
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @param {Function} [customizer] The function to customize assigned values.
 * @returns {Object} Returns object.
 */
export function setWith(object, path, value, customizer) {
    if (object == null || typeof object !== "object") {
        return object;
    }

    const segments = toPath(path);
    if (segments.length === 0) {
        return object;
    }

    let current = object;
    for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i];

        // Prototype pollution guard
        if (seg === "__proto__" || seg === "constructor" || seg === "prototype") {
            return object;
        }

        const nextSeg = segments[i + 1];
        let nextObj = current[seg];

        if (typeof customizer === "function") {
            const customVal = customizer(nextObj, seg, current);
            if (customVal !== undefined) {
                nextObj = customVal;
                current[seg] = nextObj;
            }
        }

        if (nextObj == null || typeof nextObj !== "object") {
            nextObj = isIndex(nextSeg) ? [] : {};
            current[seg] = nextObj;
        }

        current = current[seg];
    }

    const lastSeg = segments[segments.length - 1];
    if (lastSeg !== "__proto__" && lastSeg !== "constructor" && lastSeg !== "prototype") {
        current[lastSeg] = value;
    }

    return object;
}