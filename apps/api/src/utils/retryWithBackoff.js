/**
 * Asynchronously retries a promise-returning function with exponential backoff,
 * optional jitter, custom retry predicates, and AbortSignal cancellation support.
 *
 * @template T
 * @param {(attempt: number) => Promise<T>} fn - Asynchronous function to execute
 * @param {object} [options={}] - Configuration options
 * @param {number} [options.retries=3] - Maximum number of retry attempts after initial failure
 * @param {number} [options.initialDelayMs=100] - Base backoff delay in milliseconds
 * @param {number} [options.maxDelayMs=5000] - Maximum delay cap in milliseconds
 * @param {number} [options.factor=2] - Exponential multiplier per attempt
 * @param {boolean} [options.jitter=true] - Whether to apply randomized jitter to backoff delay
 * @param {(error: any, attempt: number) => boolean} [options.shouldRetry] - Predicate to decide if error is retryable
 * @param {(error: any, attempt: number, delayMs: number) => void} [options.onRetry] - Hook invoked before each retry
 * @param {AbortSignal} [options.signal] - Optional AbortSignal to cancel in-flight retries
 * @returns {Promise<T>}
 */
export async function retryWithBackoff(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function to execute');
  }

  const retries =
    typeof options.retries === 'number' && Number.isFinite(options.retries) && options.retries >= 0
      ? Math.floor(options.retries)
      : 3;
  const initialDelayMs =
    typeof options.initialDelayMs === 'number' && options.initialDelayMs >= 0
      ? options.initialDelayMs
      : 100;
  const maxDelayMs =
    typeof options.maxDelayMs === 'number' && options.maxDelayMs >= 0
      ? options.maxDelayMs
      : 5000;
  const factor =
    typeof options.factor === 'number' && options.factor > 0 ? options.factor : 2;
  const jitter = options.jitter !== undefined ? Boolean(options.jitter) : true;
  const shouldRetry =
    typeof options.shouldRetry === 'function' ? options.shouldRetry : () => true;
  const onRetry = typeof options.onRetry === 'function' ? options.onRetry : null;
  const signal = options.signal || null;

  let attempt = 0;

  while (true) {
    if (signal && signal.aborted) {
      throw signal.reason || new Error('Operation aborted');
    }

    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error, attempt + 1)) {
        throw error;
      }

      attempt++;
      const exponential = Math.min(maxDelayMs, initialDelayMs * Math.pow(factor, attempt - 1));
      const delayMs = jitter ? Math.floor(Math.random() * exponential) : exponential;

      if (onRetry) {
        onRetry(error, attempt, delayMs);
      }

      await new Promise((resolve, reject) => {
        if (signal && signal.aborted) {
          reject(signal.reason || new Error('Operation aborted'));
          return;
        }

        const timer = setTimeout(() => {
          if (signal) {
            signal.removeEventListener('abort', onAbort);
          }
          resolve();
        }, delayMs);

        function onAbort() {
          clearTimeout(timer);
          reject(signal.reason || new Error('Operation aborted'));
        }

        if (signal) {
          signal.addEventListener('abort', onAbort, { once: true });
        }
      });
    }
  }
}

export default retryWithBackoff;
