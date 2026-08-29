/**
 * Composes synchronous functions from left to right.
 * @param {...Function} fns - Transformation functions
 * @returns {(initialValue: any) => any}
 */
export function pipe(...fns) {
  return (initialValue) => {
    return fns.reduce((acc, fn) => {
      if (typeof fn !== 'function') {
        throw new TypeError('Expected a function in pipeline');
      }
      return fn(acc);
    }, initialValue);
  };
}

/**
 * Composes asynchronous functions or promises from left to right.
 * @param {...Function} fns - Async transformation functions
 * @returns {(initialValue: any) => Promise<any>}
 */
export function pipeAsync(...fns) {
  return async (initialValue) => {
    let acc = initialValue;
    for (const fn of fns) {
      if (typeof fn !== 'function') {
        throw new TypeError('Expected a function in pipeline');
      }
      acc = await fn(acc);
    }
    return acc;
  };
}
