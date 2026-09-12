// Express 4 does not forward rejections from async handlers to next(), so an
// async controller that throws leaves the request hanging with no response.
// Wrap async handlers so domain errors reach the error middleware.
export function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
}
