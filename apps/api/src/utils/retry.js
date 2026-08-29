/**
 * @file retry.js
 * Asynchronous retry utility with exponential backoff, full jitter, and custom error filtering.
 */

'use strict';

/**
 * Retries an asynchronous function with exponential backoff and randomized jitter.
 *
 * @param {Function} fn - Asynchronous function to execute (attempt => Promise<*>).
 * @param {Object} [options]
 * @param {number} [options.retries=3] - Maximum retry attempts.
 * @param {number} [options.minTimeout=100] - Base delay in milliseconds.
 * @param {number} [options.maxTimeout=10000] - Maximum delay ceiling in milliseconds.
 * @param {number} [options.factor=2] - Exponential multiplier.
 * @param {boolean} [options.jitter=true] - Whether to apply full randomized jitter.
 * @param {Function} [options.retryIf] - Predicate (error) => boolean to determine if error is retryable.
 * @param {Function} [options.onRetry] - Callback (error, attempt, delayMs) => void.
 * @returns {Promise<*>}
 */
export async function retry(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError(`Expected a function in retry, received ${typeof fn}`);
  }

  const retries = typeof options.retries === 'number' && options.retries >= 0 ? options.retries : 3;
  const minTimeout = typeof options.minTimeout === 'number' && options.minTimeout >= 0 ? options.minTimeout : 100;
  const maxTimeout = typeof options.maxTimeout === 'number' && options.maxTimeout >= minTimeout ? options.maxTimeout : 10000;
  const factor = typeof options.factor === 'number' && options.factor >= 1 ? options.factor : 2;
  const jitter = options.jitter !== false;
  const retryIf = typeof options.retryIf === 'function' ? options.retryIf : () => true;
  const onRetry = typeof options.onRetry === 'function' ? options.onRetry : null;

  let attempt = 0;

  while (true) {
    attempt++;
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt > retries || !retryIf(err)) {
        throw err;
      }

      // Calculate exponential backoff delay
      const baseDelay = Math.min(maxTimeout, minTimeout * Math.pow(factor, attempt - 1));
      const delayMs = jitter ? Math.floor(Math.random() * (baseDelay + 1)) : baseDelay;

      if (onRetry) {
        onRetry(err, attempt, delayMs);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
