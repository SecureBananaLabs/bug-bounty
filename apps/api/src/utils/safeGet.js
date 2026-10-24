/**
 * Toxic property names that could lead to Prototype Pollution or sandbox escape.
 */
const FORBIDDEN_PROPERTIES = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Parses a string path or array path into a list of normalized string/symbol keys.
 * Handles dot notation ('a.b.c'), bracket notation ('items[0].name', 'a["b"]'),
 * and array of keys.
 *
 * @param {string|Array<string|number|symbol>} path
 * @returns {Array<string|symbol>}
 */
function parsePath(path) {
  if (Array.isArray(path)) {
    return path.map(segment => (typeof segment === 'symbol' ? segment : String(segment)));
  }

  if (typeof path !== 'string' || path.length === 0) {
    return [];
  }

  const segments = [];
  const len = path.length;
  let current = '';
  let inBracket = false;
  let quoteChar = null;

  for (let i = 0; i < len; i++) {
    const char = path[i];

    if (inBracket) {
      if (quoteChar) {
        if (char === quoteChar && path[i - 1] !== '\\') {
          quoteChar = null;
        } else {
          current += char;
        }
      } else if (char === '\'' || char === '"') {
        quoteChar = char;
      } else if (char === ']') {
        inBracket = false;
        if (current.length > 0) {
          segments.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    } else if (char === '[') {
      if (current.length > 0) {
        segments.push(current);
        current = '';
      }
      inBracket = true;
    } else if (char === '.') {
      if (current.length > 0) {
        segments.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    segments.push(current);
  }

  return segments;
}

/**
 * Safely accesses deeply nested properties in objects, arrays, and Maps,
 * defending against Prototype Pollution and null/undefined dereferencing.
 *
 * @template T
 * @param {any} target - The source object or array to traverse
 * @param {string|Array<string|number|symbol>} path - The property path
 * @param {T} [defaultValue=undefined] - Fallback value if resolved value is undefined
 * @returns {any|T}
 */
export function safeGet(target, path, defaultValue = undefined) {
  if (target === null || target === undefined) {
    return defaultValue;
  }

  const keys = parsePath(path);
  if (keys.length === 0) {
    return defaultValue;
  }

  let current = target;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    // Prototype pollution defense: reject toxic prototype properties
    if (typeof key === 'string' && FORBIDDEN_PROPERTIES.has(key)) {
      return defaultValue;
    }

    if (current === null || current === undefined) {
      return defaultValue;
    }

    if (current instanceof Map) {
      current = current.get(key);
    } else if (typeof current === 'object' || typeof current === 'function') {
      current = current[key];
    } else {
      // Primitive types (string, number, etc.) cannot have further nested custom properties
      return defaultValue;
    }
  }

  return current === undefined ? defaultValue : current;
}
