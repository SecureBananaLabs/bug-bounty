import { fail } from "../utils/response.js";

/**
 * Role-based access control middleware.
 * Must be used AFTER authMiddleware so req.user is populated.
 *
 * Usage:
 *   import { requireRole } from "../middleware/rbac.js";
 *   adminRoutes.use(requireRole("admin"));
 *
 * @param {...string} roles - One or more allowed roles
 * @returns {Function} Express middleware
 */
export function requireRole(...roles) {
  const allowed = new Set(roles);
  return function (req, res, next) {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }
    if (!allowed.has(req.user.role)) {
      return fail(res, "Forbidden — insufficient permissions", 403);
    }
    return next();
  };
}
