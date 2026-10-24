const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Normalizes keys input into an iterable collection of string or symbol keys.
 *
 * @param {any} keys
 * @returns {(string | symbol)[]}
 */
function normalizeKeys(keys) {
  if (keys === null || keys === undefined) {
    return [];
  }
  if (Array.isArray(keys)) {
    return keys;
  }
  if (typeof keys === 'string' || typeof keys === 'symbol') {
    return [keys];
  }
  if (keys instanceof Set) {
    return Array.from(keys);
  }
  if (typeof keys[Symbol.iterator] === 'function') {
    return Array.from(keys);
  }
  return [];
}

/**
 * Defensively picks specified keys (strings or symbols) from a source object.
 *
 * Implements strict defenses against Prototype Pollution (CWE-1321),
 * ignores inherited prototype properties (enforcing own-property isolation),
 * and safely returns an empty dictionary for non-object inputs.
 *
 * @template T
 * @param {T} obj - Source object to pick properties from.
 * @param {(string | symbol)[] | string | symbol | Set<string | symbol>} keys - Property keys to include.
 * @param {object} [options={}] - Configuration options.
 * @param {boolean} [options.nullPrototype=false] - Whether to return an object with null prototype.
 * @param {'skip' | 'throw'} [options.dangerAction='skip'] - Action to take if dangerous keys are targeted.
 * @returns {Record<string | symbol, any>} Filtered object containing only allowed picked properties.
 */
export function pick(obj, keys, options = {}) {
  if (options !== undefined && (typeof options !== 'object' || options === null)) {
    throw new TypeError(`[pick] Expected options to be an object, received ${options === null ? 'null' : typeof options}`);
  }

  const { nullPrototype = false, dangerAction = 'skip' } = options;
  const result = nullPrototype ? Object.create(null) : {};

  if (obj === null || typeof obj !== 'object') {
    return result;
  }

  const keyList = normalizeKeys(keys);

  for (const k of keyList) {
    if (typeof k !== 'string' && typeof k !== 'symbol') {
      continue;
    }

    // Prototype pollution defense (CWE-1321)
    if (typeof k === 'string' && DANGEROUS_KEYS.has(k)) {
      if (dangerAction === 'throw') {
        throw new TypeError(`[pick] Disallowed dangerous prototype key: ${k}`);
      }
      continue;
    }

    // Own-property isolation: do not pick properties from prototype chain
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      Object.defineProperty(result, k, {
        value: obj[k],
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }

  return result;
}

/**
 * Defensively omits specified keys (strings or symbols) from a source object.
 *
 * Implements strict defenses against Prototype Pollution (CWE-1321),
 * ignores inherited prototype properties (enforcing own-property isolation),
 * and safely returns an empty dictionary for non-object inputs.
 *
 * @template T
 * @param {T} obj - Source object to omit properties from.
 * @param {(string | symbol)[] | string | symbol | Set<string | symbol>} keys - Property keys to exclude.
 * @param {object} [options={}] - Configuration options.
 * @param {boolean} [options.nullPrototype=false] - Whether to return an object with null prototype.
 * @param {'skip' | 'throw'} [options.dangerAction='skip'] - Action to take if dangerous keys are encountered.
 * @returns {Record<string | symbol, any>} Filtered object with specified keys omitted.
 */
export function omit(obj, keys, options = {}) {
  if (options !== undefined && (typeof options !== 'object' || options === null)) {
    throw new TypeError(`[omit] Expected options to be an object, received ${options === null ? 'null' : typeof options}`);
  }

  const { nullPrototype = false, dangerAction = 'skip' } = options;
  const result = nullPrototype ? Object.create(null) : {};

  if (obj === null || typeof obj !== 'object') {
    return result;
  }

  const rawKeyList = normalizeKeys(keys);
  const omitSet = new Set();

  for (const k of rawKeyList) {
    if (typeof k === 'string' && DANGEROUS_KEYS.has(k)) {
      if (dangerAction === 'throw') {
        throw new TypeError(`[omit] Disallowed dangerous prototype key in omit list: ${k}`);
      }
      continue;
    }
    omitSet.add(k);
  }

  // Enumerate own string and symbol properties
  const ownKeys = [
    ...Object.keys(obj),
    ...Object.getOwnPropertySymbols(obj),
  ];

  for (const k of ownKeys) {
    // Prototype pollution defense
    if (typeof k === 'string' && DANGEROUS_KEYS.has(k)) {
      continue;
    }

    if (omitSet.has(k)) {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      Object.defineProperty(result, k, {
        value: obj[k],
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }

  return result;
}

/**
 * Picks properties from an object that satisfy the predicate callback.
 *
 * @param {object} obj - Source object.
 * @param {(value: any, key: string | symbol, obj: object) => boolean} predicate - Predicate evaluator.
 * @param {object} [options={}]
 * @returns {Record<string | symbol, any>}
 */
export function pickBy(obj, predicate, options = {}) {
  if (typeof predicate !== 'function') {
    throw new TypeError(`[pickBy] Expected predicate to be a function, received ${typeof predicate}`);
  }
  if (obj === null || typeof obj !== 'object') {
    return options && options.nullPrototype ? Object.create(null) : {};
  }

  const keysToPick = [];
  const ownKeys = [
    ...Object.keys(obj),
    ...Object.getOwnPropertySymbols(obj),
  ];

  for (const k of ownKeys) {
    if (typeof k === 'string' && DANGEROUS_KEYS.has(k)) {
      continue;
    }
    if (predicate(obj[k], k, obj)) {
      keysToPick.push(k);
    }
  }

  return pick(obj, keysToPick, options);
}

/**
 * Omits properties from an object that satisfy the predicate callback.
 *
 * @param {object} obj - Source object.
 * @param {(value: any, key: string | symbol, obj: object) => boolean} predicate - Predicate evaluator.
 * @param {object} [options={}]
 * @returns {Record<string | symbol, any>}
 */
export function omitBy(obj, predicate, options = {}) {
  if (typeof predicate !== 'function') {
    throw new TypeError(`[omitBy] Expected predicate to be a function, received ${typeof predicate}`);
  }
  if (obj === null || typeof obj !== 'object') {
    return options && options.nullPrototype ? Object.create(null) : {};
  }

  const keysToOmit = [];
  const ownKeys = [
    ...Object.keys(obj),
    ...Object.getOwnPropertySymbols(obj),
  ];

  for (const k of ownKeys) {
    if (typeof k === 'string' && DANGEROUS_KEYS.has(k)) {
      continue;
    }
    if (predicate(obj[k], k, obj)) {
      keysToOmit.push(k);
    }
  }

  return omit(obj, keysToOmit, options);
}

export default { pick, omit, pickBy, omitBy };
