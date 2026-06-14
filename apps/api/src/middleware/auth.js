import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

const ALLOWED_ROLES = new Set(["client", "freelancer", "admin"]);

function isValidAccessTokenPayload(payload) {
  return (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    typeof payload.sub === "string" &&
    payload.sub.trim().length > 0 &&
    ALLOWED_ROLES.has(payload.role)
  );
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const payload = verifyAccessToken(authHeader.slice(7));
    if (!isValidAccessTokenPayload(payload)) {
      return fail(res, "Invalid token", 401);
    }

    req.user = payload;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
