import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const user = verifyAccessToken(authHeader.slice(7));
    if (user.role !== "admin") {
      return fail(res, "Admin access required", 403);
    }
    req.user = user;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}