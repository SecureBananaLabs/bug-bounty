/**
 * Creates a function that is restricted to invoking fn once.
 * Repeat calls to the function return the value of the first invocation.
 * @template T
 * @param {(...args: any[]) => T} fn - Function to restrict
 * @returns {(...args: any[]) => T}
 */
export function once(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function');
  }

  let called = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
