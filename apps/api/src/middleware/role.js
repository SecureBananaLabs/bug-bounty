import { fail } from "../utils/response.js";

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return fail(res, "Forbidden: insufficient permissions", 403);
    }
    return next();
  };
}
