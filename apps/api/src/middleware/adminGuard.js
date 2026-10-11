import { fail } from "../utils/response.js";

export function adminGuard(req, res, next) {
  if (!req.user) {
    return fail(res, "Unauthorized", 401);
  }
  if (req.user.role !== "ADMIN") {
    return fail(res, "Forbidden — admin access required", 403);
  }
  return next();
}
