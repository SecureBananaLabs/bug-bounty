/**
 * Checks if a key is a dangerous prototype pollution target.
 *
 * @param {string} key
 * @returns {boolean}
 */
function isUnsafeKey(key) {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

/**
 * Creates an object composed of the object properties predicate returns truthy for.
 * Protects against prototype pollution.
 *
 * @param {Object} obj - The source object.
 * @param {Function} [predicate=Boolean] - The function invoked per property (value, key, obj) => boolean.
 * @returns {Object} A new object with picked properties.
 */
export function pickBy(obj, predicate = Boolean) {
  if (obj == null || typeof obj !== 'object') {
    return {};
  }

  const fn = typeof predicate === 'function' ? predicate : (v) => Boolean(v);
  const result = Object.create(null);

  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (isUnsafeKey(key)) continue;

    const val = obj[key];
    if (fn(val, key, obj)) {
      result[key] = val;
    }
  }

  return Object.assign({}, result);
}

/**
 * Creates an object composed of the object properties predicate returns falsy for.
 * Protects against prototype pollution.
 *
 * @param {Object} obj - The source object.
 * @param {Function} [predicate=Boolean] - The function invoked per property (value, key, obj) => boolean.
 * @returns {Object} A new object without omitted properties.
 */
export function omitBy(obj, predicate = Boolean) {
  if (obj == null || typeof obj !== 'object') {
    return {};
  }

  const fn = typeof predicate === 'function' ? predicate : (v) => Boolean(v);
  const result = Object.create(null);

  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (isUnsafeKey(key)) continue;

    const val = obj[key];
    if (!fn(val, key, obj)) {
      result[key] = val;
    }
  }

  return Object.assign({}, result);
}
