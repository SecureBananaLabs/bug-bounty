import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const payload = verifyAccessToken(authHeader.slice(7));

    // Server-side identity claim validation – reject tokens without required fields
    if (!payload || !payload.sub || !payload.sub.startsWith("usr_")) {
      return fail(res, "Token missing valid identity claims", 401);
    }

    req.user = payload;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
