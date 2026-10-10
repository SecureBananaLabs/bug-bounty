/**
 * Wraps an async route handler so Express 4 catches rejected promises
 * and forwards them to the error-handling middleware.
 *
 * Without this wrapper, any exception thrown inside an async handler
 * results in an unhandled promise rejection instead of a proper HTTP 500.
 *
 * @param {Function} fn – an async (req, res, next) route handler
 * @returns {Function} an Express-compatible middleware
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
