/**
 * CastArray and ToArray utilities.
 * Converts or wraps values into standard arrays.
 */

/**
 * Casts value as an array if it's not one.
 * @param {*} [value] The value to inspect.
 * @returns {Array} Returns the cast array.
 */
export function castArray(...args) {
    if (args.length === 0) {
        return [];
    }
    const value = args[0];
    return Array.isArray(value) ? value : [value];
}

/**
 * Converts value to an array.
 * @param {*} value The value to convert.
 * @returns {Array} Returns the converted array.
 */
export function toArray(value) {
    if (value == null) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.slice();
    }
    if (typeof value === "string") {
        return Array.from(value);
    }
    if (value instanceof Map) {
        return Array.from(value.entries());
    }
    if (value instanceof Set) {
        return Array.from(value.values());
    }
    if (typeof value[Symbol.iterator] === "function") {
        return Array.from(value);
    }
    if (typeof value === "object") {
        return Object.values(value);
    }
    return [];
}