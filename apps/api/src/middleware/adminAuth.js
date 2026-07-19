import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Admin-only middleware.
 * Verifies JWT token AND checks that the user has admin role.
 * Server-side enforcement — client-side guards are not sufficient.
 */
export function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const user = verifyAccessToken(authHeader.slice(7));
    if (user.role !== "admin") {
      return fail(res, "Forbidden: admin access required", 403);
    }
    req.user = user;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
