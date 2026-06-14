import { fail } from "../utils/response.js";

export function adminOnlyMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Admin access required", 403);
  }

  return next();
}
