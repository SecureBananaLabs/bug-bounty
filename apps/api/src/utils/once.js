/**
 * Defensive once utility with idempotent result caching, exception re-throwing/caching semantics,
 * context (`this`) preservation, reset capability, and async idempotent caching.
 *
 * Implements defenses against:
 * - Uncaught exception crashes on repeated invocations (CWE-755)
 * - Race conditions and redundant resource consumption in single-run initialization (CWE-400)
 * - Type mismatches and unexpected primitive/null invocations (CWE-1287)
 * - Scope context loss and prototype pollution
 */

/**
 * Creates a function that is restricted to invoking `fn` once.
 * Repeat calls return the value of the first invocation.
 *
 * @template {(...args: any[]) => any} T
 * @param {T} fn - The function to restrict to a single invocation
 * @param {object} [options={}] - Configuration options
 * @param {boolean} [options.rethrow=true] - Whether to re-throw a cached exception on repeat calls
 * @param {boolean} [options.retryOnError=false] - If true, failed calls do not lock the wrapper; subsequent calls retry
 * @param {any} [options.thisArg] - Explicit `this` context binding for fn
 * @param {boolean} [options.freezeResult=false] - Whether to freeze the returned object to prevent tampering
 * @returns {T & { called: boolean, result: any, error: any, hasError: boolean, fn: T, reset: () => void }}
 */
export function once(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError(`[once] Expected a function, received ${fn === null ? 'null' : typeof fn}`);
  }

  if (options !== null && typeof options !== 'object') {
    throw new TypeError(`[once] Expected options to be an object, received ${typeof options}`);
  }

  const {
    rethrow = true,
    retryOnError = false,
    thisArg,
    freezeResult = false,
  } = options;

  let called = false;
  let result;
  let error;
  let hasError = false;

  function onceWrapper(...args) {
    if (called) {
      if (hasError) {
        if (rethrow) {
          throw error;
        }
        return result;
      }
      return result;
    }

    called = true;
    const context = thisArg !== undefined ? thisArg : this;

    try {
      result = fn.apply(context, args);
      if (freezeResult && result !== null && typeof result === 'object' && !Object.isFrozen(result)) {
        try {
          Object.freeze(result);
        } catch {
          // Gracefully ignore freezing failures on non-extensible objects
        }
      }
      return result;
    } catch (err) {
      if (retryOnError) {
        called = false;
        throw err;
      }
      hasError = true;
      error = err;
      throw err;
    }
  }

  Object.defineProperty(onceWrapper, 'called', {
    get() {
      return called;
    },
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(onceWrapper, 'result', {
    get() {
      return result;
    },
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(onceWrapper, 'error', {
    get() {
      return error;
    },
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(onceWrapper, 'hasError', {
    get() {
      return hasError;
    },
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(onceWrapper, 'fn', {
    value: fn,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  onceWrapper.reset = function reset() {
    called = false;
    result = undefined;
    error = undefined;
    hasError = false;
  };

  return onceWrapper;
}

/**
 * Creates a strict once wrapper that throws an error if invoked more than once.
 *
 * @param {Function} fn - Function to restrict
 * @param {string} [customMessage] - Custom error message when invoked more than once
 * @returns {Function}
 */
once.strict = function strict(fn, customMessage) {
  if (typeof fn !== 'function') {
    throw new TypeError(`[once.strict] Expected a function, received ${fn === null ? 'null' : typeof fn}`);
  }

  let called = false;
  let result;

  const strictWrapper = function strictOnceWrapper(...args) {
    if (called) {
      throw new Error(customMessage || `[once.strict] Function "${fn.name || 'anonymous'}" can only be called once`);
    }
    called = true;
    result = fn.apply(this, args);
    return result;
  };

  Object.defineProperty(strictWrapper, 'called', {
    get() {
      return called;
    },
    enumerable: true,
    configurable: false,
  });

  strictWrapper.reset = function reset() {
    called = false;
    result = undefined;
  };

  return strictWrapper;
};

/**
 * Creates an asynchronous once wrapper that ensures an async function or Promise-producing
 * operation is executed exactly once, sharing the same Promise across all concurrent and subsequent callers.
 *
 * @param {Function} fn - Async function
 * @param {object} [options={}] - Options
 * @param {boolean} [options.retryOnError=false] - If true, on Promise rejection resets so subsequent calls retry
 * @returns {Function}
 */
once.async = function asyncOnce(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError(`[once.async] Expected a function, received ${fn === null ? 'null' : typeof fn}`);
  }

  const { retryOnError = false, thisArg } = options;
  let promise = null;
  let called = false;

  const asyncWrapper = function asyncOnceWrapper(...args) {
    if (promise !== null) {
      return promise;
    }

    called = true;
    const context = thisArg !== undefined ? thisArg : this;

    try {
      const res = fn.apply(context, args);
      promise = Promise.resolve(res);
    } catch (err) {
      promise = Promise.reject(err);
    }

    if (retryOnError) {
      promise.catch(() => {
        promise = null;
        called = false;
      });
    }

    return promise;
  };

  Object.defineProperty(asyncWrapper, 'called', {
    get() {
      return called;
    },
    enumerable: true,
    configurable: false,
  });

  asyncWrapper.reset = function reset() {
    promise = null;
    called = false;
  };

  return asyncWrapper;
};

once.once = once;

export default once;
