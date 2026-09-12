/**
 * Async handler wrapper — catches both Error and non-Error rejections
 * from async controllers and delegates to Express error middleware.
 *
 * Problem: Without this, throwing null/undefined/strings/numbers in
 * an async controller causes unhandled promise rejections that:
 * - Bypass errorHandler middleware (client hangs)
 * - May crash the process
 * - Leak internal details
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    try {
      Promise.resolve(fn(req, res, next)).catch((err) => {
        const error = err instanceof Error
          ? err
          : new Error(String(err ?? "Unknown async error"));
        next(error);
      });
    } catch (err) {
      const error = err instanceof Error
        ? err
        : new Error(String(err ?? "Unknown sync error"));
      next(error);
    }
  };
}
