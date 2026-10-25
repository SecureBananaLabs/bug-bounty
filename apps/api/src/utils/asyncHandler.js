/**
 * Express 4 does not forward rejected promises to the error handler, so an
 * async controller that throws would leave the request hanging. Wrap the
 * handler so the error middleware always runs.
 */
export function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
