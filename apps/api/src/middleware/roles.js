import { fail } from "../utils/response.js";

export function requireRole(role) {
  return function roleMiddleware(req, res, next) {
    if (req.user?.role === role) {
      return next();
    }

    return fail(res, "Forbidden", 403);
  };
}
