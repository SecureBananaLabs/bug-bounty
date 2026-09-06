/**
 * Groups array items by the result of running each element through iteratee.
 * @template T
 * @param {T[]} array - Input array
 * @param {string | ((item: T, index: number) => string)} iteratee - Property key or mapping function
 * @returns {Record<string, T[]>} Object with grouped arrays
 */
export function groupBy(array, iteratee) {
  if (!Array.isArray(array)) {
    return Object.create(null);
  }

  const getKey = typeof iteratee === 'function'
    ? iteratee
    : typeof iteratee === 'string'
    ? (item) => (item && typeof item === 'object' ? item[iteratee] : undefined)
    : (item) => String(item);

  const result = Object.create(null);

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    const rawKey = getKey(item, i);
    const key = String(rawKey);

    // Prevent Prototype Pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }

  return result;
}
