/**
 * Checks if a value is a plain JavaScript object (not an Array, null, Date, etc.)
 * @param {*} item
 * @returns {boolean}
 */
function isPlainObject(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    !Array.isArray(item) &&
    Object.prototype.toString.call(item) === "[object Object]"
  );
}

/**
 * Dangerous keys blocked to prevent prototype pollution vulnerabilities.
 */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Deeply merges two plain objects in a prototype-safe manner.
 *
 * @param {Record<string, any>} target - Destination object
 * @param {Record<string, any>} source - Source object to merge into target
 * @returns {Record<string, any>}
 */
export function deepMerge(target, source) {
  if (!isPlainObject(target)) {
    if (isPlainObject(source)) {
      return deepMerge({}, source);
    }
    return source;
  }

  if (!isPlainObject(source)) {
    return target;
  }

  const output = { ...target };

  const sourceKeys = Object.keys(source);
  for (const key of sourceKeys) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }

    const sourceValue = source[key];
    const targetValue = output[key];

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      output[key] = deepMerge(targetValue, sourceValue);
    } else if (Array.isArray(sourceValue)) {
      output[key] = [...sourceValue];
    } else if (isPlainObject(sourceValue)) {
      output[key] = deepMerge({}, sourceValue);
    } else {
      output[key] = sourceValue;
    }
  }

  return output;
}

export default deepMerge;
