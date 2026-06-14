import { ForbiddenError } from "../utils/errors.js";

export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  next();
}
