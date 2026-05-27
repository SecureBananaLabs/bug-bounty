import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

const VALID_ROLES = ["client", "freelancer", "admin"];

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const decoded = verifyAccessToken(authHeader.slice(7));

    // Validate decoded payload has required identity claims
    if (typeof decoded !== "object" || decoded === null) {
      return fail(res, "Invalid token: payload must be an object", 401);
    }

    if (!decoded.sub || typeof decoded.sub !== "string" || decoded.sub.length === 0) {
      return fail(res, "Invalid token: missing or invalid sub claim", 401);
    }

    if (!decoded.role || !VALID_ROLES.includes(decoded.role)) {
      return fail(res, "Invalid token: missing or unsupported role claim", 401);
    }

    req.user = decoded;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
