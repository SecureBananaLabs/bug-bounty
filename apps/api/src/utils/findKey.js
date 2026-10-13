/**
 * FindKey and FindLastKey utilities.
 * Returns the key of the first (or last) element predicate returns truthy for.
 */

function getPredicate(predicate) {
    if (typeof predicate === "function") {
        return predicate;
    }
    if (Array.isArray(predicate) && predicate.length === 2) {
        return (val) => val != null && val[predicate[0]] === predicate[1];
    }
    if (typeof predicate === "object" && predicate !== null) {
        return (val) => {
            if (val == null) return false;
            for (const k in predicate) {
                if (val[k] !== predicate[k]) return false;
            }
            return true;
        };
    }
    if (typeof predicate === "string") {
        return (val) => Boolean(val && val[predicate]);
    }
    return Boolean;
}

/**
 * Returns the key of the first element predicate returns truthy for.
 * @param {Object} object The object to inspect.
 * @param {Function|Object|Array|string} [predicate] The function invoked per iteration.
 * @returns {string|undefined} Returns the key of the matched element, else undefined.
 */
export function findKey(object, predicate) {
    if (object == null || typeof object !== "object") {
        return undefined;
    }

    const fn = getPredicate(predicate);
    const keys = Object.keys(object);

    for (const key of keys) {
        if (fn(object[key], key, object)) {
            return key;
        }
    }

    return undefined;
}

/**
 * Returns the key of the last element predicate returns truthy for.
 * @param {Object} object The object to inspect.
 * @param {Function|Object|Array|string} [predicate] The function invoked per iteration.
 * @returns {string|undefined} Returns the key of the matched element, else undefined.
 */
export function findLastKey(object, predicate) {
    if (object == null || typeof object !== "object") {
        return undefined;
    }

    const fn = getPredicate(predicate);
    const keys = Object.keys(object);

    for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        if (fn(object[key], key, object)) {
            return key;
        }
    }

    return undefined;
}