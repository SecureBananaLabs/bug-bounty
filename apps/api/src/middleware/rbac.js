import { fail } from "../utils/response.js";

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, "Unauthorized", 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return fail(res, "Forbidden: insufficient permissions", 403);
    }
    next();
  };
}
