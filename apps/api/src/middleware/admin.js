import { fail } from "../utils/response.js";

// Must run after authMiddleware: it only decides whether the already-verified
// token carries the admin role.
export function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }

  return next();
}
