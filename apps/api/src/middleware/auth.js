import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

const allowedRoles = new Set(["client", "freelancer", "admin"]);

function hasUsableIdentityClaims(payload) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      typeof payload.sub === "string" &&
      payload.sub.trim().length > 0 &&
      typeof payload.role === "string" &&
      allowedRoles.has(payload.role)
  );
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const payload = verifyAccessToken(authHeader.slice(7));
    if (!hasUsableIdentityClaims(payload)) {
      return fail(res, "Invalid token claims", 401);
    }

    req.user = payload;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
