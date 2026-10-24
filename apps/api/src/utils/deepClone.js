/**
 * Defensive Deep Clone Utility
 * Hardened against prototype pollution (CWE-1321), circular reference deadlocks,
 * buffer view mutations, and Symbol property erasure.
 *
 * @module utils/deepClone
 */

const DANGEROUS_KEYS = Object.freeze(new Set(['__proto__', 'constructor', 'prototype']));

const TYPED_ARRAY_CONSTRUCTORS = Object.freeze([
  typeof Int8Array !== 'undefined' ? Int8Array : null,
  typeof Uint8Array !== 'undefined' ? Uint8Array : null,
  typeof Uint8ClampedArray !== 'undefined' ? Uint8ClampedArray : null,
  typeof Int16Array !== 'undefined' ? Int16Array : null,
  typeof Uint16Array !== 'undefined' ? Uint16Array : null,
  typeof Int32Array !== 'undefined' ? Int32Array : null,
  typeof Uint32Array !== 'undefined' ? Uint32Array : null,
  typeof Float32Array !== 'undefined' ? Float32Array : null,
  typeof Float64Array !== 'undefined' ? Float64Array : null,
  typeof BigInt64Array !== 'undefined' ? BigInt64Array : null,
  typeof BigUint64Array !== 'undefined' ? BigUint64Array : null,
].filter(Boolean));

/**
 * Checks if a value is an object or function suitable for reference tracking.
 *
 * @param {unknown} val
 * @returns {boolean}
 */
export function isCloneable(val) {
  return val !== null && (typeof val === 'object' || typeof val === 'function');
}

/**
 * Defensively clones any JavaScript data structure including nested objects,
 * arrays, Maps, Sets, Dates, RegExps, TypedArrays, ArrayBuffers, Errors, and Symbols.
 *
 * @param {any} value - Value to clone
 * @param {object} [options={}] - Clone options
 * @param {boolean} [options.preservePrototype=true] - Preserve prototype chain / null prototypes
 * @param {boolean} [options.preserveSymbols=true] - Copy own Symbol properties
 * @param {boolean} [options.preventPrototypePollution=true] - Guard against __proto__, constructor, prototype pollution
 * @param {number} [options.maxDepth=1000] - Maximum recursion depth before throwing error
 * @param {WeakMap} [seen] - Internal circular reference tracker
 * @param {number} [currentDepth=0] - Internal recursion depth tracker
 * @returns {any} Deeply cloned replica
 */
export function deepClone(value, options = {}, seen = new WeakMap(), currentDepth = 0) {
  // Primitives and functions are returned directly
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const {
    preservePrototype = true,
    preserveSymbols = true,
    preventPrototypePollution = true,
    maxDepth = 1000,
  } = options;

  if (currentDepth > maxDepth) {
    throw new RangeError(`deepClone: Maximum call depth of ${maxDepth} exceeded.`);
  }

  // Circular reference handling
  if (seen.has(value)) {
    return seen.get(value);
  }

  // 1. Date
  if (value instanceof Date) {
    const cloneDate = new Date(value.getTime());
    seen.set(value, cloneDate);
    return cloneDate;
  }

  // 2. RegExp
  if (value instanceof RegExp) {
    const cloneRegExp = new RegExp(value.source, value.flags);
    cloneRegExp.lastIndex = value.lastIndex;
    seen.set(value, cloneRegExp);
    return cloneRegExp;
  }

  // 3. ArrayBuffer & SharedArrayBuffer
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    const cloneBuffer = value.slice(0);
    seen.set(value, cloneBuffer);
    return cloneBuffer;
  }

  // 4. DataView
  if (typeof DataView !== 'undefined' && value instanceof DataView) {
    const bufferClone = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    const cloneDataView = new DataView(bufferClone);
    seen.set(value, cloneDataView);
    return cloneDataView;
  }

  // 5. TypedArrays (Uint8Array, Float64Array, etc.)
  for (const Ctor of TYPED_ARRAY_CONSTRUCTORS) {
    if (value instanceof Ctor) {
      const bufferClone = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
      const cloneTypedArray = new Ctor(bufferClone);
      seen.set(value, cloneTypedArray);
      return cloneTypedArray;
    }
  }

  // 6. Map
  if (value instanceof Map) {
    const cloneMap = new Map();
    seen.set(value, cloneMap);
    for (const [k, v] of value.entries()) {
      const clonedKey = deepClone(k, options, seen, currentDepth + 1);
      const clonedVal = deepClone(v, options, seen, currentDepth + 1);
      cloneMap.set(clonedKey, clonedVal);
    }
    return cloneMap;
  }

  // 7. Set
  if (value instanceof Set) {
    const cloneSet = new Set();
    seen.set(value, cloneSet);
    for (const item of value.values()) {
      cloneSet.add(deepClone(item, options, seen, currentDepth + 1));
    }
    return cloneSet;
  }

  // 8. Error
  if (value instanceof Error) {
    const cloneError = new value.constructor(value.message);
    seen.set(value, cloneError);
    if (value.name) cloneError.name = value.name;
    if (value.stack) cloneError.stack = value.stack;
    if ('cause' in value) {
      cloneError.cause = deepClone(value.cause, options, seen, currentDepth + 1);
    }
    return cloneError;
  }

  // 9. Array
  if (Array.isArray(value)) {
    const cloneArr = [];
    seen.set(value, cloneArr);

    for (let i = 0; i < value.length; i++) {
      if (Object.prototype.hasOwnProperty.call(value, i)) {
        cloneArr[i] = deepClone(value[i], options, seen, currentDepth + 1);
      }
    }

    // Copy any non-numeric or Symbol own properties on Array
    const extraKeys = Object.getOwnPropertyNames(value);
    for (const key of extraKeys) {
      if (key === 'length' || /^\d+$/.test(key)) continue;
      if (preventPrototypePollution && DANGEROUS_KEYS.has(key)) continue;
      cloneArr[key] = deepClone(value[key], options, seen, currentDepth + 1);
    }

    if (preserveSymbols) {
      const symbols = Object.getOwnPropertySymbols(value);
      for (const sym of symbols) {
        cloneArr[sym] = deepClone(value[sym], options, seen, currentDepth + 1);
      }
    }

    return cloneArr;
  }

  // 10. Plain Objects / Custom Objects
  const proto = Object.getPrototypeOf(value);
  let cloneObj;

  if (!preservePrototype || proto === null) {
    cloneObj = Object.create(null);
  } else if (proto === Object.prototype) {
    cloneObj = {};
  } else {
    cloneObj = Object.create(proto);
  }

  seen.set(value, cloneObj);

  // Copy string own keys
  const keys = Object.getOwnPropertyNames(value);
  for (const key of keys) {
    if (preventPrototypePollution && DANGEROUS_KEYS.has(key)) {
      continue;
    }

    const desc = Object.getOwnPropertyDescriptor(value, key);
    if (!desc) continue;

    if ('value' in desc) {
      const clonedPropValue = deepClone(desc.value, options, seen, currentDepth + 1);
      Object.defineProperty(cloneObj, key, {
        value: clonedPropValue,
        writable: desc.writable,
        enumerable: desc.enumerable,
        configurable: desc.configurable,
      });
    } else {
      // Accessor descriptor (getter/setter)
      Object.defineProperty(cloneObj, key, desc);
    }
  }

  // Copy Symbol own keys
  if (preserveSymbols) {
    const symbols = Object.getOwnPropertySymbols(value);
    for (const sym of symbols) {
      const desc = Object.getOwnPropertyDescriptor(value, sym);
      if (!desc) continue;

      if ('value' in desc) {
        const clonedPropValue = deepClone(desc.value, options, seen, currentDepth + 1);
        Object.defineProperty(cloneObj, sym, {
          value: clonedPropValue,
          writable: desc.writable,
          enumerable: desc.enumerable,
          configurable: desc.configurable,
        });
      } else {
        Object.defineProperty(cloneObj, sym, desc);
      }
    }
  }

  return cloneObj;
}

/**
 * Safely executes deepClone and returns a fallback value if an error occurs.
 *
 * @param {any} value - Value to clone
 * @param {any} [fallback=null] - Fallback value on failure
 * @param {object} [options={}] - Clone options
 * @returns {any}
 */
export function safeClone(value, fallback = null, options = {}) {
  try {
    return deepClone(value, options);
  } catch {
    return fallback;
  }
}

export default deepClone;
