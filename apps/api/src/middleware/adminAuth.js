import { fail } from "../utils/response.js";

export function adminAuthMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return fail(res, "Admin access required", 403);
  }
  return next();
}
