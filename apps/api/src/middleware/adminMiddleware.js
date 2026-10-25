import { fail } from "../utils/response.js";

/**
 * Middleware that restricts access to admin users only.
 * Must be placed after authMiddleware (req.user must be populated).
 */
export function adminMiddleware(req, res, next) {
  if (!req.user) {
    return fail(res, "Authentication required", 401);
  }

  if (req.user.role !== "admin") {
    return fail(res, "Forbidden: admin access required", 403);
  }

  return next();
}
