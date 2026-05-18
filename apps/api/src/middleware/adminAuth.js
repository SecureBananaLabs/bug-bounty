import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  let user;
  try {
    user = verifyAccessToken(authHeader.slice(7));
  } catch {
    return fail(res, "Invalid token", 401);
  }

  if (user.role !== "admin") {
    return fail(res, "Forbidden: admin access required", 403);
  }

  req.user = user;
  return next();
}
