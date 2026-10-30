import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const [scheme, ...tokenParts] = authHeader?.trim().split(/\s+/) ?? [];
  if (!scheme || scheme.toLowerCase() !== "bearer" || tokenParts.length === 0) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    req.user = verifyAccessToken(tokenParts.join(" "));
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
