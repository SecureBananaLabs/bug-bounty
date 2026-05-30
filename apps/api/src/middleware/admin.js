import { fail } from "../utils/response.js";
import { authMiddleware } from "./auth.js";

export function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== "admin") {
      return fail(res, "Forbidden: admin access required", 403);
    }
    return next();
  });
}
