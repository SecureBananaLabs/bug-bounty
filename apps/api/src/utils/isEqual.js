/**
 * Deep equality comparator.
 * Performs a deep comparison between two values to determine if they are equivalent.
 */

/**
 * Deeply compares two values.
 * @param {*} a First value to compare
 * @param {*} b Second value to compare
 * @returns {boolean} true if values are deeply equal, false otherwise
 */
export function isEqual(a, b) {
    if (a === b) return true;

    if (a == null || b == null) return a === b;

    const typeA = typeof a;
    const typeB = typeof b;

    if (typeA !== typeB) return false;
    if (typeA !== "object") return a === b;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    if (a instanceof RegExp && b instanceof RegExp) {
        return a.toString() === b.toString();
    }

    if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!isEqual(a[i], b[i])) return false;
        }
        return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
        if (!isEqual(a[key], b[key])) return false;
    }

    return true;
}