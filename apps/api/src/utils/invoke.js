/**
 * Invoke and InvokeMap utilities.
 * Invokes methods at nested paths of objects or across collection items.
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
 * Invokes the method at path of object.
 * Prototype pollution safe.
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the method to invoke.
 * @param {...*} args The arguments to invoke the method with.
 * @returns {*} Returns the result of the invoked method.
 */
export function invoke(object, path, ...args) {
    if (object == null) {
        return undefined;
    }

    const segments = toPath(path);
    let current = object;
    let parent = null;

    for (const seg of segments) {
        if (seg === "__proto__" || seg === "constructor" || seg === "prototype") {
            return undefined;
        }
        if (current == null) {
            return undefined;
        }
        parent = current;
        current = current[seg];
    }

    if (typeof current === "function") {
        return current.apply(parent, args);
    }

    return undefined;
}

/**
 * Invokes the method at path of each element in collection.
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Array|string|Function} path The path of the method to invoke or the function invoked per iteration.
 * @param {...*} args The arguments to invoke each method with.
 * @returns {Array} Returns the array of results.
 */
export function invokeMap(collection, path, ...args) {
    if (collection == null) {
        return [];
    }

    const items = Array.isArray(collection) ? collection : Object.values(collection);
    const isFn = typeof path === "function";

    return items.map((item) => {
        if (item == null) {
            return undefined;
        }
        if (isFn) {
            return path.apply(item, args);
        }
        return invoke(item, path, ...args);
    });
}