/**
 * Safely retrieves a deeply nested property from an object using a dot-path or array of keys.
 * @param {unknown} obj - Target object
 * @param {string | string[]} path - Path expression or array of keys
 * @param {unknown} [defaultValue] - Value returned if path is undefined
 * @returns {unknown} Resolved value or defaultValue
 */
export function getNested(obj, path, defaultValue = undefined) {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }

  const keys = Array.isArray(path)
    ? path
    : typeof path === 'string'
    ? path.split('.').map((k) => k.trim()).filter(Boolean)
    : [];

  if (keys.length === 0) {
    return defaultValue;
  }

  let current = obj;
  for (const key of keys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return defaultValue;
    }

    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }

    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}
