/**
 * Merge utility for deep object merging.
 * Recursively merges own and inherited enumerable string keyed properties of source objects into the destination object.
 */

const isObject = (item) => {
    return item && typeof item === "object" && !Array.isArray(item);
};

/**
 * Deep merges multiple objects.
 * Prototype pollution safe.
 * @param {Object} target The destination object
 * @param {...Object} sources The source objects
 * @returns {Object} The merged object
 */
export function merge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            // Prevent prototype pollution
            if (key === "__proto__" || key === "constructor" || key === "prototype") {
                continue;
            }

            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                merge(target[key], source[key]);
            } else if (Array.isArray(source[key])) {
                // If target is an array, concatenate. Otherwise overwrite.
                if (Array.isArray(target[key])) {
                    target[key] = target[key].concat(source[key]);
                } else {
                    target[key] = [...source[key]];
                }
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return merge(target, ...sources);
}