/**
 * Express 4 does not await async route handlers: a rejected promise never
 * reaches the error middleware, so the request hangs and the rejection is
 * reported as unhandled (which terminates the process by default).
 *
 * Wrapping a handler forwards its rejection to `next`, so the centralized
 * error handler can turn it into a response.
 */
export function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
}
