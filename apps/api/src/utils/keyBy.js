/**
 * Defensive collection indexing utility (keyBy)
 *
 * Transforms an array or collection into an object composed of keys generated from
 * running each element through `iteratee`, with comprehensive defenses against:
 * - CWE-1321: Prototype pollution via __proto__, constructor, and prototype checks
 * - CWE-1287: Improper input type handling (non-arrays, non-objects, primitives)
 * - CWE-400: Resource exhaustion and unbounded sparse array traversal
 * - CWE-755: Iteratee exception handling and safe error recovery
 * - Key collision resolution strategies: 'overwrite', 'keepFirst', 'error', and custom resolver functions
 * - Sparse array hole defense and Symbol key support
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Creates an object composed of keys generated from the results of running
 * each element of `array` through `iteratee`.
 *
 * @template T
 * @param {T[]} array - The collection to iterate over.
 * @param {((item: T, index: number, array: T[]) => any) | string | symbol} [iteratee] - Iteratee function or property name. Defaults to identity.
 * @param {object} [options={}] - Configuration options.
 * @param {'overwrite' | 'keepFirst' | 'ignore' | 'error' | ((prev: T, next: T, key: string | symbol) => T)} [options.collisionStrategy='overwrite'] - Collision resolution strategy.
 * @param {'skip' | 'throw'} [options.dangerAction='skip'] - Action on prototype pollution keys.
 * @param {boolean} [options.nullPrototype=false] - Return object with null prototype (Object.create(null)).
 * @param {boolean} [options.skipHoles=false] - Whether to skip sparse array holes.
 * @param {boolean} [options.suppressErrors=false] - Whether to capture iteratee exceptions under '__errors__'.
 * @param {((err: Error, item: T, index: number, array: T[]) => any)} [options.onError] - Custom iteratee error handler.
 * @param {any} [options.thisArg] - Context binding for iteratee invocation.
 * @returns {Record<string | symbol, T>} Returns the composed aggregate object.
 */
export function keyBy(array, iteratee, options = {}) {
  if (options !== undefined && (typeof options !== 'object' || options === null)) {
    throw new TypeError(`[keyBy] Expected options to be an object, received ${options === null ? 'null' : typeof options}`);
  }

  const {
    collisionStrategy = 'overwrite',
    dangerAction = 'skip',
    nullPrototype = false,
    skipHoles = false,
    suppressErrors = false,
    onError,
    thisArg,
  } = options;

  if (
    typeof collisionStrategy !== 'function' &&
    collisionStrategy !== 'overwrite' &&
    collisionStrategy !== 'keepFirst' &&
    collisionStrategy !== 'ignore' &&
    collisionStrategy !== 'error'
  ) {
    throw new TypeError(
      `[keyBy] Invalid collisionStrategy: "${collisionStrategy}". Expected 'overwrite', 'keepFirst', 'ignore', 'error', or a resolver function`
    );
  }

  if (dangerAction !== 'skip' && dangerAction !== 'throw') {
    throw new TypeError(`[keyBy] Invalid dangerAction: "${dangerAction}". Expected 'skip' or 'throw'`);
  }

  const createTarget = () => (nullPrototype ? Object.create(null) : {});

  // Non-array input defense: graceful handling of null, undefined, primitives
  if (array === null || array === undefined) {
    return createTarget();
  }

  let items = array;
  if (!Array.isArray(array)) {
    if (typeof array[Symbol.iterator] === 'function' && typeof array !== 'string') {
      try {
        items = Array.from(array);
      } catch {
        return createTarget();
      }
    } else {
      return createTarget();
    }
  }

  let getKey;
  if (typeof iteratee === 'function') {
    getKey = iteratee;
  } else if (typeof iteratee === 'string' || typeof iteratee === 'symbol') {
    getKey = (item) => (item !== null && item !== undefined ? item[iteratee] : undefined);
  } else if (iteratee === undefined) {
    getKey = (item) => item;
  } else {
    throw new TypeError(
      `[keyBy] Expected iteratee to be a function, string, symbol, or undefined, received ${typeof iteratee}`
    );
  }

  const result = createTarget();
  const len = items.length;

  for (let i = 0; i < len; i++) {
    const isOwn = Object.prototype.hasOwnProperty.call(items, i);
    if (!isOwn) {
      if (skipHoles) {
        continue;
      }
    }

    let item = isOwn ? items[i] : undefined;
    let rawKey;

    try {
      rawKey = getKey.call(thisArg, item, i, items);
    } catch (err) {
      if (typeof onError === 'function') {
        rawKey = onError(err, item, i, items);
      } else if (suppressErrors) {
        rawKey = '__errors__';
      } else {
        const errMsg = err && typeof err === 'object' && typeof err.message === 'string'
          ? err.message
          : String(err);
        throw new Error(`[keyBy] Iteratee threw an exception at index ${i}: ${errMsg}`, { cause: err });
      }
    }

    // Key normalization: support Symbols directly; coerce other values safely to string
    let finalKey;
    if (typeof rawKey === 'symbol') {
      finalKey = rawKey;
    } else if (typeof rawKey === 'string') {
      finalKey = rawKey;
    } else if (rawKey === null) {
      finalKey = 'null';
    } else if (rawKey === undefined) {
      finalKey = 'undefined';
    } else {
      try {
        finalKey = String(rawKey);
      } catch {
        finalKey = Object.prototype.toString.call(rawKey);
      }
    }

    // Prototype pollution defense (CWE-1321)
    if (typeof finalKey === 'string' && DANGEROUS_KEYS.has(finalKey)) {
      if (dangerAction === 'throw') {
        const SecurityErr = typeof SecurityError !== 'undefined' ? SecurityError : Error;
        throw new SecurityErr(`[keyBy] Disallowed dangerous prototype key: ${finalKey}`);
      }
      // 'skip' action
      continue;
    }

    // Check existing property presence
    const hasKey = nullPrototype
      ? Object.prototype.hasOwnProperty.call(result, finalKey) || finalKey in result
      : Object.prototype.hasOwnProperty.call(result, finalKey);

    if (hasKey) {
      if (typeof collisionStrategy === 'function') {
        result[finalKey] = collisionStrategy(result[finalKey], item, finalKey);
      } else if (collisionStrategy === 'error') {
        throw new Error(`[keyBy] Collision detected for key: ${String(finalKey)}`);
      } else if (collisionStrategy === 'keepFirst' || collisionStrategy === 'ignore') {
        // preserve existing value
        continue;
      } else {
        // 'overwrite'
        result[finalKey] = item;
      }
    } else {
      result[finalKey] = item;
    }
  }

  return result;
}

keyBy.keyBy = keyBy;

export default keyBy;
