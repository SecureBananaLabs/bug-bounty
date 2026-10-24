/**
 * Pauses execution for a specified duration in milliseconds.
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes an asynchronous function with defensive exponential backoff and retry mechanisms.
 *
 * @template T
 * @param {() => Promise<T>|T} fn - The async or sync function to execute
 * @param {Object} [options={}] - Retry configuration options
 * @param {number} [options.retries=3] - Maximum number of retries after an initial failure
 * @param {number} [options.delay=100] - Initial delay in milliseconds before the first retry
 * @param {number} [options.backoff=2] - Exponential multiplier for subsequent retries
 * @param {number} [options.maxDelay=30000] - Maximum upper bound for retry delay in milliseconds
 * @param {(error: any, attempt: number) => boolean} [options.shouldRetry] - Predicate to determine if retry is allowed
 * @param {(error: any, attempt: number, nextDelay: number) => void} [options.onRetry] - Hook invoked prior to each retry sleep
 * @returns {Promise<T>} Resolves with the return value of fn
 */
export async function retryAsync(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a callable function');
  }

  const {
    retries = 3,
    delay = 100,
    backoff = 2,
    maxDelay = 30000,
    shouldRetry = () => true,
    onRetry = null,
  } = options;

  if (typeof retries !== 'number' || retries < 0 || !Number.isInteger(retries)) {
    throw new TypeError('retries must be a non-negative integer');
  }

  if (typeof delay !== 'number' || delay < 0) {
    throw new TypeError('delay must be a non-negative number');
  }

  if (typeof backoff !== 'number' || backoff < 1) {
    throw new TypeError('backoff must be a number greater than or equal to 1');
  }

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;

      if (attempt > retries) {
        throw err;
      }

      if (typeof shouldRetry === 'function' && !shouldRetry(err, attempt)) {
        throw err;
      }

      // Calculate exponential backoff capped by maxDelay
      const nextDelay = Math.min(delay * Math.pow(backoff, attempt - 1), maxDelay);

      if (typeof onRetry === 'function') {
        try {
          onRetry(err, attempt, nextDelay);
        } catch {
          // Prevent logging / hook failure from interrupting retry flow
        }
      }

      if (nextDelay > 0) {
        await sleep(nextDelay);
      }
    }
  }
}
