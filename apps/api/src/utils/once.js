/**
 * Creates a function that is restricted to invoking `fn` at most once.
 * Subsequent calls return the value of the first invocation while preserving
 * `this` context and initial arguments.
 *
 * @template {(...args: any[]) => any} T
 * @param {T} fn - Function to restrict to a single execution
 * @returns {T & { isCalled: () => boolean, reset: () => void }}
 */
export function once(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function');
  }

  let called = false;
  let result;
  let targetFn = fn;

  const wrapper = function (...args) {
    if (!called) {
      called = true;
      result = targetFn.apply(this, args);
    }
    return result;
  };

  wrapper.isCalled = () => called;
  wrapper.reset = () => {
    called = false;
    result = undefined;
  };

  return wrapper;
}

export default once;
