/**
 * Size utility.
 * Gets the size of collection by returning its length for array-like values
 * or the number of own enumerable properties for objects, Map, and Set.
 */

/**
 * Gets the size of collection.
 * @param {Array|Object|string|Map|Set} collection The collection to inspect.
 * @returns {number} Returns the collection size.
 */
export function size(collection) {
    if (collection == null) {
        return 0;
    }

    if (typeof collection === "string" || Array.isArray(collection)) {
        return collection.length;
    }

    if (collection instanceof Map || collection instanceof Set) {
        return collection.size;
    }

    if (typeof collection === "object") {
        return Object.keys(collection).length;
    }

    return 0;
}