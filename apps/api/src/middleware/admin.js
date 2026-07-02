import { fail } from "../utils/response.js";

export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }

  return next();
}
