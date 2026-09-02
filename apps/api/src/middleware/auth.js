import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

const VALID_ROLES = new Set(["client", "freelancer", "admin"]);

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const payload = verifyAccessToken(authHeader.slice(7));
    if (!payload || typeof payload !== "object") {
      return fail(res, "Invalid token", 401);
    }

    const sub = typeof payload.sub === "string" ? payload.sub.trim() : "";
    if (!sub || !VALID_ROLES.has(payload.role)) {
      return fail(res, "Invalid token", 401);
    }

    req.user = payload;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }
  return next();
}
