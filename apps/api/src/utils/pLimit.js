/**
 * @file pLimit.js
 * Asynchronous concurrency limiter and promise task queue.
 */

'use strict';

/**
 * Creates a concurrency-limited executor.
 *
 * @param {number} concurrency - Maximum number of concurrent tasks.
 * @returns {Function} Concurrency limiter executor with .activeCount, .pendingCount, and .clearQueue().
 */
export function pLimit(concurrency) {
  if (
    typeof concurrency !== 'number' ||
    concurrency < 1 ||
    !Number.isInteger(concurrency)
  ) {
    throw new TypeError(
      `Expected \`concurrency\` to be an integer from 1 and up, received \`${concurrency}\``
    );
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

  const enqueue = (fn, resolve, reject, args) => {
    queue.push(run.bind(null, fn, resolve, reject, args));

    (async () => {
      // Defer execution slightly to allow synchronous setup
      await Promise.resolve();

      if (activeCount < concurrency && queue.length > 0) {
        const task = queue.shift();
        task();
      }
    })();
  };

  const generator = (fn, ...args) =>
    new Promise((resolve, reject) => {
      enqueue(fn, resolve, reject, args);
    });

  Object.defineProperties(generator, {
    activeCount: {
      get: () => activeCount,
      enumerable: true,
    },
    pendingCount: {
      get: () => queue.length,
      enumerable: true,
    },
    clearQueue: {
      value: () => {
        queue.length = 0;
      },
      enumerable: true,
    },
  });

  return generator;
}
