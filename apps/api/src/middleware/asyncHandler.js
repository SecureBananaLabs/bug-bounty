// Wraps async controller functions to catch errors
// Express 4 does not catch rejected promises automatically
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
