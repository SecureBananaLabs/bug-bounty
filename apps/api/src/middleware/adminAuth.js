import { fail } from "../utils/response.js";

export function adminAuth(req, res, next) {
  if (!req.user) {
    return fail(res, "Unauthorized", 401);
  }
  if (req.user.role !== "admin") {
    return fail(res, "Forbidden: admin role required", 403);
  }
  return next();
}
