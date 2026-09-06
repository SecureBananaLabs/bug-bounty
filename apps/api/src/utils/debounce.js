/**
 * Creates a debounced function that delays invoking func until after wait milliseconds.
 * @param {Function} fn - Function to debounce
 * @param {number} [waitMs=100] - Delay in milliseconds
 * @param {object} [options]
 * @param {boolean} [options.leading=false] - Execute on the leading edge
 * @param {boolean} [options.trailing=true] - Execute on the trailing edge
 * @returns {Function & { cancel: Function, flush: Function }}
 */
export function debounce(fn, waitMs = 100, options = {}) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let result;

  const leading = Boolean(options.leading);
  const trailing = options.trailing !== false;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    const isCallNow = leading && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing && lastArgs) {
        result = fn.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }
    }, waitMs);

    if (isCallNow) {
      result = fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }

    return result;
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      timeoutId = null;
      result = fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
    return result;
  };

  return debounced;
}
