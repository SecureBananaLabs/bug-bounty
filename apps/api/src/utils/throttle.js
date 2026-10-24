/**
 * Defensive, high-performance throttle utility with configurable leading/trailing edges,
 * .cancel(), .flush(), .pending() lifecycle controls, execution context preservation,
 * and strict boundary validation.
 *
 * Implements defenses against:
 * - CWE-400: Uncontrolled resource consumption / event loop starvation under high-frequency triggers
 * - CWE-1287: Improper input type validation (strict function check, safe numeric wait clamping)
 * - CWE-755: Proper exception propagation across invocation boundaries
 * - Context preservation: Dynamic `this` binding and full argument forwarding
 * - Timer safety: Clamping timeout to 32-bit integer limits preventing setTimeout 1ms overflow
 *
 * @template {(...args: any[]) => any} T
 * @param {T} func - The target function to throttle.
 * @param {number} [wait=0] - The number of milliseconds to throttle invocations to.
 * @param {object} [options={}] - Options object.
 * @param {boolean} [options.leading=true] - Specify invoking on the leading edge.
 * @param {boolean} [options.trailing=true] - Specify invoking on the trailing edge.
 * @returns {T & { cancel: () => void, flush: () => any, pending: () => boolean }}
 */
export function throttle(func, wait = 0, options = {}) {
  if (typeof func !== 'function') {
    throw new TypeError(`[throttle] Expected first argument to be a function, received ${func === null ? 'null' : typeof func}`);
  }

  // Sanitize wait value: clamp to non-negative 32-bit signed int max (2147483647)
  const MAX_TIMEOUT = 2147483647;
  const numWait = Number(wait);
  const waitMs = Number.isFinite(numWait)
    ? Math.min(Math.max(0, Math.floor(numWait)), MAX_TIMEOUT)
    : 0;

  const opts = options && typeof options === 'object' ? options : {};
  const leading = 'leading' in opts ? Boolean(opts.leading) : true;
  const trailing = 'trailing' in opts ? Boolean(opts.trailing) : true;
  const onError = typeof opts.onError === 'function' ? opts.onError : null;

  let lastArgs;
  let lastThis;
  let result;
  let timerId;
  let lastCallTime;
  let lastInvokeTime = 0;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    try {
      result = func.apply(thisArg, args);
      return result;
    } catch (err) {
      if (onError) {
        onError(err);
        return result;
      }
      throw err;
    }
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, waitMs);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = waitMs - timeSinceLastCall;
    const maxWaitRemaining = waitMs - timeSinceLastInvoke;

    return Math.min(timeWaiting, maxWaitRemaining);
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= waitMs ||
      timeSinceLastCall < 0 ||
      timeSinceLastInvoke >= waitMs
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = setTimeout(timerExpired, Math.max(0, remainingWait(time)));
  }

  function trailingEdge(time) {
    timerId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
    timerId = undefined;
  }

  function flush() {
    if (timerId === undefined) {
      return result;
    }
    clearTimeout(timerId);
    return trailingEdge(Date.now());
  }

  function pending() {
    return timerId !== undefined;
  }

  function throttled(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      clearTimeout(timerId);
      timerId = setTimeout(timerExpired, waitMs);
      return leading ? invokeFunc(lastCallTime) : result;
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, Math.max(0, remainingWait(time)));
    }
    return result;
  }

  throttled.cancel = cancel;
  throttled.flush = flush;
  throttled.pending = pending;

  return throttled;
}

export default throttle;
