export function asyncHandler(handler) {
  return function handleAsync(req, res, next) {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
}
