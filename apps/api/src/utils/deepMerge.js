/**
 * @file deepMerge.js
 * High-performance, prototype-safe recursive deep merge utility with array merging strategy options.
 */

'use strict';

const UNSAFE_PROPERTIES = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Checks if a value is a non-null, non-array plain object.
 *
 * @param {any} val Value to check
 * @returns {boolean}
 */
export function isPlainObject(val) {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) {
    return false;
  }
  const proto = Object.getPrototypeOf(val);
  return proto === null || proto === Object.prototype;
}

/**
 * Deeply merges multiple source objects into target object safely.
 *
 * @param {Object} target Target object
 * @param {...Object} sources Source objects to merge
 * @returns {Object} Deeply merged target object
 */
export function deepMerge(target, ...sources) {
  if (target === null || typeof target !== 'object' || Array.isArray(target)) {
    throw new TypeError('Target must be a plain object');
  }

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (!source || typeof source !== 'object') continue;

    const keys = Object.keys(source);
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      if (UNSAFE_PROPERTIES.has(key)) continue;

      const sourceVal = source[key];
      const targetVal = target[key];

      if (Array.isArray(sourceVal)) {
        target[key] = sourceVal.map((item) => (isPlainObject(item) ? deepMerge({}, item) : item));
      } else if (isPlainObject(sourceVal)) {
        if (!isPlainObject(targetVal)) {
          target[key] = {};
        }
        deepMerge(target[key], sourceVal);
      } else if (sourceVal !== undefined) {
        target[key] = sourceVal;
      }
    }
  }

  return target;
}