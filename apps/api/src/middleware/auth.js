import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const claims = verifyAccessToken(authHeader.slice(7));

    // Validate required identity claims are present and non-empty.
    // A token signed with the correct secret but missing 'sub' or 'role'
    // could bypass identity checks in controllers that read req.user.sub.
    if (!claims.sub || typeof claims.sub !== "string") {
      return fail(res, "Invalid token: missing subject claim", 401);
    }
    if (!claims.role || typeof claims.role !== "string") {
      return fail(res, "Invalid token: missing role claim", 401);
    }

    req.user = claims;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}

