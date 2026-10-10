/**
 * Wrap a function so it only executes once.
 * Subsequent calls return the cached result from the first invocation.
 * Errors are also cached — if the first call throws, every call throws.
 * @param {Function} fn - The function to wrap
 * @returns {Function} Wrapped function that only executes once
 */
export function once(fn) {
  let called = false;
  let result;
  let err;

  return function (...args) {
    if (called) {
      if (err) throw err;
      return result;
    }
    called = true;
    try {
      result = fn.apply(this, args);
      return result;
    } catch (e) {
      err = e;
      throw e;
    }
  };
}
