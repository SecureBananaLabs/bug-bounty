export function asyncHandler(handler) {
  return function asyncRouteHandler(req, res, next) {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
}
