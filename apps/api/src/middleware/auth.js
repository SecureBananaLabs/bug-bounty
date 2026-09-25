import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

const allowedRoles = new Set(["client", "freelancer", "admin"]);

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const claims = verifyAccessToken(authHeader.slice(7));
    const hasValidIdentity =
      claims &&
      typeof claims === "object" &&
      !Array.isArray(claims) &&
      typeof claims.sub === "string" &&
      claims.sub.trim().length > 0 &&
      allowedRoles.has(claims.role);

    if (!hasValidIdentity) {
      return fail(res, "Invalid token", 401);
    }

    req.user = claims;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
