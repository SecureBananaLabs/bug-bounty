/**
 * Wraps an async route handler so that any thrown error
 * (including ZodError) is forwarded to the Express error handler.
 */
export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
