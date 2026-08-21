/**
 * @file pipe.js
 * Functional pipeline composition helpers for synchronous and asynchronous transformations.
 */

'use strict';

/**
 * Composes synchronous functions from left to right.
 * The output of each function is passed as the input to the next function.
 *
 * @param  {...Function} fns - Transformation functions.
 * @returns {Function} A function that accepts an initial value and runs the pipeline.
 */
export function pipe(...fns) {
  if (fns.length === 0) {
    return (x) => x;
  }

  return function (initialValue) {
    return fns.reduce((acc, fn) => {
      if (typeof fn !== 'function') {
        throw new TypeError(`Expected a function in pipe, received ${typeof fn}`);
      }
      return fn(acc);
    }, initialValue);
  };
}

/**
 * Composes asynchronous functions or Promises from left to right.
 * Awaits each step sequentially.
 *
 * @param  {...Function} fns - Synchronous or asynchronous transformation functions.
 * @returns {Function} An async function that accepts an initial value and runs the async pipeline.
 */
export function pipeAsync(...fns) {
  if (fns.length === 0) {
    return async (x) => x;
  }

  return async function (initialValue) {
    let result = initialValue;
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      if (typeof fn !== 'function') {
        throw new TypeError(`Expected a function in pipeAsync at index ${i}, received ${typeof fn}`);
      }
      result = await fn(result);
    }
    return result;
  };
}
