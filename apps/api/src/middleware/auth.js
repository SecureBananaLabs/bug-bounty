import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

function getBearerToken(authHeader) {
  if (typeof authHeader !== "string") {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function authMiddleware(req, res, next) {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
