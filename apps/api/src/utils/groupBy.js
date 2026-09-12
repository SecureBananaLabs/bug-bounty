/**
 * @file groupBy.js
 * Prototype-safe collection grouper utility supporting property keys and iteratee functions.
 */

'use strict';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Groups elements of an iterable/array based on a property key or iteratee function.
 * Completely guarded against Prototype Pollution attacks.
 *
 * @param {Array|Iterable} collection - The collection to iterate over.
 * @param {string|Function} iteratee - Property name or transformation function.
 * @returns {Object} An object of grouped arrays.
 */
export function groupBy(collection, iteratee) {
  const result = Object.create(null);

  if (!collection || typeof collection[Symbol.iterator] !== 'function') {
    return {};
  }

  const getKey = typeof iteratee === 'function'
    ? iteratee
    : (item) => (item != null ? item[iteratee] : undefined);

  let index = 0;
  for (const item of collection) {
    const rawKey = getKey(item, index++);
    const key = String(rawKey);

    if (FORBIDDEN_KEYS.has(key)) {
      // Safely assign without prototype pollution
      if (!Object.prototype.hasOwnProperty.call(result, key)) {
        Object.defineProperty(result, key, {
          value: [],
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    } else {
      if (!result[key]) {
        result[key] = [];
      }
    }

    result[key].push(item);
  }

  // Return as a standard plain object with Object prototype but safe properties
  const safeObj = {};
  for (const [k, v] of Object.entries(result)) {
    if (FORBIDDEN_KEYS.has(k)) {
      Object.defineProperty(safeObj, k, {
        value: v,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      safeObj[k] = v;
    }
  }

  return safeObj;
}
