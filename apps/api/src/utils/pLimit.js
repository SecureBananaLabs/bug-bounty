/**
 * Creates a concurrency limiter for async functions.
 * @param {number} concurrency - Maximum concurrent promises
 * @returns {<T>(fn: () => Promise<T>) => Promise<T>}
 */
export function pLimit(concurrency) {
  const limit = typeof concurrency === 'number' && concurrency > 0 ? Math.floor(concurrency) : 1;
  const queue = [];
  let active = 0;

  function next() {
    active--;
    if (queue.length > 0) {
      const task = queue.shift();
      task();
    }
  }

  function run(fn, resolve, reject, args) {
    active++;
    Promise.resolve()
      .then(() => fn(...args))
      .then(resolve, reject)
      .finally(() => next());
  }

  function generator(fn, ...args) {
    return new Promise((resolve, reject) => {
      if (active < limit) {
        run(fn, resolve, reject, args);
      } else {
        queue.push(() => run(fn, resolve, reject, args));
      }
    });
  }

  Object.defineProperties(generator, {
    activeCount: {
      get: () => active,
    },
    pendingCount: {
      get: () => queue.length,
    },
    clearQueue: {
      value: () => {
        queue.length = 0;
      },
    },
  });

  return generator;
}
