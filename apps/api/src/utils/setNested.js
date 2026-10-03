/**
 * @file setNested.js
 * Prototype-safe deeply nested property setter utility.
 */

'use strict';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Splits a path string or array into normalized key tokens.
 * Supports dot notation ('a.b.c') and array indices ('a[0].b' or ['a', 0, 'b']).
 *
 * @param {string|Array<string|number>} path
 * @returns {string[]}
 */
function parsePath(path) {
  if (Array.isArray(path)) {
    return path.map(String);
  }
  if (typeof path !== 'string' || path.length === 0) {
    return [];
  }

  // Handle bracket notation and dot separators
  const normalized = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  return normalized.split('.').filter(Boolean);
}

/**
 * Safely sets a deeply nested property on an object, creating intermediate objects if necessary.
 * Protects against prototype pollution attacks on `__proto__`, `constructor`, and `prototype`.
 *
 * @param {Object} obj - The target object to modify.
 * @param {string|Array<string|number>} path - Path to the property.
 * @param {*} value - The value to set.
 * @returns {Object} The modified target object.
 */
export function setNested(obj, path, value) {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }

  const keys = parsePath(path);
  if (keys.length === 0) {
    return obj;
  }

  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // Block prototype pollution
    if (FORBIDDEN_KEYS.has(key)) {
      return obj;
    }

    if (current[key] == null || typeof current[key] !== 'object') {
      const nextKey = keys[i + 1];
      const isNextInteger = /^\d+$/.test(nextKey);
      current[key] = isNextInteger ? [] : {};
    }

    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (!FORBIDDEN_KEYS.has(lastKey)) {
    current[lastKey] = value;
  }

  return obj;
}
