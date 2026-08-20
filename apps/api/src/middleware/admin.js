import { fail } from "../utils/response.js";

/**
 * Admin-only middleware. Must be used after authMiddleware.
 * Checks that req.user.role === "admin" and returns 403 if not.
 */
export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return fail(res, "Forbidden: admin access required", 403);
  }
  return next();
}
