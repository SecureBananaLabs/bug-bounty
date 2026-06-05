import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

const ALLOWED_ROLES = ["client", "freelancer", "admin"];

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const payload = verifyAccessToken(authHeader.slice(7));
    
    // Validate payload is a plain object
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return fail(res, "Invalid token payload", 401);
    }
    
    // Validate sub claim exists and is a non-empty string
    if (typeof payload.sub !== "string" || payload.sub.trim() === "") {
      return fail(res, "Invalid token: missing subject", 401);
    }
    
    // Validate role claim exists and is an allowed value
    if (!ALLOWED_ROLES.includes(payload.role)) {
      return fail(res, "Invalid token: invalid role", 401);
    }
    
    req.user = payload;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
