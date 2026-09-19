/**
 * @file deepMerge.js
 * Prototype-safe recursive object merger.
 */

'use strict';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Checks if a value is a plain JavaScript object.
 *
 * @param {*} val
 * @returns {boolean}
 */
function isPlainObject(val) {
  if (val === null || typeof val !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(val);
  return proto === null || proto === Object.prototype;
}

/**
 * Recursively merges source objects into target with strict prototype pollution protection.
 *
 * @param {Object} target - The destination object.
 * @param {...Object} sources - One or more source objects to merge.
 * @returns {Object} The merged target object.
 */
export function deepMerge(target, ...sources) {
  if (!isPlainObject(target)) {
    target = {};
  }

  for (const source of sources) {
    if (!isPlainObject(source)) {
      continue;
    }

    const keys = Object.keys(source);
    for (const key of keys) {
      // Block prototype pollution
      if (FORBIDDEN_KEYS.has(key)) {
        continue;
      }

      const sourceVal = source[key];
      const targetVal = target[key];

      if (isPlainObject(sourceVal)) {
        if (isPlainObject(targetVal)) {
          target[key] = deepMerge(targetVal, sourceVal);
        } else {
          target[key] = deepMerge({}, sourceVal);
        }
      } else if (Array.isArray(sourceVal)) {
        // Clone array values to prevent reference sharing
        target[key] = sourceVal.map((item) =>
          isPlainObject(item) ? deepMerge({}, item) : item
        );
      } else if (sourceVal !== undefined) {
        target[key] = sourceVal;
      }
    }
  }

  return target;
}
