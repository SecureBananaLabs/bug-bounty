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

export function requireRole(...allowedRoles) {
  const allowed = new Set(allowedRoles);

  return function requireRoleMiddleware(req, res, next) {
    if (!req.user || !allowed.has(req.user.role)) {
      return fail(res, "Forbidden", 403);
    }

    return next();
  };
}
