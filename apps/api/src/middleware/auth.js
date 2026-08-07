import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const match = typeof authHeader === "string" ? authHeader.match(/^Bearer\s+(.+)$/i) : null;
  if (!match) {
    return fail(res, "Unauthorized", 401);
  }
  const token = match[1];

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
