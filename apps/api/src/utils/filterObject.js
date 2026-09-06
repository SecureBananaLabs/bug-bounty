/**
 * Creates an object composed of the object properties predicate returns truthy for.
 * @template T
 * @param {Record<string, any>} obj - Target object
 * @param {(value: any, key: string, obj: Record<string, any>) => boolean} predicate - Filter function
 * @returns {Partial<T>} Filtered object
 */
export function pickBy(obj, predicate) {
  if (obj === null || typeof obj !== 'object') {
    return {};
  }

  const fn = typeof predicate === 'function' ? predicate : Boolean;
  const result = {};

  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    const value = obj[key];
    if (fn(value, key, obj)) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * The opposite of pickBy; this method creates an object composed of the own and inherited
 * enumerable string keyed properties of object that predicate doesn't return truthy for.
 * @template T
 * @param {Record<string, any>} obj - Target object
 * @param {(value: any, key: string, obj: Record<string, any>) => boolean} predicate - Filter function
 * @returns {Partial<T>} Filtered object
 */
export function omitBy(obj, predicate) {
  if (obj === null || typeof obj !== 'object') {
    return {};
  }

  const fn = typeof predicate === 'function' ? predicate : Boolean;
  return pickBy(obj, (value, key, source) => !fn(value, key, source));
}
