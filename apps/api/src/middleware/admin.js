import { fail } from "../utils/response.js";

/**
 * Middleware to verify the authenticated user has ADMIN role.
 * Must be used after authMiddleware.
 */
export function adminMiddleware(req, res, next) {
  if (!req.user) {
    return fail(res, "Unauthorized", 401);
  }
  if (req.user.role !== "ADMIN") {
    return fail(res, "Forbidden: Admin access required", 403);
  }
  return next();
}
