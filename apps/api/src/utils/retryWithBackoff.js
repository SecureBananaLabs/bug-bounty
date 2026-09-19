/**
 * Asynchronously retries a promise-returning function with exponential backoff and jitter.
 *
 * @param {Function} fn - Asynchronous function to execute.
 * @param {Object} [options={}] - Configuration options.
 * @param {number} [options.retries=3] - Maximum retry attempts.
 * @param {number} [options.initialDelayMs=100] - Initial delay in milliseconds.
 * @param {number} [options.maxDelayMs=5000] - Maximum delay cap in milliseconds.
 * @param {number} [options.factor=2] - Exponential multiplier.
 * @param {boolean} [options.jitter=true] - Whether to apply full jitter.
 * @param {Function} [options.shouldRetry=null] - Custom predicate function (err, attempt) => boolean.
 * @param {Function} [options.onRetry=null] - Callback invoked on each retry (err, attempt, delayMs) => void.
 * @param {AbortSignal} [options.signal=null] - AbortSignal to cancel pending retries.
 * @returns {Promise<*>} Result of the successful execution.
 */
export async function retryWithBackoff(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('retryWithBackoff requires a function as the first argument');
  }

  const {
    retries = 3,
    initialDelayMs = 100,
    maxDelayMs = 5000,
    factor = 2,
    jitter = true,
    shouldRetry = null,
    onRetry = null,
    signal = null,
  } = options;

  let attempt = 0;
  let currentDelay = Math.max(0, initialDelayMs);

  while (true) {
    if (signal && signal.aborted) {
      throw new Error('Operation aborted');
    }

    try {
      return await fn(attempt);
    } catch (err) {
      attempt++;

      if (attempt > retries) {
        throw err;
      }

      if (signal && signal.aborted) {
        throw new Error('Operation aborted');
      }

      if (typeof shouldRetry === 'function' && !shouldRetry(err, attempt)) {
        throw err;
      }

      // Calculate exponential backoff delay with optional jitter
      let delay = Math.min(currentDelay, maxDelayMs);
      if (jitter) {
        delay = Math.floor(Math.random() * delay);
      }

      if (typeof onRetry === 'function') {
        try {
          onRetry(err, attempt, delay);
        } catch (_) {
          // Ignore onRetry errors to maintain retry loop
        }
      }

      if (delay > 0) {
        await new Promise((resolve, reject) => {
          let timeoutId;
          const onAbort = () => {
            clearTimeout(timeoutId);
            reject(new Error('Operation aborted'));
          };

          if (signal) {
            signal.addEventListener('abort', onAbort, { once: true });
          }

          timeoutId = setTimeout(() => {
            if (signal) {
              signal.removeEventListener('abort', onAbort);
            }
            resolve();
          }, delay);
        });
      }

      currentDelay = Math.min(currentDelay * factor, maxDelayMs);
    }
  }
}
