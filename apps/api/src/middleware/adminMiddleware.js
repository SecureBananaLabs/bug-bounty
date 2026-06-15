import { fail } from "../utils/response.js";

export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "ADMIN") {
    return next();
  }
  fail(res, "Access denied. Admin only.", 403);
};
