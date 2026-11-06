// Express 4 only forwards errors that a handler returns or passes along, so a
// rejected promise from an async controller never reaches errorHandler. This
// wrapper hands the rejection to next() instead.
export function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
}
