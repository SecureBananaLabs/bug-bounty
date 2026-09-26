/**
 * @file debounce.js
 * Advanced debounce utility with leading/trailing edges, maxWait cap, and lifecycle controls (cancel, flush, pending).
 */

'use strict';

/**
 * Creates a debounced function that delays invoking fn until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 *
 * @template {(...args: any[]) => any} T
 * @param {T} fn The function to debounce
 * @param {number} [wait=0] Milliseconds to delay
 * @param {Object} [options={}] Configuration options
 * @param {boolean} [options.leading=false] Specify invoking on the leading edge of the timeout
 * @param {boolean} [options.trailing=true] Specify invoking on the trailing edge of the timeout
 * @param {number} [options.maxWait] Maximum time fn is allowed to be delayed before it is invoked
 * @returns {T & { cancel: () => void, flush: () => any, pending: () => boolean }}
 */
export function debounce(fn, wait = 0, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('First argument fn must be a function');
  }

  const delay = Math.max(0, typeof wait === 'number' && !Number.isNaN(wait) ? wait : 0);
  const leading = Boolean(options.leading);
  const trailing = options.trailing !== undefined ? Boolean(options.trailing) : true;
  const maxWait = typeof options.maxWait === 'number' && !Number.isNaN(options.maxWait)
    ? Math.max(delay, options.maxWait)
    : null;

  let lastArgs = null;
  let lastThis = null;
  let result;
  let timerId = null;
  let lastCallTime = null;
  let lastInvokeTime = 0;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastInvokeTime = time;
    result = fn.apply(thisArg, args);
    return result;
  }

  function startTimer(pendingFunc, waitTime) {
    timerId = setTimeout(pendingFunc, waitTime);
  }

  function cancelTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    startTimer(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== null
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== null && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    lastThis = null;
    return result;
  }

  function cancel() {
    cancelTimer();
    lastInvokeTime = 0;
    lastArgs = null;
    lastCallTime = null;
    lastThis = null;
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
        startTimer(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === null) {
      startTimer(timerExpired, delay);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}