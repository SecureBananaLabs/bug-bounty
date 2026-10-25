/**
 * Executes an asynchronous function with exponential backoff and randomized jitter.
 * @template T
 * @param {() => Promise<T>} fn - Async task function
 * @param {object} [options]
 * @param {number} [options.maxRetries=3] - Maximum retry attempts
 * @param {number} [options.baseDelayMs=50] - Initial delay in milliseconds
 * @param {number} [options.maxDelayMs=2000] - Maximum delay ceiling
 * @param {(err: unknown) => boolean} [options.retryIf] - Custom retry filter predicate
 * @returns {Promise<T>}
 */
export async function retry(fn, options = {}) {
  const maxRetries = typeof options.maxRetries === 'number' ? Math.max(0, options.maxRetries) : 3;
  const baseDelayMs = typeof options.baseDelayMs === 'number' ? Math.max(1, options.baseDelayMs) : 50;
  const maxDelayMs = typeof options.maxDelayMs === 'number' ? Math.max(baseDelayMs, options.maxDelayMs) : 2000;
  const retryIf = typeof options.retryIf === 'function' ? options.retryIf : () => true;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries || !retryIf(err)) {
        throw err;
      }

      // Exponential backoff with full jitter
      const expDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      const jitterDelay = Math.floor(Math.random() * expDelay);

      await new Promise((resolve) => setTimeout(resolve, jitterDelay));
    }
  }
}
