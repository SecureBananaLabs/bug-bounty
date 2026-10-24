/**
 * Defensive concurrency pool utility with strictly bounded concurrency, early AbortSignal
 * cancellation support, result ordering guarantee, and configurable error handling modes.
 *
 * Implements defenses against:
 * - Unbounded resource consumption and socket exhaustion (CWE-400)
 * - Race conditions and disordered asynchronous output
 * - Hanging promises and unhandled exception crashes (CWE-755)
 * - Memory leaks from unmanaged AbortSignal listeners
 * - Type mismatches and invalid task descriptors (CWE-1287)
 */

/**
 * Executes an array or iterable of async task functions with strictly bounded concurrency.
 *
 * @template T
 * @param {Iterable<() => Promise<T> | T>} tasks - Iterable collection of task factory functions
 * @param {number} limit - Maximum number of tasks executing concurrently (must be an integer >= 1)
 * @param {object} [options={}] - Configuration options
 * @param {'firstRejection'|'allSettled'} [options.mode='firstRejection'] - Error handling strategy
 * @param {AbortSignal} [options.signal] - AbortSignal for early cancellation
 * @param {(progress: { index: number, total: number, completed: number, running: number, result?: any, error?: any, status: 'fulfilled'|'rejected' }) => void} [options.onProgress] - Optional progress notification callback
 * @returns {Promise<T[] | PromiseSettledResult<T>[]>} Array of results preserving original task indices
 */
export function concurrencyPool(tasks, limit, options = {}) {
  // Validate tasks iterable
  if (tasks === null || tasks === undefined || typeof tasks[Symbol.iterator] !== 'function') {
    return Promise.reject(
      new TypeError(`[concurrencyPool] Expected tasks to be an iterable collection, received ${tasks === null ? 'null' : typeof tasks}`)
    );
  }

  // Validate limit
  if (typeof limit !== 'number' || Number.isNaN(limit) || !Number.isInteger(limit)) {
    return Promise.reject(
      new TypeError(`[concurrencyPool] Expected limit to be an integer, received ${typeof limit === 'number' ? 'NaN/float' : typeof limit}`)
    );
  }
  if (limit < 1) {
    return Promise.reject(
      new RangeError(`[concurrencyPool] Concurrency limit must be at least 1, received ${limit}`)
    );
  }

  // Validate options
  if (options !== null && typeof options !== 'object') {
    return Promise.reject(
      new TypeError(`[concurrencyPool] Expected options to be an object, received ${typeof options}`)
    );
  }

  const opts = options || {};
  const {
    mode = 'firstRejection',
    signal,
    onProgress,
  } = opts;

  if (mode !== 'firstRejection' && mode !== 'allSettled') {
    return Promise.reject(
      new TypeError(`[concurrencyPool] Invalid mode "${mode}". Supported modes are 'firstRejection' and 'allSettled'`)
    );
  }

  if (signal !== undefined && signal !== null && typeof signal !== 'object') {
    return Promise.reject(
      new TypeError(`[concurrencyPool] Expected signal to be an AbortSignal instance, received ${typeof signal}`)
    );
  }

  const taskList = Array.from(tasks);
  const total = taskList.length;

  if (total === 0) {
    return Promise.resolve([]);
  }

  // Check if already aborted
  if (signal?.aborted) {
    const reason = signal.reason !== undefined ? signal.reason : new Error('This operation was aborted');
    if (mode === 'allSettled') {
      return Promise.resolve(taskList.map(() => ({ status: 'rejected', reason })));
    }
    return Promise.reject(reason);
  }

  // Validate that all items in taskList are callable functions
  for (let i = 0; i < taskList.length; i++) {
    if (typeof taskList[i] !== 'function') {
      return Promise.reject(
        new TypeError(`[concurrencyPool] Task at index ${i} is not a function (received ${typeof taskList[i]})`)
      );
    }
  }

  return new Promise((resolve, reject) => {
    const results = new Array(total);
    let nextIndex = 0;
    let completedCount = 0;
    let runningCount = 0;
    let isTerminated = false;

    function cleanup() {
      if (signal && typeof signal.removeEventListener === 'function') {
        signal.removeEventListener('abort', onAbort);
      }
    }

    function terminate(error) {
      if (isTerminated) return;
      isTerminated = true;
      cleanup();
      reject(error);
    }

    function onAbort() {
      const reason = signal.reason !== undefined ? signal.reason : new Error('This operation was aborted');
      if (mode === 'firstRejection') {
        terminate(reason);
      } else {
        // In allSettled mode, cancel any unstarted tasks and settle them as rejected
        for (let i = nextIndex; i < total; i++) {
          results[i] = { status: 'rejected', reason };
          completedCount++;
        }
        nextIndex = total;
        if (runningCount === 0) {
          isTerminated = true;
          cleanup();
          resolve(results);
        }
      }
    }

    if (signal && typeof signal.addEventListener === 'function') {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    function runNext() {
      if (isTerminated) return;

      if (completedCount === total) {
        isTerminated = true;
        cleanup();
        resolve(results);
        return;
      }

      while (runningCount < limit && nextIndex < total && !isTerminated) {
        const index = nextIndex++;
        const taskFn = taskList[index];
        runningCount++;

        let taskPromise;
        try {
          const res = taskFn();
          taskPromise = Promise.resolve(res);
        } catch (syncErr) {
          taskPromise = Promise.reject(syncErr);
        }

        taskPromise
          .then((val) => {
            if (isTerminated) return;

            runningCount--;
            completedCount++;

            if (mode === 'allSettled') {
              results[index] = { status: 'fulfilled', value: val };
            } else {
              results[index] = val;
            }

            if (typeof onProgress === 'function') {
              try {
                onProgress({
                  index,
                  total,
                  completed: completedCount,
                  running: runningCount,
                  result: val,
                  status: 'fulfilled',
                });
              } catch {
                // Progress callback exceptions are silently absorbed to protect pipeline stability
              }
            }

            runNext();
          })
          .catch((err) => {
            if (isTerminated) return;

            runningCount--;
            completedCount++;

            if (mode === 'allSettled') {
              results[index] = { status: 'rejected', reason: err };

              if (typeof onProgress === 'function') {
                try {
                  onProgress({
                    index,
                    total,
                    completed: completedCount,
                    running: runningCount,
                    error: err,
                    status: 'rejected',
                  });
                } catch {
                  // Silent catch for callback safety
                }
              }

              runNext();
            } else {
              if (typeof onProgress === 'function') {
                try {
                  onProgress({
                    index,
                    total,
                    completed: completedCount,
                    running: runningCount,
                    error: err,
                    status: 'rejected',
                  });
                } catch {
                  // Silent catch
                }
              }
              terminate(err);
            }
          });
      }
    }

    runNext();
  });
}

/**
 * Concurrency pool specialized for Promise.all semantics (firstRejection).
 */
concurrencyPool.all = function poolAll(tasks, limit, options = {}) {
  if (options !== null && options !== undefined && typeof options !== 'object') {
    return Promise.reject(
      new TypeError(`[concurrencyPool.all] Expected options to be an object, received ${typeof options}`)
    );
  }
  return concurrencyPool(tasks, limit, { ...options, mode: 'firstRejection' });
};

/**
 * Concurrency pool specialized for Promise.allSettled semantics.
 */
concurrencyPool.allSettled = function poolAllSettled(tasks, limit, options = {}) {
  if (options !== null && options !== undefined && typeof options !== 'object') {
    return Promise.reject(
      new TypeError(`[concurrencyPool.allSettled] Expected options to be an object, received ${typeof options}`)
    );
  }
  return concurrencyPool(tasks, limit, { ...options, mode: 'allSettled' });
};

/**
 * Maps items through an async mapper with bounded concurrency.
 *
 * @template T, R
 * @param {T[]} items - Input items
 * @param {(item: T, index: number) => Promise<R> | R} mapper - Async mapping function
 * @param {number} limit - Concurrency limit
 * @param {object} [options={}] - Options
 * @returns {Promise<R[]>}
 */
concurrencyPool.map = function poolMap(items, mapper, limit, options = {}) {
  if (!Array.isArray(items)) {
    return Promise.reject(new TypeError('[concurrencyPool.map] Expected items to be an array'));
  }
  if (typeof mapper !== 'function') {
    return Promise.reject(new TypeError('[concurrencyPool.map] Expected mapper to be a function'));
  }
  if (options !== null && options !== undefined && typeof options !== 'object') {
    return Promise.reject(
      new TypeError(`[concurrencyPool.map] Expected options to be an object, received ${typeof options}`)
    );
  }
  const tasks = items.map((item, index) => () => mapper(item, index));
  return concurrencyPool(tasks, limit, options);
};

concurrencyPool.concurrencyPool = concurrencyPool;

export default concurrencyPool;
