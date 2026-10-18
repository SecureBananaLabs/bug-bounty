/**
 * Result and Update utilities.
 * Resolves paths and executes functions or mutates via updater callbacks.
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
 * Resolves value at path. If value is a function, invokes it with its parent context.
 * Prototype pollution safe.
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to resolve.
 * @param {*} [defaultValue] The value returned for undefined resolved values.
 * @returns {*} Returns the resolved result.
 */
export function result(object, path, defaultValue) {
    if (object == null) {
        return defaultValue;
    }

    const segments = toPath(path);
    let current = object;
    let parent = null;

    for (const seg of segments) {
        if (seg === "__proto__" || seg === "constructor" || seg === "prototype") {
            return defaultValue;
        }
        if (current == null) {
            return defaultValue;
        }
        parent = current;
        current = current[seg];
    }

    if (current === undefined) {
        return typeof defaultValue === "function" ? defaultValue.call(parent) : defaultValue;
    }

    return typeof current === "function" ? current.call(parent) : current;
}

/**
 * This method is like set except that it accepts updater to produce the value to set.
 * Prototype pollution safe.
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {Function} updater The function to produce the updated value.
 * @returns {Object} Returns object.
 */
export function update(object, path, updater) {
    if (object == null || typeof object !== "object") {
        return object;
    }

    const segments = toPath(path);
    if (segments.length === 0) {
        return object;
    }

    const fn = typeof updater === "function" ? updater : (val) => val;
    let current = object;

    for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i];

        if (seg === "__proto__" || seg === "constructor" || seg === "prototype") {
            return object;
        }

        const nextSeg = segments[i + 1];
        let nextObj = current[seg];

        if (nextObj == null || typeof nextObj !== "object") {
            nextObj = isIndex(nextSeg) ? [] : {};
            current[seg] = nextObj;
        }

        current = current[seg];
    }

    const lastSeg = segments[segments.length - 1];
    if (lastSeg !== "__proto__" && lastSeg !== "constructor" && lastSeg !== "prototype") {
        current[lastSeg] = fn(current[lastSeg]);
    }

    return object;
}