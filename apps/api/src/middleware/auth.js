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

// Fix #1465: Role-based access control middleware factory
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, "Unauthorized", 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return fail(res, `Forbidden: requires role(s): ${allowedRoles.join(", ")}`, 403);
    }
    return next();
  };
}
