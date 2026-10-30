/**
 * Defensive Object Flattening and Reconstruction Utilities
 * Hardened against prototype pollution (CWE-1321), memory exhaustion DOS (CWE-400),
 * circular reference deadlocks, and array reconstruction boundary flaws.
 *
 * @module utils/flatObject
 */

const DANGEROUS_KEYS = Object.freeze(new Set(['__proto__', 'constructor', 'prototype']));

/**
 * Determines whether a value should be treated as a composite container (object or array)
 * that is subject to recursive traversal.
 *
 * @param {unknown} val
 * @param {boolean} preserveArrays
 * @returns {boolean}
 */
function isContainer(val, preserveArrays) {
  if (val === null || typeof val !== 'object') return false;

  // Preserve built-in objects as atomic leaf values
  if (
    val instanceof Date ||
    val instanceof RegExp ||
    val instanceof Map ||
    val instanceof Set ||
    val instanceof Error ||
    (typeof ArrayBuffer !== 'undefined' && val instanceof ArrayBuffer) ||
    (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(val))
  ) {
    return false;
  }

  if (Array.isArray(val)) {
    return !preserveArrays;
  }

  return true;
}

/**
 * Flattens a nested object into a single-level dictionary of delimited key paths.
 *
 * @param {Record<string, any>} obj - The nested object to flatten
 * @param {object} [options={}] - Configuration options
 * @param {string} [options.delimiter='.'] - Key path separator
 * @param {boolean} [options.preserveArrays=false] - If true, arrays are preserved as leaf values
 * @param {boolean} [options.preserveEmpty=false] - If true, empty objects/arrays produce empty leaf entries
 * @param {number} [options.maxDepth=1000] - Maximum recursion depth
 * @returns {Record<string, any>} Flattened single-level key-value mapping
 */
export function flattenObject(obj, options = {}) {
  if (obj === null || typeof obj !== 'object') {
    return {};
  }

  const {
    delimiter = '.',
    preserveArrays = false,
    preserveEmpty = false,
    maxDepth = 1000,
  } = options;

  const result = {};
  const seen = new WeakSet();

  function recurse(curr, prefix, depth) {
    if (depth > maxDepth) {
      throw new RangeError(`flattenObject: Maximum recursion depth of ${maxDepth} exceeded.`);
    }

    if (curr !== null && typeof curr === 'object') {
      if (seen.has(curr)) {
        if (prefix) {
          result[prefix] = '[Circular]';
        }
        return;
      }
      seen.add(curr);
    }

    const keys = Array.isArray(curr)
      ? Array.from({ length: curr.length }, (_, i) => String(i))
      : Object.getOwnPropertyNames(curr);

    // Defense: filter out prototype pollution vectors
    const safeKeys = keys.filter((k) => !DANGEROUS_KEYS.has(k));

    if (safeKeys.length === 0 && prefix && preserveEmpty) {
      result[prefix] = Array.isArray(curr) ? [] : {};
      return;
    }

    for (const key of safeKeys) {
      const val = curr[key];
      const newKey = prefix ? `${prefix}${delimiter}${key}` : key;

      if (isContainer(val, preserveArrays)) {
        const childKeys = Array.isArray(val)
          ? Array.from({ length: val.length }, (_, i) => String(i))
          : Object.getOwnPropertyNames(val).filter((k) => !DANGEROUS_KEYS.has(k));

        if (childKeys.length === 0 && preserveEmpty) {
          result[newKey] = Array.isArray(val) ? [] : {};
        } else if (childKeys.length === 0 && !preserveEmpty) {
          // Empty container omitted when preserveEmpty is false
          continue;
        } else {
          recurse(val, newKey, depth + 1);
        }
      } else {
        result[newKey] = val;
      }
    }
  }

  recurse(obj, '', 0);
  return result;
}

/**
 * Reconstructs a deeply nested object from a flattened key-path dictionary.
 * Defends against prototype pollution (CWE-1321) and memory exhaustion DOS (CWE-400).
 *
 * @param {Record<string, any>} flatObj - Flattened dictionary of path -> value
 * @param {object} [options={}] - Configuration options
 * @param {string} [options.delimiter='.'] - Key path separator
 * @param {boolean} [options.preventPrototypePollution=true] - Strip or reject __proto__, constructor, prototype
 * @param {boolean} [options.arrays=true] - Reconstruct numeric keys into Arrays
 * @param {number} [options.maxArrayLength=10000] - Guard against huge sparse array DOS
 * @param {boolean} [options.nullPrototype=false] - Reconstruct plain objects with null prototype
 * @returns {Record<string, any>} Reconstructed nested object
 */
export function unflattenObject(flatObj, options = {}) {
  if (flatObj === null || typeof flatObj !== 'object' || Array.isArray(flatObj)) {
    return {};
  }

  const {
    delimiter = '.',
    preventPrototypePollution = true,
    arrays = true,
    maxArrayLength = 10000,
    nullPrototype = false,
  } = options;

  const createObj = () => (nullPrototype ? Object.create(null) : {});
  const root = createObj();

  for (const [rawKey, value] of Object.entries(flatObj)) {
    if (typeof rawKey !== 'string') continue;

    const segments = rawKey.split(delimiter);

    // Defense: Prototype Pollution screening
    if (preventPrototypePollution) {
      const isMalicious = segments.some((seg) => DANGEROUS_KEYS.has(seg));
      if (isMalicious) {
        continue;
      }
    }

    let curr = root;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      if (preventPrototypePollution && DANGEROUS_KEYS.has(seg)) {
        break;
      }

      const isLast = i === segments.length - 1;

      if (isLast) {
        curr[seg] = value;
      } else {
        const nextSeg = segments[i + 1];
        const nextIsNumeric = /^\d+$/.test(nextSeg);
        const nextIndex = nextIsNumeric ? Number(nextSeg) : -1;

        if (!(seg in curr) || curr[seg] === null || typeof curr[seg] !== 'object') {
          // Reconstruct container: Array vs Object
          if (arrays && nextIsNumeric && nextIndex >= 0 && nextIndex <= maxArrayLength) {
            curr[seg] = [];
          } else {
            curr[seg] = createObj();
          }
        }

        curr = curr[seg];
      }
    }
  }

  return root;
}

/**
 * Checks whether an object is already flat (contains no nested objects or arrays).
 *
 * @param {Record<string, any>} obj
 * @param {string} [delimiter='.']
 * @returns {boolean}
 */
export function isFlat(obj, delimiter = '.') {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }

  for (const [key, val] of Object.entries(obj)) {
    if (key.includes(delimiter)) return false;
    if (val !== null && typeof val === 'object') {
      if (
        !(val instanceof Date) &&
        !(val instanceof RegExp) &&
        !(val instanceof Error) &&
        !(typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(val))
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Safely un-flattens a key-path dictionary, returning a fallback on failure.
 *
 * @param {Record<string, any>} flatObj
 * @param {Record<string, any>} [fallback={}]
 * @param {object} [options={}]
 * @returns {Record<string, any>}
 */
export function safeUnflatten(flatObj, fallback = {}, options = {}) {
  try {
    return unflattenObject(flatObj, options);
  } catch {
    return fallback;
  }
}

export default {
  flattenObject,
  unflattenObject,
  isFlat,
  safeUnflatten,
};
