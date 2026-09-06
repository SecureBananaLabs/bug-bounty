/**
 * Deep object freezing utility.
 * Recursively freezes an object and its nested properties to make them immutable.
 */

/**
 * Deeply freezes an object to prevent any mutations.
 * Supports cycle detection to prevent infinite loops on self-referencing objects.
 * @param {*} object The object to freeze
 * @param {WeakSet} [seen=new WeakSet()] Internal set to track visited objects for cycle detection
 * @returns {*} The frozen object
 */
export function deepFreeze(object, seen = new WeakSet()) {
    if (object == null || typeof object !== "object") {
        return object;
    }

    if (seen.has(object)) {
        return object;
    }

    seen.add(object);

    const propNames = Object.getOwnPropertyNames(object);

    for (const name of propNames) {
        const value = object[name];
        if (value && typeof value === "object") {
            deepFreeze(value, seen);
        }
    }

    if (!Object.isFrozen(object)) {
        Object.freeze(object);
    }
    
    return object;
}