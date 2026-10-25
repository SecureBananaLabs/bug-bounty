/**
 * Checks if a value is a plain JavaScript object.
 * @param {unknown} item
 * @returns {boolean}
 */
function isPlainObject(item) {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Prototype-safe recursive deep merge of two objects.
 * @param {Record<string, any>} target
 * @param {Record<string, any>} source
 * @returns {Record<string, any>} Merged object
 */
export function deepMerge(target = {}, source = {}) {
  const output = isPlainObject(target) ? { ...target } : {};

  if (!isPlainObject(source)) {
    return output;
  }

  for (const [key, value] of Object.entries(source)) {
    // Prevent Prototype Pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    if (isPlainObject(value)) {
      if (isPlainObject(output[key])) {
        output[key] = deepMerge(output[key], value);
      } else {
        output[key] = deepMerge({}, value);
      }
    } else if (Array.isArray(value)) {
      output[key] = [...value];
    } else if (value !== undefined) {
      output[key] = value;
    }
  }

  return output;
}
