/**
 * Async handler wrapper for Express route handlers.
 * Catches unhandled promise rejections and forwards them to Express error middleware.
 *
 * Usage:
 *   import { asyncHandler } from "../utils/asyncHandler.js";
 *   router.get("/users", asyncHandler(getUsers));
 */

/**
 * Wraps an async Express handler so rejected promises are caught
 * and forwarded to the next() error middleware instead of crashing the server.
 *
 * @param {Function} fn - An async Express handler (req, res, next) => Promise
 * @returns {Function} Wrapped handler with built-in error catching
 */
export function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
