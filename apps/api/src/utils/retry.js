/**
 * Retry utility for resilient async operations.
 * Retries a given async function up to N times with exponential backoff.
 */

/**
 * Retries an async function up to maxRetries times with exponential backoff.
 * @param {Function} fn The async function to retry. Must return a Promise.
 * @param {Object} [options] Configuration options.
 * @param {number} [options.maxRetries=3] Maximum number of retry attempts.
 * @param {number} [options.baseDelay=200] Base delay in milliseconds before first retry.
 * @param {number} [options.maxDelay=5000] Maximum delay cap in milliseconds.
 * @param {Function} [options.shouldRetry] Predicate receiving the error; return false to abort early.
 * @returns {Promise<*>} The resolved value of fn.
 */
export async function retry(fn, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 200,
        maxDelay = 5000,
        shouldRetry = () => true,
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn(attempt);
        } catch (err) {
            lastError = err;

            if (attempt >= maxRetries || !shouldRetry(err, attempt)) {
                throw err;
            }

            const jitter = Math.random() * 0.3 + 0.85; // 0.85‒1.15
            const delay = Math.min(baseDelay * Math.pow(2, attempt) * jitter, maxDelay);
            await new Promise((r) => setTimeout(r, delay));
        }
    }

    throw lastError;
}