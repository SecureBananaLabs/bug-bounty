/**
 * Wraps an async route handler to forward rejections to Express error handler.
 * Express 4 does not automatically handle rejected promises from async route handlers.
 * @param {Function} fn - Async controller function
 * @returns {Function} Express-compatible middleware
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
