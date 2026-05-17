import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const payload = verifyAccessToken(authHeader.slice(7));
    if (payload.role !== "ADMIN") {
      return fail(res, "Forbidden: admin access required", 403);
    }
    req.user = payload;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
