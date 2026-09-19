/**
 * Create a debounced function that delays invocation until after waitMs
 * have elapsed since the last call.
 * @param {Function} fn - The function to debounce
 * @param {number} waitMs - The delay in milliseconds
 * @param {Object} [options] - Options
 * @param {boolean} [options.leading=false] - Invoke on the leading edge
 * @param {boolean} [options.trailing=true] - Invoke on the trailing edge
 * @returns {Function} Debounced function with .cancel() and .flush() methods
 */
export function debounce(fn, waitMs, options = {}) {
  const { leading = false, trailing = true } = options;
  let timerId = null;
  let lastArgs = null;
  let lastThis = null;
  let leadingCalled = false;

  const debounced = function (...args) {
    lastArgs = args;
    lastThis = this;

    if (timerId !== null) {
      clearTimeout(timerId);
    }

    if (leading && !leadingCalled) {
      fn.apply(this, args);
      leadingCalled = true;
    }

    if (trailing) {
      timerId = setTimeout(() => {
        if (trailing) {
          fn.apply(lastThis, lastArgs);
        }
        timerId = null;
        leadingCalled = false;
      }, waitMs);
    }
  };

  debounced.cancel = function () {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    leadingCalled = false;
  };

  debounced.flush = function () {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (trailing && lastArgs !== null) {
      fn.apply(lastThis, lastArgs);
    }
    leadingCalled = false;
  };

  return debounced;
}
