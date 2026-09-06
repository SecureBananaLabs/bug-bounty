import { fail } from "../utils/response.js";

const ALLOWED_ROLES = ["admin"];

export default function adminOnly(req, res, next) {
  if (!req.user) {
    return fail(res, "Authentication required", 401);
  }

  if (!ALLOWED_ROLES.includes(req.user.role)) {
    return fail(res, "Admin access required", 403);
  }

  next();
}
