import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !/^bearer\s+/i.test(authHeader)) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const token = authHeader.replace(/^bearer\s+/i, "");
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
