/**
 * @file groupBy.js
 * Prototype-safe collection grouping utility.
 * Grouping transactions by currency, aggregating bounties by status, and clustering analytics logs.
 */

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Groups elements of a collection according to the string/symbol returned by iteratee.
 * 
 * @param {Array|Iterable|Object} collection - The collection to iterate over.
 * @param {Function|string|number|symbol} [iteratee] - The iteratee to transform keys or property name.
 * @returns {Object} Returns the composed aggregate object.
 */
export function groupBy(collection, iteratee) {
  const result = Object.create(null);

  if (collection == null) {
    return Object.assign({}, result);
  }

  // Resolve key getter function
  let getKey;
  if (typeof iteratee === 'function') {
    getKey = iteratee;
  } else if (typeof iteratee === 'string' || typeof iteratee === 'number' || typeof iteratee === 'symbol') {
    getKey = (item) => (item != null ? item[iteratee] : undefined);
  } else {
    getKey = (item) => item;
  }

  const entries = [];
  if (Array.isArray(collection)) {
    for (let i = 0; i < collection.length; i++) {
      entries.push([collection[i], i]);
    }
  } else if (typeof collection[Symbol.iterator] === 'function' && typeof collection !== 'string') {
    let index = 0;
    for (const item of collection) {
      entries.push([item, index++]);
    }
  } else if (typeof collection === 'object') {
    for (const key of Object.keys(collection)) {
      entries.push([collection[key], key]);
    }
  } else {
    return Object.assign({}, result);
  }

  for (const [item, indexOrKey] of entries) {
    const rawKey = getKey(item, indexOrKey, collection);
    const key = String(rawKey);

    if (FORBIDDEN_KEYS.has(key)) {
      // Safe assignment without prototype pollution
      if (!Object.prototype.hasOwnProperty.call(result, key)) {
        Object.defineProperty(result, key, {
          value: [],
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      result[key].push(item);
    } else {
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
    }
  }

  return Object.assign({}, result);
}
