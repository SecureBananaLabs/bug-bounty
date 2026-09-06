/**
 * Prototype-safe deep clone utility with cycle detection.
 * Supports plain objects, arrays, Date, RegExp, Map, Set, and primitives.
 */

/**
 * Deeply clones any value with circular reference protection.
 * @param {*} value The value to clone
 * @param {WeakMap} [seen=new WeakMap()] Circular reference tracking map
 * @returns {*} The deeply cloned value
 */
export function deepClone(value, seen = new WeakMap()) {
    if (value === null || typeof value !== "object") {
        return value;
    }

    if (seen.has(value)) {
        return seen.get(value);
    }

    if (value instanceof Date) {
        return new Date(value.getTime());
    }

    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }

    if (value instanceof Map) {
        const copyMap = new Map();
        seen.set(value, copyMap);
        for (const [k, v] of value.entries()) {
            copyMap.set(deepClone(k, seen), deepClone(v, seen));
        }
        return copyMap;
    }

    if (value instanceof Set) {
        const copySet = new Set();
        seen.set(value, copySet);
        for (const v of value.values()) {
            copySet.add(deepClone(v, seen));
        }
        return copySet;
    }

    if (Array.isArray(value)) {
        const copyArr = [];
        seen.set(value, copyArr);
        for (let i = 0; i < value.length; i++) {
            copyArr[i] = deepClone(value[i], seen);
        }
        return copyArr;
    }

    // Plain objects: preserve prototype safely without pollution
    const proto = Object.getPrototypeOf(value);
    const copyObj = Object.create(proto);
    seen.set(value, copyObj);

    for (const key of Object.keys(value)) {
        if (key === "__proto__" || key === "constructor") {
            Object.defineProperty(copyObj, key, {
                value: deepClone(value[key], seen),
                enumerable: true,
                configurable: true,
                writable: true,
            });
        } else {
            copyObj[key] = deepClone(value[key], seen);
        }
    }

    return copyObj;
}