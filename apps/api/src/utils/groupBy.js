const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Groups elements of an array by the key returned from running each element
 * through `iteratee` (either a callback function or property name).
 * Guards against prototype pollution (CWE-1321) and Object.prototype collisions.
 *
 * @template T
 * @param {T[]} array - Input collection to group
 * @param {((item: T, index: number, array: T[]) => string | number) | string} iteratee - Grouping callback or property key
 * @returns {Record<string, T[]>} Grouped dictionary object
 */
export function groupBy(array, iteratee) {
  if (!Array.isArray(array)) {
    return {};
  }

  const getKey =
    typeof iteratee === 'function'
      ? iteratee
      : typeof iteratee === 'string'
      ? (item) => (item !== null && item !== undefined ? item[iteratee] : undefined)
      : (item) => item;

  const result = {};

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    const rawKey = getKey(item, i, array);
    const key = String(rawKey);

    if (DANGEROUS_KEYS.has(key)) {
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = [];
    }
    result[key].push(item);
  }

  return result;
}

export default groupBy;
