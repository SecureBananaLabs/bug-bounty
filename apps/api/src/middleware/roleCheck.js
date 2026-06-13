import { fail } from "../utils/response.js";

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, "Unauthorized", 401);
    }
    if (!roles.includes(req.user.role)) {
      return fail(res, "Forbidden", 403);
    }
    return next();
  };
}
