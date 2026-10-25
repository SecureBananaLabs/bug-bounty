import { fail } from "../utils/response.js";

/**
 * Middleware that verifies the authenticated user has an admin role.
 * Must be used after authMiddleware (req.user must be populated).
 */
export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return fail(res, "Forbidden: admin access required", 403);
  }
  return next();
}
