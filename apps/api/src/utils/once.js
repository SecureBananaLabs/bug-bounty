/**
 * @file once.js
 * Guaranteed single-execution function wrapper.
 * Ensures critical initialization tasks and migration routines run strictly once.
 */

'use strict';

/**
 * Creates a function that is restricted to invoking `fn` once.
 * Repeat calls to the function return the value of the first invocation.
 *
 * @param {Function} fn - The function to restrict.
 * @returns {Function} Returns the new restricted function.
 */
export function once(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError(`Expected a function in once, received ${typeof fn}`);
  }

  let called = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
      // Clean up reference if needed to allow GC of fn if closure survives
    }
    return result;
  };
}

/**
 * Creates an asynchronous function that executes at most once.
 * All subsequent concurrent and sequential calls await and return the same Promise.
 *
 * @param {Function} fn - The async function to restrict.
 * @returns {Function} Returns the async restricted function.
 */
export function onceAsync(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError(`Expected a function in onceAsync, received ${typeof fn}`);
  }

  let promise = null;

  return function (...args) {
    if (promise === null) {
      promise = Promise.resolve().then(() => fn.apply(this, args));
    }
    return promise;
  };
}
