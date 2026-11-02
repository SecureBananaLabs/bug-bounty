import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

const BEARER_PATTERN = /^Bearer[ \t]+(\S+)$/i;

function extractBearerToken(authHeader) {
  if (typeof authHeader !== "string") {
    return null;
  }

  const match = BEARER_PATTERN.exec(authHeader.trim());
  return match ? match[1] : null;
}

export function authMiddleware(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);
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
