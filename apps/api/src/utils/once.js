/**
 * Guarantees a function is executed at most once.
 * On subsequent invocations, returns the cached result of the initial call.
 * Preserves `this` context and initial arguments.
 *
 * @param {Function} fn - Function to wrap.
 * @returns {Function} Single-execution wrapped function.
 */
export function once(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function');
  }
  let called = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

export default once;
