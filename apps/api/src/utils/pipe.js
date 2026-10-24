/**
 * Composes synchronous functions left-to-right into a single transformation pipeline.
 *
 * @param {...Function} fns - Transformation functions to execute sequentially
 * @returns {(initialValue: any) => any}
 */
export function pipe(...fns) {
  for (const fn of fns) {
    if (typeof fn !== 'function') {
      throw new TypeError('All pipeline stages must be functions');
    }
  }

  return function (initialValue) {
    return fns.reduce((acc, fn) => fn(acc), initialValue);
  };
}

/**
 * Composes synchronous and asynchronous functions left-to-right into an async pipeline.
 *
 * @param {...Function} fns - Async or sync transformation functions
 * @returns {(initialValue: any) => Promise<any>}
 */
export function pipeAsync(...fns) {
  for (const fn of fns) {
    if (typeof fn !== 'function') {
      throw new TypeError('All async pipeline stages must be functions');
    }
  }

  return async function (initialValue) {
    let acc = await initialValue;
    for (const fn of fns) {
      acc = await fn(acc);
    }
    return acc;
  };
}

export default pipe;
