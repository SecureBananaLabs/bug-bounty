import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Middleware that enforces admin-only access.
 * Must be used AFTER `authMiddleware` (which populates req.user).
 * Verifies both the JWT identity AND that the caller has the ADMIN role.
 */
export function adminOnly(req, res, next) {
  if (!req.user) {
    return fail(res, "Authentication required", 401);
  }

  // Server-side role verification – client-side guard alone is NOT sufficient.
  if (req.user.role !== "ADMIN") {
    return fail(res, "Forbidden: admin access required", 403);
  }

  return next();
}
