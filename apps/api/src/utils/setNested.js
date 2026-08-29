/**
 * Safely sets a deeply nested property on an object without mutating prototypes.
 * @param {Record<string, any>} obj - Target object to modify
 * @param {string | string[]} path - Path expression or array of keys
 * @param {unknown} value - Value to set
 * @returns {Record<string, any>} Modified object
 */
export function setNested(obj, path, value) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const keys = Array.isArray(path)
    ? path
    : typeof path === 'string'
    ? path.split('.').map((k) => k.trim()).filter(Boolean)
    : [];

  if (keys.length === 0) {
    return obj;
  }

  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // Prevent Prototype Pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return obj;
    }

    if (current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }

    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey !== '__proto__' && lastKey !== 'constructor' && lastKey !== 'prototype') {
    current[lastKey] = value;
  }

  return obj;
}
