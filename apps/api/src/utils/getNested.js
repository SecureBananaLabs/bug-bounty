/**
 * @file getNested.js
 * Prototype-safe deeply nested property getter utility.
 */

'use strict';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Splits a path string or array into normalized key tokens.
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

  const normalized = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  return normalized.split('.').filter(Boolean);
}

/**
 * Safely gets a deeply nested property from an object with prototype pollution guards and fallback defaults.
 *
 * @param {Object} obj - The source object.
 * @param {string|Array<string|number>} path - Path to the property.
 * @param {*} [defaultValue=undefined] - Fallback default value if property is missing or undefined.
 * @returns {*} The resolved value or defaultValue.
 */
export function getNested(obj, path, defaultValue = undefined) {
  if (obj == null || typeof obj !== 'object') {
    return defaultValue;
  }

  const keys = parsePath(path);
  if (keys.length === 0) {
    return defaultValue;
  }

  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    // Block access to forbidden prototype attributes
    if (FORBIDDEN_KEYS.has(key)) {
      return defaultValue;
    }

    if (current == null || typeof current !== 'object') {
      return defaultValue;
    }

    // Safely verify property presence if necessary
    current = current[key];
    if (current === undefined) {
      return defaultValue;
    }
  }

  return current !== undefined ? current : defaultValue;
}
