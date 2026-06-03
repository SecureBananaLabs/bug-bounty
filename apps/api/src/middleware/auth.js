import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const payload = verifyAccessToken(authHeader.slice(7));

    // Reject decoded JWT payloads that are not plain objects.
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return fail(res, "Invalid token", 401);
    }

    // Reject tokens missing a non-empty string sub.
    if (typeof payload.sub !== "string" || payload.sub.trim() === "") {
      return fail(res, "Invalid token", 401);
    }

    // Reject tokens missing an allowed role value.
    const allowedRoles = ["client", "freelancer", "admin"];
    if (!allowedRoles.includes(payload.role)) {
      return fail(res, "Invalid token", 401);
    }

    req.user = payload;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
