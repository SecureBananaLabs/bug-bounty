/**
 * IsMatch and Matches utilities.
 * Performs deep partial comparison between objects.
 */

function baseIsMatch(object, source, customizer) {
    if (object === source) {
        return true;
    }
    if (object == null || source == null) {
        return false;
    }
    if (typeof object !== "object" || typeof source !== "object") {
        return false;
    }

    const sourceKeys = Object.keys(source);
    for (const key of sourceKeys) {
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
            continue;
        }

        const sourceVal = source[key];
        const objVal = object[key];

        if (typeof customizer === "function") {
            const customResult = customizer(objVal, sourceVal, key, object, source);
            if (customResult !== undefined) {
                if (!customResult) return false;
                continue;
            }
        }

        if (sourceVal !== null && typeof sourceVal === "object") {
            if (!baseIsMatch(objVal, sourceVal, customizer)) {
                return false;
            }
        } else if (objVal !== sourceVal) {
            return false;
        }
    }

    return true;
}

/**
 * Performs a partial deep comparison between object and source.
 * Prototype pollution safe.
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @returns {boolean} Returns true if object is a match, else false.
 */
export function isMatch(object, source) {
    return baseIsMatch(object, source);
}

/**
 * Creates a function that performs a partial deep comparison with source.
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
export function matches(source) {
    return function (object) {
        return isMatch(object, source);
    };
}