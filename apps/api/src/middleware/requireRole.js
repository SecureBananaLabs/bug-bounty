import { fail } from "../utils/response.js";

/**
 * Middleware that enforces a minimum role requirement.
 * Must be applied after authMiddleware (which populates req.user).
 *
 * @param {...string} allowedRoles - Roles permitted to access the route.
 */
export function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return fail(res, "Unauthorized", 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return fail(res, "Forbidden: insufficient role", 403);
    }
    return next();
  };
}
