/**
 * @file debounce.js
 * Configurable debounce utility with leading/trailing edges, maxWait cap, and cancellation/flushing.
 */

'use strict';

/**
 * Creates a debounced function that delays invoking `fn` until after `waitMs` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param {Function} fn - The function to debounce.
 * @param {number} [waitMs=0] - The number of milliseconds to delay.
 * @param {Object} [options]
 * @param {boolean} [options.leading=false] - Specify invoking on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true] - Specify invoking on the trailing edge of the timeout.
 * @param {number} [options.maxWait] - The maximum time `fn` is allowed to be delayed before it's invoked.
 * @returns {Function} Returns the new debounced function.
 */
export function debounce(fn, waitMs = 0, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError(`Expected a function in debounce, received ${typeof fn}`);
  }

  const wait = Math.max(0, Number(waitMs) || 0);
  const leading = Boolean(options.leading);
  const trailing = options.trailing !== false; // default true
  const maxWait = typeof options.maxWait === 'number' ? Math.max(wait, options.maxWait) : null;

  let lastArgs;
  let lastThis;
  let result;
  let timerId = null;
  let maxTimerId = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = fn.apply(thisArg, args);
    return result;
  }

  function startTimer(pendingFunc, waitTime) {
    return setTimeout(pendingFunc, waitTime);
  }

  function cancelTimer(id) {
    clearTimeout(id);
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    timerId = startTimer(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== null
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== null && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== null) {
      cancelTimer(timerId);
    }
    if (maxTimerId !== null) {
      cancelTimer(maxTimerId);
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = 0;
    lastThis = undefined;
    timerId = null;
    maxTimerId = null;
  }

  function flush() {
    return timerId === null ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timerId !== null;
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== null) {
        timerId = startTimer(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === null) {
      timerId = startTimer(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}
