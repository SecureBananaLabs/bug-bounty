/**
 * Validates that every provided argument in the function list is callable.
 * Throws a descriptive TypeError if an invalid argument is encountered.
 *
 * @param {Array<any>} fns - Array of functions to validate
 * @param {string} caller - Name of the calling pipeline constructor
 */
function assertFunctions(fns, caller) {
  for (let i = 0; i < fns.length; i++) {
    if (typeof fns[i] !== 'function') {
      throw new TypeError(`[${caller}] Expected a callable function at index ${i}, received ${typeof fns[i]}`);
    }
  }
}

/**
 * Creates a synchronous left-to-right functional pipeline.
 * The first function can accept multiple arguments; subsequent functions receive the output of the prior function.
 *
 * @param {...Function} fns - Functions to execute left-to-right
 * @returns {Function} The composed pipeline function
 */
export function pipe(...fns) {
  assertFunctions(fns, 'pipe');

  if (fns.length === 0) {
    return (input) => input;
  }

  return function composedPipe(...args) {
    let result = fns[0].apply(this, args);
    for (let i = 1; i < fns.length; i++) {
      result = fns[i].call(this, result);
    }
    return result;
  };
}

/**
 * Creates a synchronous right-to-left functional composition.
 * The innermost (rightmost) function can accept multiple arguments; preceding functions receive the output of the next function.
 *
 * @param {...Function} fns - Functions to execute right-to-left
 * @returns {Function} The composed function
 */
export function compose(...fns) {
  assertFunctions(fns, 'compose');

  if (fns.length === 0) {
    return (input) => input;
  }

  const reversed = [...fns].reverse();
  return function composed(...args) {
    let result = reversed[0].apply(this, args);
    for (let i = 1; i < reversed.length; i++) {
      result = reversed[i].call(this, result);
    }
    return result;
  };
}

/**
 * Creates an asynchronous left-to-right pipeline, resolving Promises at each stage.
 * Accepts both synchronous and asynchronous functions.
 *
 * @param {...Function} fns - Functions to execute sequentially from left to right
 * @returns {Function} An async function executing the pipeline
 */
export function pipeAsync(...fns) {
  assertFunctions(fns, 'pipeAsync');

  if (fns.length === 0) {
    return async (input) => input;
  }

  return async function composedPipeAsync(...args) {
    let result = await fns[0].apply(this, args);
    for (let i = 1; i < fns.length; i++) {
      result = await fns[i].call(this, result);
    }
    return result;
  };
}

/**
 * Creates an asynchronous right-to-left composition, resolving Promises at each stage.
 * Accepts both synchronous and asynchronous functions.
 *
 * @param {...Function} fns - Functions to execute sequentially from right to left
 * @returns {Function} An async function executing the composition
 */
export function composeAsync(...fns) {
  assertFunctions(fns, 'composeAsync');

  if (fns.length === 0) {
    return async (input) => input;
  }

  const reversed = [...fns].reverse();
  return async function composedAsync(...args) {
    let result = await reversed[0].apply(this, args);
    for (let i = 1; i < reversed.length; i++) {
      result = await reversed[i].call(this, result);
    }
    return result;
  };
}

export default {
  pipe,
  compose,
  pipeAsync,
  composeAsync,
};
