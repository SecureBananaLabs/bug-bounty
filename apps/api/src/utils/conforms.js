/**
 * Conforms and ConformsTo utilities.
 * Checks if object conforms to source predicates.
 */

/**
 * Checks if object conforms to source by invoking the predicate properties of source.
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property predicates to conform to.
 * @returns {boolean} Returns true if object conforms, else false.
 */
export function conformsTo(object, source) {
    if (object == null || source == null || typeof source !== "object") {
        return false;
    }

    const keys = Object.keys(source);
    for (const key of keys) {
        const predicate = source[key];
        if (typeof predicate === "function") {
            const result = predicate(object[key]);
            if (!result) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Creates a function that invokes the predicate properties of source.
 * @param {Object} source The object of property predicates to conform to.
 * @returns {Function} Returns the new spec function.
 */
export function conforms(source) {
    return function (object) {
        return conformsTo(object, source);
    };
}