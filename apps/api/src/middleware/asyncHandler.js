export function asyncHandler(handler) {
  return function asyncRoute(req, res, next) {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
}
