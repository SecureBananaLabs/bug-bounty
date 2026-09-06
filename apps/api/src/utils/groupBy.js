/**
 * Prototype-safe collection grouper helper.
 */

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Groups elements of collection by the result of running each element through iteratee.
 * @param {Array<any>|Iterable<any>} collection
 * @param {((item: any) => string|number)|string} iteratee Key generator function or property name
 * @returns {Record<string, Array<any>>}
 */
export function groupBy(collection, iteratee) {
    if (collection == null || typeof collection[Symbol.iterator] !== "function") {
        return {};
    }

    const getKey =
        typeof iteratee === "function"
            ? iteratee
            : (item) => (item != null ? item[iteratee] : undefined);

    const result = Object.create(null);

    for (const item of collection) {
        const rawKey = getKey(item);
        if (rawKey === undefined || rawKey === null) continue;

        const stringKey = String(rawKey);
        if (FORBIDDEN_KEYS.has(stringKey)) {
            // Guard against prototype pollution while still grouping safely
            if (!Object.prototype.hasOwnProperty.call(result, stringKey)) {
                Object.defineProperty(result, stringKey, {
                    value: [],
                    enumerable: true,
                    configurable: true,
                    writable: true,
                });
            }
            result[stringKey].push(item);
            continue;
        }

        if (!result[stringKey]) {
            result[stringKey] = [];
        }
        result[stringKey].push(item);
    }

    return { ...result };
}