import { fail } from "../utils/response.js";

export function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return fail(res, "Forbidden", 403);
    }

    return next();
  };
}
