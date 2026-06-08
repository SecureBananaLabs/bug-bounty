/**
 * Wraps async route handlers so Express 4 catches rejected promises
 * and forwards them to the error middleware.
 */
export function wrapAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
