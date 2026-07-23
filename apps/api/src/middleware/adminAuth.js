import { fail } from "../utils/response.js";

/**
 * Middleware that verifies the authenticated user has admin role.
 * Must be used AFTER authMiddleware so req.user is set.
 */
export function adminAuthMiddleware(req, res, next) {
  if (!req.user) {
    return fail(res, "Authentication required", 401);
  }
  if (req.user.role !== "admin") {
    return fail(res, "Forbidden — admin access only", 403);
  }
  next();
}
