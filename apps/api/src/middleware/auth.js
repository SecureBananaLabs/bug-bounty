import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerMatch = authHeader?.match(/^Bearer +(.+)$/);
  if (!bearerMatch) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    req.user = verifyAccessToken(bearerMatch[1]);
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
