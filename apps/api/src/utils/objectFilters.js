/**
 * @file objectFilters.js
 * High-performance, prototype-safe object property filtering utilities (pickBy, omitBy, pick, omit).
 */

'use strict';

const UNSAFE_PROPERTIES = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Creates a prototype-safe shallow clone containing only properties that satisfy the predicate.
 *
 * @param {Object} obj Input object
 * @param {(value: any, key: string, object: Object) => boolean} [predicate=Boolean] Filter predicate
 * @returns {Object} Filtered object
 */
export function pickBy(obj, predicate = Boolean) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new TypeError('First argument must be a plain object');
  }

  if (typeof predicate !== 'function') {
    throw new TypeError('Second argument predicate must be a function');
  }

  const result = Object.create(null);
  const keys = Object.keys(obj);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (UNSAFE_PROPERTIES.has(key)) continue;

    const value = obj[key];
    if (predicate(value, key, obj)) {
      result[key] = value;
    }
  }

  return Object.assign({}, result);
}

/**
 * Creates a prototype-safe shallow clone excluding properties that satisfy the predicate.
 *
 * @param {Object} obj Input object
 * @param {(value: any, key: string, object: Object) => boolean} [predicate=Boolean] Filter predicate
 * @returns {Object} Filtered object
 */
export function omitBy(obj, predicate = Boolean) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new TypeError('First argument must be a plain object');
  }

  if (typeof predicate !== 'function') {
    throw new TypeError('Second argument predicate must be a function');
  }

  return pickBy(obj, (value, key, o) => !predicate(value, key, o));
}

/**
 * Picks specific keys from an object safely.
 *
 * @param {Object} obj Input object
 * @param {string[]|Set<string>} keys Array or Set of keys to pick
 * @returns {Object} Picked object
 */
export function pick(obj, keys) {
  const keySet = new Set(Array.isArray(keys) ? keys : [keys]);
  return pickBy(obj, (_, key) => keySet.has(key));
}

/**
 * Omits specific keys from an object safely.
 *
 * @param {Object} obj Input object
 * @param {string[]|Set<string>} keys Array or Set of keys to omit
 * @returns {Object} Object with specified keys omitted
 */
export function omit(obj, keys) {
  const keySet = new Set(Array.isArray(keys) ? keys : [keys]);
  return omitBy(obj, (_, key) => keySet.has(key));
}