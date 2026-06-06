import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    req.user = verifyAccessToken(authHeader.slice(7));
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}

/**
 * Middleware factory that enforces role-based access control.
 * Must be applied after authMiddleware (req.user must be set).
 *
 * Example:
 *   router.use(authMiddleware, requireRole("admin"));
 */
export function requireRole(...allowedRoles) {
  return function roleguard(req, res, next) {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      return fail(res, "Forbidden: insufficient role", 403);
    }
    return next();
  };
}

