import { fail } from "../utils/response.js";

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, "Forbidden: insufficient role", 403);
    }
    return next();
  };
}
