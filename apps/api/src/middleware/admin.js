import { fail } from "../utils/response.js";

export function adminRequired(req, res, next) {
  const role = req.user?.role?.toUpperCase();
  if (role !== "ADMIN") {
    return fail(res, "Forbidden: Admin role required", 403);
  }
  return next();
}
