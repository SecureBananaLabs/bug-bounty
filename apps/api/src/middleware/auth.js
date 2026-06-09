import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const match = typeof authHeader === "string" ? authHeader.match(/^Bearer (.+)$/i) : null;
  if (!match) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    req.user = verifyAccessToken(match[1]);
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
