/**
 * @file partition.js
 * High-performance collection partition utility splitting data structures into [matches, nonMatches] tuples.
 */

'use strict';

/**
 * Splits a collection into two groups based on the return value of a predicate function.
 *
 * @template T
 * @param {Array<T>|Set<T>|Map<any, any>|Record<string, any>} collection The input collection
 * @param {(value: any, key: any, collection: any) => boolean} [predicate=Boolean] Predicate evaluator
 * @returns {[any, any]} Tuple of [matchingElements, nonMatchingElements]
 */
export function partition(collection, predicate = Boolean) {
  if (collection === null || collection === undefined || (typeof collection !== 'object' && typeof collection !== 'string')) {
    throw new TypeError('First argument collection must be an object, iterable, or array');
  }

  if (typeof predicate !== 'function') {
    throw new TypeError('Second argument predicate must be a function');
  }

  if (Array.isArray(collection)) {
    const pass = [];
    const fail = [];
    for (let i = 0; i < collection.length; i++) {
      const item = collection[i];
      if (predicate(item, i, collection)) {
        pass.push(item);
      } else {
        fail.push(item);
      }
    }
    return [pass, fail];
  }

  if (collection instanceof Set) {
    const pass = new Set();
    const fail = new Set();
    let index = 0;
    for (const item of collection) {
      if (predicate(item, index++, collection)) {
        pass.add(item);
      } else {
        fail.add(item);
      }
    }
    return [pass, fail];
  }

  if (collection instanceof Map) {
    const pass = new Map();
    const fail = new Map();
    for (const [key, value] of collection.entries()) {
      if (predicate(value, key, collection)) {
        pass.set(key, value);
      } else {
        fail.set(key, value);
      }
    }
    return [pass, fail];
  }

  // Plain object
  const pass = {};
  const fail = {};
  const keys = Object.keys(collection);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = collection[key];
    if (predicate(value, key, collection)) {
      pass[key] = value;
    } else {
      fail[key] = value;
    }
  }
  return [pass, fail];
}