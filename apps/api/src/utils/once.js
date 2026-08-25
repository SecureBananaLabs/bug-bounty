/**
 * Returns a function that, when called, will execute the provided function 
 * exactly once and return the result of that first invocation.
 * 
 * @param {Function} fn - The function to be wrapped.
 * @returns {Function} A wrapped version of the function.
 */
const once = (fn) => {
  let ran = false;
  let result;

  return function(...args) {
    if (ran) {
      return result;
    }
    result = fn.apply(this, args);
    ran = true;
    return result;
  };
};

module.exports = once;