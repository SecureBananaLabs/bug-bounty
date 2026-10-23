const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Creates an object composed of the own enumerable properties of `obj`
 * that `predicate(value, key, obj)` returns truthy for.
 * Guards against prototype pollution (CWE-1321).
 *
 * @template {Record<string, any>} T
 * @param {T} obj - Source object to filter
 * @param {(value: any, key: string, obj: T) => boolean} [predicate=Boolean] - Filter predicate
 * @returns {Partial<T>} Filtered plain object
 */
export function pickBy(obj, predicate = Boolean) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return {};
  }

  const fn = typeof predicate === 'function' ? predicate : Boolean;
  const result = {};

  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEYS.has(key)) {
      continue;
    }
    const val = obj[key];
    if (fn(val, key, obj)) {
      result[key] = val;
    }
  }

  return result;
}

/**
 * Creates an object composed of the own enumerable properties of `obj`
 * that `predicate(value, key, obj)` returns falsy for.
 * Guards against prototype pollution (CWE-1321).
 *
 * @template {Record<string, any>} T
 * @param {T} obj - Source object to filter
 * @param {(value: any, key: string, obj: T) => boolean} [predicate=Boolean] - Filter predicate
 * @returns {Partial<T>} Filtered plain object
 */
export function omitBy(obj, predicate = Boolean) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return {};
  }

  const fn = typeof predicate === 'function' ? predicate : Boolean;
  return pickBy(obj, (val, key, source) => !fn(val, key, source));
}

export default { pickBy, omitBy };
