export function asyncHandler(fn) {
  return function handledRequest(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
