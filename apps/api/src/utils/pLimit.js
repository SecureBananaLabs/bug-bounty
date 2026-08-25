/**
 * Asynchronous concurrency limiter
 * Limits the number of concurrently executing promises
 * @param {number} concurrency - Maximum number of concurrent promises
 * @returns {Function} Limited function that queues promises
 */
function pLimit(concurrency) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new TypeError('Expected `concurrency` to be an integer >= 1');
  }

  let activeCount = 0;
  const queue = [];

  /**
   * Execute the next item in the queue
   */
  function next() {
    if (queue.length === 0 || activeCount >= concurrency) {
      return;
    }

    activeCount++;
    const { fn, resolve, reject } = queue.shift();

    Promise.resolve().then(fn).then(
      (value) => {
        activeCount--;
        next();
        resolve(value);
      },
      (error) => {
        activeCount--;
        next();
        reject(error);
      }
    );
  }

  /**
   * Limited function that queues the promise-returning function
   * @param {Function} fn - Async function to execute
   * @returns {Promise} Promise that resolves when the function completes
   */
  function limited(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
  }

  /**
   * Get the number of currently executing promises
   * @returns {number} Active count
   */
  limited.activeCount = () => activeCount;

  /**
   * Get the number of promises waiting in the queue
   * @returns {number} Pending count
   */
  limited.pendingCount = () => queue.length;

  /**
   * Clear all pending promises (reject them)
   * @param {Error} [error] - Error to reject with
   */
  limited.clearQueue = (error = new Error('Queue cleared')) => {
    for (const { reject } of queue) {
      reject(error);
    }
    queue.length = 0;
  };

  return limited;
}

module.exports = pLimit;
