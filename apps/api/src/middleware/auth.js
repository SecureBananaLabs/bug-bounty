import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !/^Bearer\s+/.test(authHeader)) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    req.user = verifyAccessToken(authHeader.replace(/^Bearer\s+/, ""));
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
