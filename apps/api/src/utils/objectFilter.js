/**
 * Prototype-safe object filtering utilities.
 */

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Creates an object composed of the own properties that predicate returns truthy for.
 * @param {Record<string, any>} object
 * @param {(value: any, key: string) => boolean} [predicate=Boolean]
 * @returns {Record<string, any>}
 */
export function pickBy(object, predicate = Boolean) {
    if (object == null || typeof object !== "object") {
        return {};
    }

    const result = Object.create(null);

    for (const [key, value] of Object.entries(object)) {
        if (FORBIDDEN_KEYS.has(key)) continue;
        if (predicate(value, key)) {
            result[key] = value;
        }
    }

    return { ...result };
}

/**
 * Creates an object composed of the own properties that predicate returns falsy for.
 * @param {Record<string, any>} object
 * @param {(value: any, key: string) => boolean} [predicate=Boolean]
 * @returns {Record<string, any>}
 */
export function omitBy(object, predicate = Boolean) {
    if (object == null || typeof object !== "object") {
        return {};
    }

    const result = Object.create(null);

    for (const [key, value] of Object.entries(object)) {
        if (FORBIDDEN_KEYS.has(key)) continue;
        if (!predicate(value, key)) {
            result[key] = value;
        }
    }

    return { ...result };
}