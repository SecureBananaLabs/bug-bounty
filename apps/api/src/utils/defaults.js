/**
 * Defensive defaults utility with Prototype Pollution Defense (CWE-1321),
 * Symbol key support, own-property isolation, and nested recursive defaulting.
 *
 * Implements strict defense against:
 * - Prototype Pollution attacks via __proto__, constructor, and prototype (CWE-1321)
 * - Prototype Setter Hijacking and read-only property collisions
 * - Circular references in nested defaults (CWE-400)
 * - Unchecked inherited property leakage from source prototype chains
 * - Non-object / primitive / null / undefined target and source handling (CWE-1287)
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Checks whether a key is dangerous for prototype pollution.
 * @param {string | symbol} key
 * @returns {boolean}
 */
export function isUnsafeKey(key) {
  return typeof key === 'string' && DANGEROUS_KEYS.has(key);
}

/**
 * Validates if a value is a plain JavaScript object.
 * @param {unknown} val
 * @returns {boolean}
 */
export function isPlainObject(val) {
  if (val === null || typeof val !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(val);
  return proto === null || proto === Object.prototype;
}

/**
 * Safely assigns an own property on target using Object.defineProperty.
 * Neutralizes prototype setter traps and prototype read-only shadowing.
 *
 * @param {object} target
 * @param {string | symbol} key
 * @param {unknown} val
 */
function safeAssign(target, key, val) {
  const desc = Object.getOwnPropertyDescriptor(target, key);
  if (desc && desc.configurable === false && desc.writable === false) {
    return;
  }
  try {
    Object.defineProperty(target, key, {
      value: val,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  } catch {
    try {
      target[key] = val;
    } catch {
      // Gracefully handle frozen or sealed targets
    }
  }
}

/**
 * Deep clones a value safely with prototype pollution screening and circular reference protection.
 *
 * @param {unknown} val
 * @param {WeakMap} [visited=new WeakMap()]
 * @returns {unknown}
 */
function cloneValue(val, visited = new WeakMap()) {
  if (val === null || typeof val !== 'object') {
    return val;
  }

  if (visited.has(val)) {
    return visited.get(val);
  }

  if (Array.isArray(val)) {
    const copy = [];
    visited.set(val, copy);
    for (let i = 0; i < val.length; i++) {
      copy[i] = cloneValue(val[i], visited);
    }
    return copy;
  }

  if (isPlainObject(val)) {
    const proto = Object.getPrototypeOf(val);
    const copy = proto === null ? Object.create(null) : {};
    visited.set(val, copy);

    // Enumerable string keys
    const keys = Object.keys(val);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (isUnsafeKey(k)) continue;
      if (Object.prototype.hasOwnProperty.call(val, k)) {
        safeAssign(copy, k, cloneValue(val[k], visited));
      }
    }

    // Enumerable Symbol keys
    const symbols = Object.getOwnPropertySymbols(val);
    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      if (Object.prototype.propertyIsEnumerable.call(val, sym)) {
        safeAssign(copy, sym, cloneValue(val[sym], visited));
      }
    }

    return copy;
  }

  return val;
}

/**
 * Inspects whether an object represents an internal options configuration bag.
 *
 * @param {unknown} obj
 * @returns {boolean}
 */
function isDefaultsOptions(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  if (obj._isDefaultsOptions === true) return true;

  const validKeys = new Set([
    'deep',
    'dangerAction',
    'nullPrototype',
    'includeSymbols',
    'ownOnly',
    'cloneTarget',
    'arrayMerge',
    'customizer',
  ]);

  const keys = Object.keys(obj);
  if (keys.length === 0) return false;

  let hasValid = false;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (!validKeys.has(k)) {
      return false; // contains extraneous keys; treat as regular source data object
    }
    const v = obj[k];
    if (k === 'deep' && typeof v === 'boolean') hasValid = true;
    if (k === 'dangerAction' && (v === 'skip' || v === 'throw')) hasValid = true;
    if (k === 'nullPrototype' && typeof v === 'boolean') hasValid = true;
    if (k === 'includeSymbols' && typeof v === 'boolean') hasValid = true;
    if (k === 'ownOnly' && typeof v === 'boolean') hasValid = true;
    if (k === 'cloneTarget' && typeof v === 'boolean') hasValid = true;
    if (k === 'arrayMerge' && (v === 'replace' || v === 'concat' || typeof v === 'function')) hasValid = true;
    if (k === 'customizer' && typeof v === 'function') hasValid = true;
  }

  return hasValid;
}

/**
 * Merges defaults from a single source object into a target object.
 *
 * @param {object} target
 * @param {object} source
 * @param {object} options
 * @param {WeakMap} visited
 * @returns {object}
 */
function applySourceDefaults(target, source, options, visited) {
  if (source === null || typeof source !== 'object') {
    return target;
  }

  if (visited.has(source)) {
    return target;
  }
  visited.set(source, target);

  const {
    deep = false,
    dangerAction = 'skip',
    includeSymbols = true,
    ownOnly = true,
    arrayMerge = 'replace',
    customizer,
  } = options;

  // Gather string keys
  let stringKeys;
  if (ownOnly) {
    stringKeys = Object.keys(source);
  } else {
    stringKeys = [];
    for (const k in source) {
      stringKeys.push(k);
    }
  }

  // Gather symbol keys if enabled
  let symbolKeys = [];
  if (includeSymbols) {
    const allSymbols = Object.getOwnPropertySymbols(source);
    for (let i = 0; i < allSymbols.length; i++) {
      const sym = allSymbols[i];
      if (!ownOnly || Object.prototype.propertyIsEnumerable.call(source, sym)) {
        symbolKeys.push(sym);
      }
    }
  }

  const allKeys = [...stringKeys, ...symbolKeys];

  for (let i = 0; i < allKeys.length; i++) {
    const key = allKeys[i];

    // Prototype pollution defense (CWE-1321)
    if (isUnsafeKey(key)) {
      if (dangerAction === 'throw') {
        const SecurityErr = typeof SecurityError !== 'undefined' ? SecurityError : Error;
        throw new SecurityErr(`[defaults] Disallowed dangerous prototype key: ${String(key)}`);
      }
      // 'skip' dangerous key
      continue;
    }

    if (ownOnly && !Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }

    let sourceVal;
    try {
      sourceVal = source[key];
    } catch {
      continue;
    }

    // Determine current value in target
    let targetVal;
    let hasTargetProp = false;
    try {
      hasTargetProp = Object.prototype.hasOwnProperty.call(target, key);
      targetVal = target[key];
    } catch {
      targetVal = undefined;
      hasTargetProp = false;
    }

    // Allow user customizer callback: (targetVal, sourceVal, key, target, source) => customVal
    if (typeof customizer === 'function') {
      const customVal = customizer(targetVal, sourceVal, key, target, source);
      if (customVal !== undefined) {
        safeAssign(target, key, customVal);
        continue;
      }
    }

    // Nested defaults recursion (deep mode)
    if (deep && isPlainObject(sourceVal)) {
      if (isPlainObject(targetVal)) {
        applySourceDefaults(targetVal, sourceVal, options, visited);
        continue;
      } else if (targetVal === undefined) {
        const proto = Object.getPrototypeOf(sourceVal) === null ? null : Object.prototype;
        const newNested = Object.create(proto);
        applySourceDefaults(newNested, sourceVal, options, visited);
        safeAssign(target, key, newNested);
        continue;
      }
    }

    // Array handling in deep mode
    if (deep && Array.isArray(sourceVal)) {
      if (Array.isArray(targetVal)) {
        if (typeof arrayMerge === 'function') {
          safeAssign(target, key, arrayMerge(targetVal, sourceVal, key));
        } else if (arrayMerge === 'concat') {
          safeAssign(target, key, targetVal.concat(cloneValue(sourceVal, visited)));
        }
        // Default 'replace': keep targetVal since it is already defined
        continue;
      }
    }

    // Standard defaults behavior: assign if target has no own property or targetVal is undefined
    if (!hasTargetProp || targetVal === undefined) {
      safeAssign(target, key, deep ? cloneValue(sourceVal, visited) : sourceVal);
    }
  }

  return target;
}

/**
 * Assigns own and enumerable properties of source objects to the destination
 * object for all destination properties that resolve to undefined.
 * Source objects are applied from left to right.
 *
 * @param {object} target - Destination object receiving default properties
 * @param {...object} args - Source objects, optionally followed by an options bag
 * @returns {object} Destination object with defaults applied
 */
export function defaults(target, ...args) {
  let options = {};
  let sources = args;

  if (args.length >= 1) {
    const last = args[args.length - 1];
    if (isDefaultsOptions(last)) {
      options = last;
      sources = args.slice(0, -1);
    }
  }

  const {
    nullPrototype = false,
    cloneTarget = false,
    dangerAction = 'skip',
  } = options;

  if (dangerAction !== 'skip' && dangerAction !== 'throw') {
    throw new TypeError(`[defaults] Invalid dangerAction: "${dangerAction}". Expected 'skip' or 'throw'`);
  }

  // Target normalization & non-object safety
  let result;
  if (target === null || target === undefined) {
    result = nullPrototype ? Object.create(null) : {};
  } else if (typeof target !== 'object' && typeof target !== 'function') {
    result = Object(target);
  } else if (cloneTarget || Object.isFrozen(target) || !Object.isExtensible(target)) {
    result = cloneValue(target);
  } else {
    result = target;
  }

  const visited = new WeakMap();

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (source === null || typeof source !== 'object') {
      continue;
    }
    applySourceDefaults(result, source, options, visited);
  }

  return result;
}

/**
 * Deep defaults helper: recursively assigns nested default properties.
 *
 * @param {object} target
 * @param {...object} sources
 * @returns {object}
 */
defaults.deep = function deep(target, ...sources) {
  const options = { deep: true, _isDefaultsOptions: true };
  return defaults(target, ...sources, options);
};

/**
 * Creates a configured defaults function bound with the specified options.
 *
 * @param {object} options
 * @returns {(target: object, ...sources: object[]) => object}
 */
defaults.withOptions = function withOptions(options = {}) {
  const mergedOptions = { ...options, _isDefaultsOptions: true };
  return function configuredDefaults(target, ...sources) {
    return defaults(target, ...sources, mergedOptions);
  };
};

/**
 * Applies defaults across an array of objects.
 *
 * @param {object[]} items - Array of objects where index 0 is destination
 * @param {object} [options={}] - Defaults options
 * @returns {object}
 */
defaults.all = function all(items, options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return options.nullPrototype ? Object.create(null) : {};
  }
  const [first, ...rest] = items;
  return defaults(first, ...rest, { ...options, _isDefaultsOptions: true });
};

defaults.defaults = defaults;

export default defaults;
