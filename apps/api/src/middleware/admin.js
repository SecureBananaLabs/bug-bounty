import { fail } from "../utils/response.js";

export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return fail(res, "Forbidden: Admins only", 403);
  }
  return next();
}
