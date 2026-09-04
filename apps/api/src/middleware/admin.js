import { fail } from "../utils/response.js";

export function adminMiddleware(req, res, next) {
  const role = req.user?.role;
  if (role !== "ADMIN" && role !== "admin") {
    return fail(res, "Forbidden", 403);
  }
  return next();
}
