const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Safely sets a deeply nested property on an object without mutating prototypes (CWE-1321).
 * Automatically constructs intermediate plain objects when missing or non-object.
 *
 * @param {Record<string, any>} obj - Target object to modify in place
 * @param {string | string[]} path - Dot-delimited path string or array of key segments
 * @param {unknown} value - Value to assign at the target path
 * @returns {Record<string, any>} Modified target object
 */
export function setNested(obj, path, value) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const keys = Array.isArray(path)
    ? path.map((k) => String(k).trim()).filter(Boolean)
    : typeof path === 'string'
    ? path
        .replace(/\[(\w+)\]/g, '.$1')
        .split('.')
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  if (keys.length === 0) {
    return obj;
  }

  for (const key of keys) {
    if (DANGEROUS_KEYS.has(key)) {
      return obj;
    }
  }

  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextVal = Object.prototype.hasOwnProperty.call(current, key) ? current[key] : undefined;

    if (nextVal === null || typeof nextVal !== 'object' || Array.isArray(nextVal)) {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
  return obj;
}

export default setNested;
