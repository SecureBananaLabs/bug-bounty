const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Groups elements of an array by the key returned from running each element
 * through `iteratee` (either a callback function, property key, or symbol).
 *
 * Implements defenses against Prototype Pollution (CWE-1321), Object.prototype
 * method shadowing/collisions, string/symbol key coercion, sparse array holes,
 * and iteratee exception handling.
 *
 * @template T
 * @param {T[]} array - Input collection to group.
 * @param {((item: T, index: number, array: T[]) => any) | string | symbol} [iteratee] - Grouping callback, property key, or symbol. Defaults to identity.
 * @param {object} [options={}] - Configuration options.
 * @param {any} [options.thisArg] - Context binding for iteratee invocation.
 * @param {boolean} [options.nullPrototype=false] - If true, returns an object with no prototype (Object.create(null)).
 * @param {boolean} [options.skipHoles=false] - Whether to skip sparse array holes.
 * @param {'skip' | 'throw'} [options.dangerAction='skip'] - Action to take when a dangerous key (__proto__, constructor, prototype) is produced.
 * @param {boolean} [options.suppressErrors=false] - If true, catches iteratee exceptions and groups item under 'errors'.
 * @param {((err: Error, item: T, index: number, array: T[]) => any)} [options.onError] - Custom exception handler.
 * @returns {Record<string | symbol, T[]>} Grouped dictionary object.
 */
export function groupBy(array, iteratee, options = {}) {
  if (options !== undefined && (typeof options !== 'object' || options === null)) {
    throw new TypeError(`[groupBy] Expected options to be an object, received ${options === null ? 'null' : typeof options}`);
  }

  // Empty input and non-array handling
  if (!Array.isArray(array)) {
    return options && options.nullPrototype ? Object.create(null) : {};
  }

  const {
    thisArg,
    nullPrototype = false,
    skipHoles = false,
    dangerAction = 'skip',
    suppressErrors = false,
    onError,
  } = options;

  let getKey;
  if (typeof iteratee === 'function') {
    getKey = iteratee;
  } else if (typeof iteratee === 'string' || typeof iteratee === 'symbol') {
    getKey = (item) => (item !== null && item !== undefined ? item[iteratee] : undefined);
  } else if (iteratee === undefined) {
    getKey = (item) => item;
  } else {
    throw new TypeError(
      `[groupBy] Expected iteratee to be a function, string, symbol, or undefined, received ${typeof iteratee}`
    );
  }

  const result = nullPrototype ? Object.create(null) : {};
  const len = array.length;

  for (let i = 0; i < len; i++) {
    // Sparse array defense: verify own property to prevent inheriting prototype pollution
    const isOwn = Object.prototype.hasOwnProperty.call(array, i);
    if (!isOwn) {
      if (skipHoles) {
        continue;
      }
    }

    let item;
    let rawKey;

    try {
      item = isOwn ? array[i] : undefined;
      rawKey = getKey.call(thisArg, item, i, array);
    } catch (err) {
      if (typeof onError === 'function') {
        rawKey = onError(err, item, i, array);
      } else if (suppressErrors) {
        rawKey = '__errors__';
      } else {
        const errMsg =
          err && typeof err === 'object' && typeof err.message === 'string'
            ? err.message
            : String(err);
        throw new Error(
          `[groupBy] Iteratee threw an exception at index ${i}: ${errMsg}`,
          { cause: err }
        );
      }
    }

    // Key normalization: support Symbols directly; coerce other values safely to String
    let finalKey;
    if (typeof rawKey === 'symbol') {
      finalKey = rawKey;
    } else if (typeof rawKey === 'string') {
      finalKey = rawKey;
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
        throw new SecurityErr(`[groupBy] Disallowed dangerous prototype key: ${finalKey}`);
      }
      // 'skip' action
      continue;
    }

    // Object.prototype collision defense: check own property rather than result[finalKey]
    if (!Object.prototype.hasOwnProperty.call(result, finalKey)) {
      result[finalKey] = [];
    }
    result[finalKey].push(item);
  }

  return result;
}

export default groupBy;
