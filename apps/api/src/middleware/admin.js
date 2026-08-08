import { fail } from "../utils/response.js";

export function requireAdmin(req, res, next) {
  const role = String(req.user?.role ?? "").toLowerCase();

  if (role !== "admin") {
    return fail(res, "Forbidden", 403);
  }

  return next();
}
