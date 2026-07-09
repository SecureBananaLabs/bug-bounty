import { fail } from "../utils/response.js";

export function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }

  return next();
}
