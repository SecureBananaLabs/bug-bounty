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

export function adminOnly(req, res, next) {
  const role = String(req.user?.role ?? "").toLowerCase();
  if (role !== "admin") {
    return fail(res, "Admin access required", 403);
  }

  return next();
}
