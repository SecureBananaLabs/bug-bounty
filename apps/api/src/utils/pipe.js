/**
 * Compose functions sequentially, passing output of each as input to the next.
 * @param  {...Function} fns - Functions to compose
 * @returns {Function} Composed function
 */
export function pipe(...fns) {
  return (initialValue) => {
    return fns.reduce((value, fn) => fn(value), initialValue);
  };
}

/**
 * Create an async pipeline. Returns a function that, when called,
 * executes async functions sequentially.
 * @param  {...Function} fns - Async functions to compose
 * @returns {Function} Function that returns a Promise
 */
export function pipeAsync(...fns) {
  return async (initialValue) => {
    let value = initialValue;
    for (const fn of fns) {
      value = await fn(value);
    }
    return value;
  };
}
