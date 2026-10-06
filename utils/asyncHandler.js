export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      const error = err instanceof Error ? err : new Error(String(err ?? "Unknown error"));
      next(error);
    });
  };
}