/**
 * Creates an asynchronous concurrency limiter function that throttles active executions.
 *
 * @param {number} concurrency Maximum number of concurrent tasks.
 * @returns {Function} Returns a limiter function `limit(fn, ...args)`.
 */
export function pLimit(concurrency) {
  if (
    typeof concurrency !== 'number' ||
    !Number.isFinite(concurrency) ||
    !Number.isInteger(concurrency) ||
    concurrency <= 0
  ) {
    throw new TypeError('Expected `concurrency` to be a positive integer');
  }

  const queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const task = queue.shift();
      task();
    }
  };

  const run = async (fn, resolve, reject, args) => {
    activeCount++;
    try {
      const result = await fn(...args);
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      next();
    }
  };

  const limit = (fn, ...args) => {
    if (typeof fn !== 'function') {
      return Promise.reject(new TypeError('Expected `fn` to be a function'));
    }

    return new Promise((resolve, reject) => {
      const task = () => run(fn, resolve, reject, args);
      task.reject = reject;

      if (activeCount < concurrency) {
        task();
      } else {
        queue.push(task);
      }
    });
  };

  Object.defineProperties(limit, {
    concurrency: {
      get: () => concurrency
    },
    activeCount: {
      get: () => activeCount
    },
    pendingCount: {
      get: () => queue.length
    },
    clearQueue: {
      value: (clearError) => {
        const error = clearError || new Error('Concurrency queue was cleared');
        while (queue.length > 0) {
          const task = queue.shift();
          if (typeof task.reject === 'function') {
            task.reject(error);
          }
        }
      }
    }
  });

  return limit;
}

export default pLimit;
