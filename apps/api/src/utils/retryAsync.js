function assertFunction(value, name) {
  if (typeof value !== "function") {
    throw new TypeError(`retryAsync: ${name} must be a function`);
  }
}

function assertNonNegativeFiniteNumber(value, name) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || !Number.isFinite(value)) {
    throw new TypeError(`retryAsync: ${name} must be a non-negative finite number`);
  }
}

function assertNonNegativeNumber(value, name) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new TypeError(`retryAsync: ${name} must be a non-negative number`);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async (or sync) function with exponential backoff.
 *
 * @param {(attempt: number) => any} fn - function to invoke; may be sync or return a promise.
 * @param {object} [options]
 * @param {number} [options.retries=3] - maximum number of retries after the initial attempt.
 * @param {number} [options.delay=100] - base delay in ms before the first retry.
 * @param {number} [options.backoff=2] - multiplier applied to the delay after each retry.
 * @param {number} [options.maxDelay=Infinity] - upper bound on the delay between retries.
 * @param {(err: unknown, attempt: number) => boolean} [options.shouldRetry] - predicate controlling whether a given error is retryable.
 * @param {(err: unknown, attempt: number, nextDelay: number) => void} [options.onRetry] - callback invoked before waiting to retry.
 * @returns {Promise<any>} resolves with fn's result, or rejects with the terminal error once the retry budget is exhausted.
 */
export async function retryAsync(fn, options = {}) {
  assertFunction(fn, "fn");

  if (options === null || typeof options !== "object") {
    throw new TypeError("retryAsync: options must be an object");
  }

  const {
    retries = 3,
    delay = 100,
    backoff = 2,
    maxDelay = Infinity,
    shouldRetry = () => true,
    onRetry,
  } = options;

  if (!Number.isInteger(retries) || retries < 0) {
    throw new TypeError("retryAsync: retries must be a non-negative integer");
  }
  assertNonNegativeFiniteNumber(delay, "delay");
  assertNonNegativeFiniteNumber(backoff, "backoff");
  assertNonNegativeNumber(maxDelay, "maxDelay");
  assertFunction(shouldRetry, "shouldRetry");
  if (onRetry !== undefined) {
    assertFunction(onRetry, "onRetry");
  }

  let currentDelay = delay;

  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (err) {
      const canRetry = attempt <= retries && shouldRetry(err, attempt);
      if (!canRetry) {
        throw err;
      }

      const nextDelay = Math.min(currentDelay, maxDelay);

      if (onRetry) {
        onRetry(err, attempt, nextDelay);
      }

      if (nextDelay > 0) {
        await wait(nextDelay);
      }

      currentDelay *= backoff;
    }
  }
}
