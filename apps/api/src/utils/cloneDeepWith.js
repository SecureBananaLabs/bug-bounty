/**
 * CloneWith and CloneDeepWith utilities.
 * Clones values with customizer overrides and cyclic reference safety.
 */

function baseClone(value, isDeep, customizer, key, object, stack = new WeakMap()) {
    if (typeof customizer === "function") {
        const customResult = customizer(value, key, object, stack);
        if (customResult !== undefined) {
            return customResult;
        }
    }

    if (value === null || typeof value !== "object") {
        return value;
    }

    if (value instanceof Date) {
        return new Date(value.getTime());
    }
    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }
    if (value instanceof Map) {
        const mapCopy = new Map();
        if (isDeep) stack.set(value, mapCopy);
        value.forEach((v, k) => {
            mapCopy.set(isDeep ? baseClone(k, true, customizer, k, value, stack) : k, isDeep ? baseClone(v, true, customizer, k, value, stack) : v);
        });
        return mapCopy;
    }
    if (value instanceof Set) {
        const setCopy = new Set();
        if (isDeep) stack.set(value, setCopy);
        value.forEach((v) => {
            setCopy.add(isDeep ? baseClone(v, true, customizer, undefined, value, stack) : v);
        });
        return setCopy;
    }

    if (isDeep && stack.has(value)) {
        return stack.get(value);
    }

    const isArr = Array.isArray(value);
    const result = isArr ? [] : Object.create(Object.getPrototypeOf(value));

    if (isDeep) {
        stack.set(value, result);
    }

    const keys = isArr ? value : Object.keys(value);
    for (const k in value) {
        if (Object.prototype.hasOwnProperty.call(value, k)) {
            if (k === "__proto__" || k === "constructor" || k === "prototype") {
                continue;
            }
            result[k] = isDeep
                ? baseClone(value[k], true, customizer, k, value, stack)
                : value[k];
        }
    }

    return result;
}

/**
 * Clones a value using an optional customizer.
 * @param {*} value The value to clone.
 * @param {Function} [customizer] The function to customize cloning.
 * @returns {*} Returns the cloned value.
 */
export function cloneWith(value, customizer) {
    return baseClone(value, false, customizer);
}

/**
 * Recursively clones a value using an optional customizer and cycle detection.
 * @param {*} value The value to recursively clone.
 * @param {Function} [customizer] The function to customize cloning.
 * @returns {*} Returns the deep cloned value.
 */
export function cloneDeepWith(value, customizer) {
    return baseClone(value, true, customizer);
}