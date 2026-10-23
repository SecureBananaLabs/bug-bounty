const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Normalizes a path string or array into an array of path keys.
 * Supports dot notation ('a.b.c'), bracket notation ('a[0].b', 'a["b"].c'), and key arrays.
 *
 * @param {string|number|Array<string|number>} path The path to normalize.
 * @returns {Array<string>} An array of property keys.
 */
function toPathKeys(path) {
  if (Array.isArray(path)) {
    return path.map((key) => String(key));
  }
  if (typeof path === 'number') {
    return [String(path)];
  }
  if (typeof path !== 'string' || path.length === 0) {
    return [];
  }

  const keys = [];
  const regex = /[^.[\]]+|\[(?:(-?\d+)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]/g;
  let match;
  while ((match = regex.exec(path)) !== null) {
    const key = match[1] ?? match[3] ?? match[0];
    keys.push(key);
  }
  return keys;
}

/**
 * Safely extracts a deeply nested property value from an object or array.
 * Defends against prototype pollution and returns defaultValue when a property path is unresolved.
 *
 * @param {any} object The target object or array to query.
 * @param {string|number|Array<string|number>} path The property path navigation.
 * @param {any} [defaultValue=undefined] The fallback default value if the resolved value is undefined.
 * @returns {any} Returns the resolved value or defaultValue.
 */
export function getNested(object, path, defaultValue = undefined) {
  if (object === null || object === undefined) {
    return defaultValue;
  }

  if (path === '' || (Array.isArray(path) && path.length === 0)) {
    return defaultValue;
  }

  const keys = toPathKeys(path);
  if (keys.length === 0) {
    return defaultValue;
  }

  let current = object;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    // Prototype pollution prevention
    if (FORBIDDEN_KEYS.has(key)) {
      return defaultValue;
    }

    if (current === null || current === undefined) {
      return defaultValue;
    }

    const currentObj = Object(current);
    if (!(key in currentObj)) {
      return defaultValue;
    }

    current = current[key];
  }

  return current === undefined ? defaultValue : current;
}

export default getNested;
