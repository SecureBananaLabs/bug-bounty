/**
 * Set of forbidden property keys that could lead to Prototype Pollution (CWE-1321).
 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Checks if a property key is unsafe for assignment or traversal.
 * Blocks '__proto__', 'constructor', and 'prototype' across all casing variations.
 *
 * @param {string|symbol} key - The property key to check
 * @returns {boolean} True if the key is dangerous
 */
export function isUnsafeKey(key) {
  if (typeof key !== 'string') return false;
  const lower = key.toLowerCase();
  return FORBIDDEN_KEYS.has(key) || FORBIDDEN_KEYS.has(lower);
}

/**
 * Checks whether an input value is a plain JavaScript object (created with {} or Object.create(null)).
 * Correctly distinguishes plain objects from null, primitives, arrays, Dates, RegExps,
 * Maps, Sets, Errors, Promises, and custom class instances across execution realms.
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if the value is a plain object
 */
export function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  let baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }
  return proto === baseProto;
}

/**
 * Deep clones a value (plain objects, arrays, dates, regExps, primitives) safely without prototype pollution.
 *
 * @param {unknown} value - Value to clone
 * @param {WeakMap} [visited=new WeakMap()] - Cycle tracking
 * @returns {unknown} Cloned value
 */
export function cloneDeep(value, visited = new WeakMap()) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }
  if (visited.has(value)) {
    return visited.get(value);
  }

  if (Array.isArray(value)) {
    const copy = [];
    visited.set(value, copy);
    for (let i = 0; i < value.length; i++) {
      copy[i] = cloneDeep(value[i], visited);
    }
    return copy;
  }

  if (isPlainObject(value)) {
    const copy = Object.create(Object.getPrototypeOf(value) === null ? null : Object.prototype);
    visited.set(value, copy);

    // Enumerable string keys
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (isUnsafeKey(key)) continue;
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        copy[key] = cloneDeep(value[key], visited);
      }
    }

    // Enumerable symbol keys
    const symbols = Object.getOwnPropertySymbols(value);
    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      if (Object.prototype.propertyIsEnumerable.call(value, sym)) {
        copy[sym] = cloneDeep(value[sym], visited);
      }
    }

    return copy;
  }

  return value;
}

/**
 * Safely assigns a property to a target object, ignoring non-writable properties.
 *
 * @param {object} target
 * @param {string|symbol} key
 * @param {unknown} val
 */
function safeAssign(target, key, val) {
  const desc = Object.getOwnPropertyDescriptor(target, key);
  if (desc && desc.writable === false && desc.set === undefined) {
    return;
  }
  try {
    target[key] = val;
  } catch {
    // Gracefully handle sealed or non-configurable descriptors
  }
}

/**
 * Internal recursive helper that merges a single source object into a target object.
 *
 * @param {object} target - Target object to merge into
 * @param {object} source - Source object providing properties
 * @param {object} options - Merge configuration options
 * @param {WeakMap} visited - WeakMap tracking visited sources to prevent circular reference recursion
 * @returns {object} Merged target object
 */
function mergeTwo(target, source, options, visited) {
  if (source === null || typeof source !== 'object') {
    return target;
  }

  // Handle array source merging
  if (Array.isArray(source)) {
    if (Array.isArray(target)) {
      if (typeof options.arrayMerge === 'function') {
        return options.arrayMerge(target, source, options);
      }
      if (options.arrayMode === 'concat') {
        return target.concat(cloneDeep(source, visited));
      }
      // Default: replace target array with cloned source array
      return cloneDeep(source, visited);
    }
    return cloneDeep(source, visited);
  }

  // Normalize target object
  let outTarget;
  if (target === null || typeof target !== 'object' || Array.isArray(target)) {
    outTarget = Object.create(Object.getPrototypeOf(source) === null ? null : Object.prototype);
  } else if (Object.isFrozen(target) || !Object.isExtensible(target)) {
    outTarget = cloneDeep(target, visited);
  } else {
    outTarget = target;
  }

  if (visited.has(source)) {
    return visited.get(source);
  }
  visited.set(source, outTarget);

  // Collect all own enumerable property keys (strings and symbols)
  const stringKeys = Object.keys(source);
  const symbolKeys = Object.getOwnPropertySymbols(source).filter(sym =>
    Object.prototype.propertyIsEnumerable.call(source, sym)
  );
  const allKeys = [...stringKeys, ...symbolKeys];

  for (let i = 0; i < allKeys.length; i++) {
    const key = allKeys[i];

    // Prototype pollution defense (CWE-1321)
    if (isUnsafeKey(key)) {
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }

    let sourceVal;
    try {
      sourceVal = source[key];
    } catch {
      continue;
    }

    if (sourceVal === undefined && options.ignoreUndefined === true) {
      continue;
    }

    const hasTargetKey = Object.prototype.hasOwnProperty.call(outTarget, key);
    const targetVal = hasTargetKey ? outTarget[key] : undefined;

    if (Array.isArray(sourceVal)) {
      if (Array.isArray(targetVal)) {
        if (typeof options.arrayMerge === 'function') {
          safeAssign(outTarget, key, options.arrayMerge(targetVal, sourceVal, key));
        } else if (options.arrayMode === 'concat') {
          safeAssign(outTarget, key, targetVal.concat(cloneDeep(sourceVal, visited)));
        } else {
          safeAssign(outTarget, key, cloneDeep(sourceVal, visited));
        }
      } else {
        safeAssign(outTarget, key, cloneDeep(sourceVal, visited));
      }
    } else if (isPlainObject(sourceVal)) {
      if (isPlainObject(targetVal)) {
        safeAssign(outTarget, key, mergeTwo(targetVal, sourceVal, options, visited));
      } else {
        const proto = Object.getPrototypeOf(sourceVal) === null ? null : Object.prototype;
        const newTarget = Object.create(proto);
        safeAssign(outTarget, key, mergeTwo(newTarget, sourceVal, options, visited));
      }
    } else {
      safeAssign(outTarget, key, cloneDeep(sourceVal, visited));
    }
  }

  return outTarget;
}

/**
 * Checks if an object is purely a configuration options bag for deepMerge.
 *
 * @param {unknown} obj
 * @returns {boolean}
 */
function isMergeOptions(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const knownKeys = ['arrayMode', 'arrayMerge', 'clone', 'ignoreUndefined', 'inPlace', 'freezeSafe'];
  const keys = Object.keys(obj);
  return keys.length > 0 && keys.every(k => knownKeys.includes(k));
}

/**
 * Prototype-pollution safe deep merge utility.
 * Recursively merges nested plain objects into target while strictly blocking
 * prototype pollution keys ('__proto__', 'constructor', 'prototype') across all variations.
 * Safely handles non-object inputs, arrays, null/undefined, and circular references.
 *
 * @param {object} target - Target object to merge into
 * @param {...(object|object[])} args - One or more source objects to merge, optionally ending with an options bag
 * @returns {object} Merged object
 */
export function deepMerge(target, ...args) {
  if (args.length === 0) {
    if (target !== null && typeof target === 'object' && !Array.isArray(target)) {
      return target;
    }
    return Array.isArray(target) ? target : {};
  }

  let options = {};
  let sources = args;

  if (args.length >= 2) {
    const last = args[args.length - 1];
    if (isMergeOptions(last)) {
      options = last;
      sources = args.slice(0, -1);
    }
  }

  let result;
  if (target !== null && typeof target === 'object') {
    if (options.clone || Object.isFrozen(target) || !Object.isExtensible(target)) {
      result = cloneDeep(target);
    } else {
      result = target;
    }
  } else {
    result = {};
  }

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (source === null || typeof source !== 'object') {
      continue;
    }
    result = mergeTwo(result, source, options, new WeakMap());
  }

  return result;
}

/**
 * Merges an array of objects in sequence using deepMerge.
 *
 * @param {object[]} items - Array of objects to merge
 * @param {object} [options={}] - Merge options
 * @returns {object}
 */
deepMerge.all = function all(items, options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return {};
  }
  let result = items[0];
  for (let i = 1; i < items.length; i++) {
    result = deepMerge(result, items[i], options);
  }
  return result;
};

export default deepMerge;
