/**
 * Defensive promise timeout / delay utilities (ref #743).
 */

export class TimeoutError extends Error {
  constructor(message, ms) {
    super(message);
    this.name = 'TimeoutError';
    this.code = 'ETIMEDOUT';
    this.timeout = ms;
  }
}

function validateMs(ms, name) {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) {
    throw new TypeError(`${name}: ms must be a finite number >= 0`);
  }
}

function validateOptions(options, name) {
  if (options !== undefined && options !== null && typeof options !== 'object') {
    throw new TypeError(`${name}: options must be an object`);
  }
  const opts = options || {};
  if (opts.signal !== undefined && (opts.signal === null || typeof opts.signal.aborted !== 'boolean'
      || typeof opts.signal.addEventListener !== 'function')) {
    throw new TypeError(`${name}: signal must be an AbortSignal`);
  }
  return opts;
}

function abortReason(signal) {
  if (signal.reason !== undefined) return signal.reason;
  const e = new Error('The operation was aborted');
  e.name = 'AbortError';
  return e;
}

/**
 * Resolve after ms. Rejects early if signal aborts. Timer is always cleaned up.
 */
export function delay(ms, options) {
  validateMs(ms, 'delay');
  const { signal, value } = validateOptions(options, 'delay');
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(abortReason(signal));
    let onAbort;
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve(value);
    }, ms);
    if (signal) {
      onAbort = () => {
        clearTimeout(timer);
        reject(abortReason(signal));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Race a promise (or a function returning one) against a timeout.
 * Always clears the timer and detaches abort listeners (no leaked handles).
 *
 * @param {Promise|Function} input
 * @param {number} ms
 * @param {{signal?: AbortSignal, message?: string, fallback?: Function}} [options]
 */
export function withTimeout(input, ms, options) {
  validateMs(ms, 'withTimeout');
  const opts = validateOptions(options, 'withTimeout');
  if (opts.fallback !== undefined && typeof opts.fallback !== 'function') {
    throw new TypeError('withTimeout: fallback must be a function');
  }
  const { signal } = opts;
  if (typeof input !== 'function' && !(input && typeof input.then === 'function')) {
    throw new TypeError('withTimeout: input must be a promise or a function');
  }

  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(abortReason(signal));
    let settled = false;
    let timer;
    let onAbort;

    const finish = (fn, v) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onAbort);
      fn(v);
    };

    timer = setTimeout(() => {
      if (opts.fallback) {
        try {
          finish(resolve, opts.fallback());
        } catch (err) {
          finish(reject, err);
        }
      } else {
        finish(reject, new TimeoutError(opts.message || `Operation timed out after ${ms}ms`, ms));
      }
    }, ms);

    if (signal) {
      onAbort = () => finish(reject, abortReason(signal));
      signal.addEventListener('abort', onAbort, { once: true });
    }

    let p;
    try {
      p = typeof input === 'function' ? input() : input;
    } catch (err) {
      return finish(reject, err);
    }
    Promise.resolve(p).then((v) => finish(resolve, v), (e) => finish(reject, e));
  });
}

export default withTimeout;
