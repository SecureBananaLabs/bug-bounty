import { fail } from "../utils/response.js";

export function adminAuthMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return fail(res, "Forbidden: admin access required", 403);
  }
  return next();
}
