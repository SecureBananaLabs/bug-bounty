import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerMatch = typeof authHeader === "string" ? authHeader.match(/^bearer\s+(.+)$/i) : null;

  if (!bearerMatch) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    req.user = verifyAccessToken(bearerMatch[1].trim());
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
