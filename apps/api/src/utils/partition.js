/**
 * Splits an array into two groups: elements that satisfy the predicate
 * and elements that do not.
 *
 * Implements strict type validation, sparse array defense against Array.prototype
 * pollution, and predicate exception safety.
 *
 * @template T
 * @param {T[]} array - Input array to partition. Must be a genuine Array.
 * @param {((item: T, index: number, array: T[]) => boolean) | string | symbol} [predicate=Boolean] -
 *   Evaluator function, property key string, or symbol.
 * @param {object} [options={}] - Optional configuration options.
 * @param {any} [options.thisArg] - Context binding for predicate execution.
 * @param {boolean} [options.skipHoles=false] - Whether to skip sparse array holes entirely.
 * @param {boolean} [options.suppressErrors=false] - When true, items where predicate throws are placed in non-matches rather than rethrowing.
 * @param {((err: Error, item: T, index: number, array: T[]) => boolean | 'omit' | 'throw')} [options.onError] - Custom exception handler.
 * @returns {[T[], T[]]} A 2-tuple: [matches, nonMatches].
 * @throws {TypeError} If array is not an Array or predicate is invalid.
 */
export function partition(array, predicate = Boolean, options = {}) {
  if (!Array.isArray(array)) {
    const actualType = array === null ? 'null' : typeof array;
    throw new TypeError(`[partition] Expected first argument to be an Array, received ${actualType}`);
  }

  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`[partition] Expected options to be an object, received ${options === null ? 'null' : typeof options}`);
  }

  let evaluator;
  if (typeof predicate === 'function') {
    evaluator = predicate;
  } else if (typeof predicate === 'string' || typeof predicate === 'symbol') {
    evaluator = (item) => Boolean(item !== null && item !== undefined && item[predicate]);
  } else {
    throw new TypeError(
      `[partition] Expected predicate to be a function, string, symbol, or undefined, received ${typeof predicate}`
    );
  }

  const {
    thisArg,
    skipHoles = false,
    suppressErrors = false,
    onError,
  } = options;

  const matches = [];
  const nonMatches = [];
  const len = array.length;

  for (let i = 0; i < len; i++) {
    // Sparse array defense: verify own property existence to avoid inheriting from Array.prototype
    const isOwn = Object.prototype.hasOwnProperty.call(array, i);
    if (!isOwn) {
      if (skipHoles) {
        continue;
      }
    }

    let item;
    let isMatch = false;

    try {
      item = isOwn ? array[i] : undefined;
      isMatch = Boolean(evaluator.call(thisArg, item, i, array));
    } catch (err) {
      if (typeof onError === 'function') {
        const handlerAction = onError(err, item, i, array);
        if (handlerAction === 'omit') {
          continue;
        } else if (handlerAction === 'throw') {
          throw err;
        } else {
          isMatch = Boolean(handlerAction);
        }
      } else if (suppressErrors) {
        isMatch = false;
      } else {
        const errMsg =
          err && typeof err === 'object' && typeof err.message === 'string'
            ? err.message
            : String(err);
        const wrappedError = new Error(
          `[partition] Predicate evaluation threw an exception at index ${i}: ${errMsg}`,
          { cause: err }
        );
        throw wrappedError;
      }
    }

    if (isMatch) {
      matches.push(item);
    } else {
      nonMatches.push(item);
    }
  }

  return [matches, nonMatches];
}

export default partition;
