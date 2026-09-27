import { fail } from "../utils/response.js";

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }

  return next();
}
