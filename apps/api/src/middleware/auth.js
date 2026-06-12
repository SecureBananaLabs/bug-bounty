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

// Restrict a route to authenticated users whose verified JWT carries the
// `admin` role. Must be mounted after `authMiddleware` so `req.user` is
// populated. Non-admin tokens receive 403; missing/invalid tokens are
// rejected earlier by `authMiddleware` with 401.
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }
  return next();
}
