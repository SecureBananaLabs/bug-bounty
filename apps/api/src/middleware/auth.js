import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

// Match the Bearer scheme case-insensitively. RFC 6750 only mandates that the
// scheme name be matched case-insensitively by servers, so clients sending
// "bearer", "BEARER", or "Bearer" should all be accepted.
const BEARER_PATTERN = /^Bearer\s+/i;

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !BEARER_PATTERN.test(authHeader)) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const token = authHeader.replace(BEARER_PATTERN, "");
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
