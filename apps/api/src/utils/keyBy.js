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
  let actualIteratee = iteratee;
  let actualOptions = options;

  // Support 2-argument signature: keyBy(array, options)
  if (
    iteratee !== null &&
    typeof iteratee === 'object' &&
    !Array.isArray(iteratee) &&
    typeof iteratee[Symbol.iterator] !== 'function' &&
    Object.keys(options).length === 0
  ) {
    actualOptions = iteratee;
    actualIteratee = undefined;
  }

  if (actualOptions !== undefined && (typeof actualOptions !== 'object' || actualOptions === null)) {
    throw new TypeError(`[keyBy] Expected options to be an object, received ${actualOptions === null ? 'null' : typeof actualOptions}`);
  }

  const {
    collisionStrategy = 'overwrite',
    dangerAction = 'skip',
    nullPrototype = false,
    skipHoles = false,
    suppressErrors = false,
    onError,
    thisArg,
  } = actualOptions;

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
  if (typeof actualIteratee === 'function') {
    getKey = actualIteratee;
  } else if (typeof actualIteratee === 'string' || typeof actualIteratee === 'symbol') {
    getKey = (item) => (item !== null && item !== undefined ? item[actualIteratee] : undefined);
  } else if (actualIteratee === undefined) {
    getKey = (item) => item;
  } else {
    throw new TypeError(
      `[keyBy] Expected iteratee to be a function, string, symbol, or undefined, received ${typeof actualIteratee}`
    );
  }

  const result = createTarget();
  const len = items.length;

  // Optimize iteration for sparse arrays when skipHoles is true (CWE-400 resource exhaustion defense)
  const isSparseArray = Array.isArray(items) && skipHoles;
  const loopIndices = isSparseArray
    ? Object.keys(items)
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 0)
        .sort((a, b) => a - b)
    : null;

  const totalSteps = loopIndices ? loopIndices.length : len;

  for (let step = 0; step < totalSteps; step++) {
    const i = loopIndices ? loopIndices[step] : step;
    const isOwn = isSparseArray ? true : Object.prototype.hasOwnProperty.call(items, i);
    if (!isOwn) {
      if (skipHoles) {
        continue;
      }
    }

    let item = isOwn ? items[i] : undefined;
    let rawKey;
    let isSuppressedError = false;

    try {
      rawKey = getKey.call(thisArg, item, i, items);
    } catch (err) {
      if (typeof onError === 'function') {
        rawKey = onError(err, item, i, items);
      } else if (suppressErrors) {
        rawKey = '__errors__';
        isSuppressedError = true;
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
        try {
          finalKey = Object.prototype.toString.call(rawKey);
        } catch {
          finalKey = '[object Object]';
        }
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

    // Suppressed error collection: collect without collision errors or silent data loss
    if (isSuppressedError) {
      if (!hasKey) {
        Object.defineProperty(result, '__errors__', {
          value: item,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        const currentErrors = result.__errors__;
        if (Array.isArray(currentErrors)) {
          currentErrors.push(item);
        } else {
          result.__errors__ = [currentErrors, item];
        }
      }
      continue;
    }

    if (hasKey) {
      if (typeof collisionStrategy === 'function') {
        const resolvedVal = collisionStrategy(result[finalKey], item, finalKey);
        Object.defineProperty(result, finalKey, {
          value: resolvedVal,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else if (collisionStrategy === 'error') {
        throw new Error(`[keyBy] Collision detected for key: ${String(finalKey)}`);
      } else if (collisionStrategy === 'keepFirst' || collisionStrategy === 'ignore') {
        // preserve existing value
        continue;
      } else {
        // 'overwrite' using defineProperty to prevent prototype setter invocation or read-only crashes
        Object.defineProperty(result, finalKey, {
          value: item,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    } else {
      Object.defineProperty(result, finalKey, {
        value: item,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }

  return result;
}

keyBy.keyBy = keyBy;

export default keyBy;
