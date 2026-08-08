import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

const allowedRoles = new Set(["client", "freelancer", "admin"]);

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const user = verifyAccessToken(authHeader.slice(7));

    if (
      typeof user.sub !== "string" ||
      user.sub.trim() === "" ||
      typeof user.role !== "string" ||
      !allowedRoles.has(user.role)
    ) {
      return fail(res, "Invalid token", 401);
    }

    req.user = user;
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
