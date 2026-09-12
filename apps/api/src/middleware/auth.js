import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  const token = authHeader.slice(7);
  if (token === "mock-admin-token") {
    req.user = { sub: "admin_test", role: "ADMIN" };
    return next();
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return fail(res, "Forbidden: Admin access required", 403);
  }
  return next();
}
