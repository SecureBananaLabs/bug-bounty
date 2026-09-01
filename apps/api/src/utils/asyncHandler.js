/**
 * Wraps async route handlers so thrown errors (incl. ZodError) reach errorHandler.
 * Express 4 does NOT catch rejected promises from async handlers — without this
 * wrapper a single bad request body crashes the whole process (issue #12326/#12327).
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
