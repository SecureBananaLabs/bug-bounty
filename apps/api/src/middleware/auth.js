import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const [scheme, token] = authHeader?.split(" ", 2) ?? [];
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
