/**
 * Defensive debounce utility (ref #743).
 *
 * @param {Function} fn - function to debounce
 * @param {number} wait - delay in ms (finite, >= 0)
 * @param {object} [options]
 * @param {boolean} [options.leading=false] - invoke on the leading edge
 * @param {boolean} [options.trailing=true] - invoke on the trailing edge
 * @param {number} [options.maxWait] - maximum delay before a forced invocation
 * @param {Function} [options.onError] - receives errors thrown on timer-driven invocations
 * @returns {Function} debounced function with cancel(), flush(), pending()
 */
export function debounce(fn, wait, options) {
  if (typeof fn !== 'function') {
    throw new TypeError('debounce: fn must be a function');
  }
  if (typeof wait !== 'number' || !Number.isFinite(wait) || wait < 0) {
    throw new TypeError('debounce: wait must be a finite number >= 0');
  }
  if (options !== undefined && options !== null && typeof options !== 'object') {
    throw new TypeError('debounce: options must be an object');
  }
  const opts = options || {};
  const leading = opts.leading === true;
  const trailing = opts.trailing !== false;
  if (opts.onError !== undefined && typeof opts.onError !== 'function') {
    throw new TypeError('debounce: onError must be a function');
  }
  let maxWait;
  if (opts.maxWait !== undefined) {
    if (typeof opts.maxWait !== 'number' || !Number.isFinite(opts.maxWait) || opts.maxWait < 0) {
      throw new TypeError('debounce: maxWait must be a finite number >= 0');
    }
    maxWait = Math.max(opts.maxWait, wait);
  }

  let timerId;
  let maxTimerId;
  let lastArgs;
  let lastThis;
  let result;

  function clearTimers() {
    if (timerId !== undefined) clearTimeout(timerId);
    if (maxTimerId !== undefined) clearTimeout(maxTimerId);
    timerId = undefined;
    maxTimerId = undefined;
  }

  function invoke(fromTimer) {
    const args = lastArgs;
    const ctx = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    clearTimers();
    try {
      result = fn.apply(ctx, args);
    } catch (err) {
      if (fromTimer && opts.onError) {
        opts.onError(err);
        return result;
      }
      throw err;
    }
    return result;
  }

  function onTimer() {
    timerId = undefined;
    if (trailing && lastArgs !== undefined) {
      invoke(true);
    } else {
      lastArgs = undefined;
      lastThis = undefined;
      clearTimers();
    }
  }

  function debounced(...args) {
    const isFirst = timerId === undefined;
    lastArgs = args;
    lastThis = this;

    if (timerId !== undefined) clearTimeout(timerId);
    timerId = setTimeout(onTimer, wait);

    if (maxWait !== undefined && maxTimerId === undefined) {
      maxTimerId = setTimeout(() => {
        maxTimerId = undefined;
        if (lastArgs !== undefined && trailing) invoke(true);
      }, maxWait);
    }

    if (isFirst && leading) {
      // Leading edge: run now and make sure the trailing edge does not repeat the same call.
      const a = lastArgs;
      lastArgs = undefined;
      const ctx = lastThis;
      lastThis = undefined;
      result = fn.apply(ctx, a);
    }
    return result;
  }

  debounced.cancel = function cancel() {
    clearTimers();
    lastArgs = undefined;
    lastThis = undefined;
  };

  debounced.flush = function flush() {
    if (lastArgs !== undefined) return invoke(false);
    clearTimers();
    return result;
  };

  debounced.pending = function pending() {
    return timerId !== undefined;
  };

  return debounced;
}

export default debounce;
